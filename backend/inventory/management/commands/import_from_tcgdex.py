"""
Management command to import Pokemon cards from TCGdex API.
TCGdex is faster and more reliable than Pokemon TCG API.

Usage:
    python manage.py import_from_tcgdex                    # Import all sets and cards
    python manage.py import_from_tcgdex --sets base1       # Import specific sets
    python manage.py import_from_tcgdex --limit 100        # Limit cards per set
"""

import time
import json
import urllib.request
from typing import Optional
from django.core.management.base import BaseCommand
from django.db import transaction
from inventory.models import PokemonSet, Card


class Command(BaseCommand):
    help = 'Import Pokemon cards from TCGdex API (faster alternative)'

    def add_arguments(self, parser):
        parser.add_argument(
            '--sets',
            nargs='+',
            type=str,
            help='Specific set IDs to import (e.g., base1 base2)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Maximum number of cards to import per set'
        )
        parser.add_argument(
            '--language',
            type=str,
            default='en',
            help='Language code (default: en)'
        )

    def handle(self, *args, **options):
        language = options['language']
        specific_sets = options['sets']
        limit = options['limit']

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== TCGdex Import Started ===\n'))

        # Import sets
        sets_to_import = self.import_sets(language, specific_sets)
        
        if not sets_to_import:
            self.stdout.write(self.style.WARNING('No sets to import'))
            return

        # Import cards for each set
        total_imported = 0
        total_skipped = 0

        for idx, (set_id, pokemon_set) in enumerate(sets_to_import.items(), 1):
            self.stdout.write(
                self.style.MIGRATE_HEADING(
                    f'\n[{idx}/{len(sets_to_import)}] {pokemon_set.name} ({set_id})'
                )
            )
            
            imported, skipped = self.import_cards_for_set(
                language, set_id, pokemon_set, limit
            )
            total_imported += imported
            total_skipped += skipped
            
            # Rate limiting
            time.sleep(0.5)

        # Summary
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Import Complete ==='))
        self.stdout.write(self.style.SUCCESS(f'✓ Sets: {len(sets_to_import)}'))
        self.stdout.write(self.style.SUCCESS(f'✓ Cards imported: {total_imported}'))
        if total_skipped > 0:
            self.stdout.write(self.style.WARNING(f'⊘ Cards skipped: {total_skipped}'))

    def import_sets(self, language: str, specific_set_ids: Optional[list] = None) -> dict:
        """Import Pokemon sets from TCGdex API."""
        self.stdout.write(self.style.MIGRATE_LABEL('\n→ Importing Pokemon Sets...'))
        
        try:
            url = f'https://api.tcgdex.net/v2/{language}/sets'
            response = urllib.request.urlopen(url, timeout=30)
            sets_data = json.loads(response.read())
            
            imported_sets = {}
            
            for set_data in sets_data:
                set_id = set_data['id']
                
                # Filter if specific sets requested
                if specific_set_ids and set_id not in specific_set_ids:
                    continue
                
                # Parse release date
                release_date = self._parse_date(set_data.get('releaseDate', ''))
                
                # Get full set details
                set_url = f'https://api.tcgdex.net/v2/{language}/sets/{set_id}'
                set_response = urllib.request.urlopen(set_url, timeout=30)
                full_set_data = json.loads(set_response.read())
                
                pokemon_set, created = PokemonSet.objects.update_or_create(
                    set_code=set_id,
                    defaults={
                        'name': set_data['name'],
                        'series': full_set_data.get('serie', {}).get('name', 'Unknown'),
                        'total_cards': full_set_data.get('cardCount', {}).get('total', 0),
                        'release_date': release_date,
                    }
                )
                
                imported_sets[set_id] = pokemon_set
                status = '✓ Created' if created else '⊙ Updated'
                self.stdout.write(f'  {status}: {pokemon_set.name}')
                
                time.sleep(0.2)  # Rate limiting
            
            return imported_sets
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error importing sets: {e}'))
            return {}

    def import_cards_for_set(
        self,
        language: str,
        set_id: str,
        pokemon_set: PokemonSet,
        limit: Optional[int] = None
    ) -> tuple[int, int]:
        """Import all cards for a specific set."""
        try:
            url = f'https://api.tcgdex.net/v2/{language}/sets/{set_id}'
            response = urllib.request.urlopen(url, timeout=30)
            set_data = json.loads(response.read())
            
            cards_data = set_data.get('cards', [])
            
            if limit:
                cards_data = cards_data[:limit]
            
            imported = 0
            skipped = 0
            
            for card_data in cards_data:
                try:
                    local_id = card_data.get('localId', '')
                    
                    # Check if exists
                    exists = Card.objects.filter(
                        pokemon_set=pokemon_set,
                        card_number=local_id
                    ).exists()
                    
                    if exists:
                        skipped += 1
                        continue
                    
                    # Use card data from set (no need for individual API call)
                    # Determine card type
                    card_type = 'pokemon'
                    category = card_data.get('category', '').lower()
                    if 'trainer' in category:
                        card_type = 'trainer'
                    elif 'energy' in category:
                        card_type = 'energy'
                    
                    # Get image URL from card data
                    image_url = ''
                    if 'image' in card_data:
                        # TCGdex image URLs need /high.webp appended
                        image_url = card_data['image'] + '/high.webp'
                    
                    # Create card
                    with transaction.atomic():
                        Card.objects.create(
                            pokemon_set=pokemon_set,
                            name=card_data.get('name', 'Unknown'),
                            card_number=local_id,
                            rarity=card_data.get('rarity', 'Common'),
                            card_type=card_type,
                            image=image_url,
                        )
                        imported += 1
                    
                except Exception as e:
                    self.stdout.write(f'  ✗ Error on card {local_id}: {str(e)[:50]}')
                    continue
            
            if imported > 0 or skipped > 0:
                self.stdout.write(f'  → Imported: {imported}, Skipped: {skipped}')
            return imported, skipped
            
        except Exception as e:
            self.stdout.write(self.style.ERROR(f'✗ Error importing cards: {e}'))
            return 0, 0

    def _parse_date(self, date_str: str):
        """Parse date from TCGdex format."""
        if not date_str:
            return None
        
        try:
            # TCGdex format: YYYY/MM/DD or YYYY-MM-DD
            date_str = date_str.replace('/', '-')
            return date_str
        except:
            return None
