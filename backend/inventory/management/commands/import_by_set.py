"""
Management command to import Pokemon cards one set at a time with better error handling.

Usage:
    python manage.py import_by_set                          # Import all sets one at a time
    python manage.py import_by_set --start-from-set base1   # Resume from a specific set
"""

import time
import socket
from django.core.management.base import BaseCommand
from inventory.models import PokemonSet, Card
from pokemontcgsdk import Card as TCGCard, RestClient
from django.db import transaction

# Set timeout to avoid hanging
socket.setdefaulttimeout(30.0)


class Command(BaseCommand):
    help = 'Import Pokemon cards one set at a time with progress tracking'

    def add_arguments(self, parser):
        parser.add_argument(
            '--start-from-set',
            type=str,
            help='Set code to start/resume from (e.g., base1)'
        )
        parser.add_argument(
            '--api-key',
            type=str,
            help='Pokemon TCG API key for better rate limits'
        )

    def handle(self, *args, **options):
        start_from = options.get('start_from_set')
        api_key = options.get('api_key')
        
        # Configure API key if provided
        if api_key:
            RestClient.configure(api_key)
            self.stdout.write(self.style.SUCCESS('✓ API key configured'))
        
        # Get all sets from database (we already have 170 sets)
        all_sets = PokemonSet.objects.all().order_by('release_date', 'name')
        
        # If starting from a specific set, filter
        if start_from:
            start_set = PokemonSet.objects.filter(set_code=start_from).first()
            if start_set:
                all_sets = all_sets.filter(id__gte=start_set.id)
                self.stdout.write(self.style.WARNING(f'Starting from set: {start_set.name}'))
            else:
                self.stdout.write(self.style.ERROR(f'Set {start_from} not found'))
                return

        total_sets = all_sets.count()
        self.stdout.write(self.style.SUCCESS(f'\n=== Importing {total_sets} sets ===\n'))

        for index, pokemon_set in enumerate(all_sets, 1):
            self.stdout.write(
                self.style.MIGRATE_HEADING(
                    f'\n[{index}/{total_sets}] {pokemon_set.name} ({pokemon_set.set_code})'
                )
            )
            
            # Check how many cards already exist
            existing_count = Card.objects.filter(pokemon_set=pokemon_set).count()
            expected_count = pokemon_set.total_cards
            
            if existing_count == expected_count:
                self.stdout.write(
                    self.style.SUCCESS(
                        f'  ✓ Already complete ({existing_count}/{expected_count} cards)'
                    )
                )
                continue
            
            # Import cards for this set with retry logic
            success = self.import_set_cards(pokemon_set, existing_count, expected_count)
            
            if success:
                self.stdout.write(self.style.SUCCESS('  ✓ Import successful'))
            else:
                self.stdout.write(
                    self.style.ERROR(
                        f'  ✗ Failed to import {pokemon_set.name}. Resume with: --start-from-set {pokemon_set.set_code}'
                    )
                )
                # Don't stop, continue with next set
                continue
            
            # Rate limiting between sets
            time.sleep(2)

        self.stdout.write(self.style.SUCCESS('\n=== Import Complete ===\n'))

    def import_set_cards(self, pokemon_set, existing_count, expected_count):
        """Import all cards for a set with retry logic."""
        max_retries = 3
        retry_delay = 10
        
        for attempt in range(max_retries):
            try:
                # Query cards by set
                query = f'set.id:{pokemon_set.set_code}'
                self.stdout.write(f'  ⊙ Querying API... (attempt {attempt + 1}/{max_retries})')
                
                tcg_cards = TCGCard.where(q=query)
                
                imported = 0
                skipped = 0
                
                for tcg_card in tcg_cards:
                    try:
                        # Check if exists
                        exists = Card.objects.filter(
                            pokemon_set=pokemon_set,
                            card_number=tcg_card.number
                        ).exists()
                        
                        if exists:
                            skipped += 1
                            continue
                        
                        # Get image URL
                        image_url = None
                        if hasattr(tcg_card, 'images') and hasattr(tcg_card.images, 'large'):
                            image_url = tcg_card.images.large
                        
                        # Determine card type
                        card_type = 'pokemon'
                        if hasattr(tcg_card, 'supertype'):
                            supertype = tcg_card.supertype.lower()
                            if 'trainer' in supertype:
                                card_type = 'trainer'
                            elif 'energy' in supertype:
                                card_type = 'energy'
                        
                        # Create card
                        with transaction.atomic():
                            Card.objects.create(
                                pokemon_set=pokemon_set,
                                name=tcg_card.name,
                                card_number=tcg_card.number,
                                rarity=tcg_card.rarity or 'Common',
                                card_type=card_type,
                                image=image_url or '',
                            )
                            imported += 1
                        
                        # Rate limit
                        time.sleep(0.1)
                        
                    except Exception as e:
                        self.stdout.write(f'  ✗ Error on card: {str(e)[:50]}')
                        continue
                
                final_count = existing_count + imported
                self.stdout.write(
                    f'  → Imported: {imported}, Skipped: {skipped}, Total: {final_count}/{expected_count}'
                )
                return True
                
            except (socket.timeout, TimeoutError, ConnectionError) as e:
                if attempt < max_retries - 1:
                    self.stdout.write(
                        self.style.WARNING(
                            f'  ⊙ Timeout, retrying in {retry_delay}s...'
                        )
                    )
                    time.sleep(retry_delay)
                    retry_delay *= 2  # Exponential backoff
                else:
                    return False
                    
            except Exception as e:
                self.stdout.write(
                    self.style.ERROR(f'  ✗ Error: {str(e)[:100]}')
                )
                if attempt < max_retries - 1:
                    time.sleep(retry_delay)
                    retry_delay *= 2
                else:
                    return False
        
        return False
