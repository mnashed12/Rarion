"""
Management command to import Pokemon cards from Pokemon TCG API.

Usage:
    python manage.py import_pokemon_cards                    # Import all sets and cards
    python manage.py import_pokemon_cards --sets base1 base2  # Import specific sets
    python manage.py import_pokemon_cards --limit 100         # Limit number of cards
    python manage.py import_pokemon_cards --download-images   # Download images to S3
"""

import time
import socket
from typing import Optional
from django.core.management.base import BaseCommand, CommandParser
from django.db import transaction
from pokemontcgsdk import Card as TCGCard, Set as TCGSet, RestClient
from inventory.models import PokemonSet, Card

# Set a global timeout for socket operations to prevent hanging
socket.setdefaulttimeout(30.0)  # 30 second timeout


class Command(BaseCommand):
    help = 'Import Pokemon cards from Pokemon TCG API into the database'

    def add_arguments(self, parser: CommandParser) -> None:
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
            '--download-images',
            action='store_true',
            help='Download and store images in S3 (requires AWS configuration)'
        )
        parser.add_argument(
            '--api-key',
            type=str,
            help='Pokemon TCG API key for higher rate limits (optional)'
        )
        parser.add_argument(
            '--skip-existing',
            action='store_true',
            default=True,
            help='Skip cards that already exist in database (default: True)'
        )

    def handle(self, *args, **options) -> None:
        # Configure API key if provided
        if options['api_key']:
            RestClient.configure(options['api_key'])
            self.stdout.write(self.style.SUCCESS('✓ API key configured'))

        download_images = options['download_images']
        limit = options['limit']
        skip_existing = options['skip_existing']
        specific_sets = options['sets']

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Pokemon Card Import Started ===\n'))

        # Import sets first
        sets_to_import = self.import_sets(specific_sets)
        
        if not sets_to_import:
            self.stdout.write(self.style.WARNING('No sets found to import'))
            return

        # Import cards for each set
        total_cards_imported = 0
        total_cards_skipped = 0
        
        for pokemon_set in sets_to_import:
            imported, skipped = self.import_cards_for_set(
                pokemon_set, 
                limit=limit,
                skip_existing=skip_existing,
                download_images=download_images
            )
            total_cards_imported += imported
            total_cards_skipped += skipped
            
            # Rate limiting - be nice to the API
            time.sleep(0.5)

        # Summary
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Import Complete ==='))
        self.stdout.write(self.style.SUCCESS(f'✓ Sets imported: {len(sets_to_import)}'))
        self.stdout.write(self.style.SUCCESS(f'✓ Cards imported: {total_cards_imported}'))
        if total_cards_skipped > 0:
            self.stdout.write(self.style.WARNING(f'⊘ Cards skipped: {total_cards_skipped}'))

    def import_sets(self, specific_set_ids: Optional[list] = None) -> list:
        """Import Pokemon sets from API or use existing database sets."""
        self.stdout.write(self.style.MIGRATE_LABEL('\n→ Importing Pokemon Sets...'))
        
        # Check if we have existing sets in the database
        existing_count = PokemonSet.objects.count()
        
        # If we have sets and no specific sets requested, use existing sets
        if existing_count > 0 and not specific_set_ids:
            self.stdout.write(self.style.WARNING(f'⊙ Using {existing_count} existing sets from database (skipping API call)'))
            return list(PokemonSet.objects.all())
        
        try:
            if specific_set_ids:
                # Import specific sets
                tcg_sets = []
                for set_id in specific_set_ids:
                    try:
                        tcg_set = TCGSet.find(set_id)
                        tcg_sets.append(tcg_set)
                    except Exception as e:
                        self.stdout.write(self.style.ERROR(f'✗ Error fetching set {set_id}: {str(e)}'))
            else:
                # Import all sets
                self.stdout.write(self.style.WARNING('⊙ Fetching sets from API (this may take a while)...'))
                tcg_sets = TCGSet.all()
            
            imported_sets = []
            
            for tcg_set in tcg_sets:
                # Parse release date properly
                release_date = self._parse_release_date(getattr(tcg_set, 'releaseDate', None))
                
                pokemon_set, created = PokemonSet.objects.update_or_create(
                    set_code=tcg_set.id,
                    defaults={
                        'name': tcg_set.name,
                        'series': getattr(tcg_set, 'series', 'Unknown'),
                        'total_cards': tcg_set.total or 0,
                        'release_date': release_date,
                    }
                )
                
                status = 'Created' if created else 'Updated'
                self.stdout.write(
                    self.style.SUCCESS(f'  ✓ {status}: {pokemon_set.name} ({pokemon_set.set_code})')
                )
                imported_sets.append(pokemon_set)
            
            return imported_sets
            
        except Exception as e:
            error_msg = str(e) if hasattr(e, '__str__') else 'API Error - timeout or connection issue'
            self.stdout.write(self.style.ERROR(f'✗ Error importing sets: {error_msg}'))
            # If API fails, use existing sets from database
            existing_sets = list(PokemonSet.objects.all())
            if existing_sets:
                self.stdout.write(self.style.WARNING(f'  ⟳ Using {len(existing_sets)} existing sets from database'))
            return existing_sets

    def import_cards_for_set(
        self, 
        pokemon_set: PokemonSet, 
        limit: Optional[int] = None,
        skip_existing: bool = True,
        download_images: bool = False
    ) -> tuple[int, int]:
        """Import all cards for a specific set."""
        self.stdout.write(
            self.style.MIGRATE_LABEL(f'\n→ Importing cards for {pokemon_set.name}...')
        )
        
        max_retries = 3
        retry_delay = 5  # seconds
        
        for attempt in range(max_retries):
            try:
                # Query cards by set
                query = f'set.id:{pokemon_set.set_code}'
                tcg_cards = TCGCard.where(q=query)
                
                if limit:
                    tcg_cards = tcg_cards[:limit]
                
                imported_count = 0
                skipped_count = 0
                
                for tcg_card in tcg_cards:
                    try:
                        # Check if card already exists
                        if skip_existing:
                            existing = Card.objects.filter(
                                pokemon_set=pokemon_set,
                                card_number=tcg_card.number
                            ).exists()
                            
                            if existing:
                                skipped_count += 1
                                continue
                        
                        # Determine card type
                        card_type = self._get_card_type(tcg_card)
                        
                        # Get image URL
                        image_url = self._get_image_url(tcg_card)
                        
                        # Create or update card
                        with transaction.atomic():
                            card, created = Card.objects.update_or_create(
                                pokemon_set=pokemon_set,
                                card_number=tcg_card.number,
                                defaults={
                                    'name': tcg_card.name,
                                    'rarity': tcg_card.rarity or 'Common',
                                    'card_type': card_type,
                                    'image': image_url,
                                }
                            )
                            
                            if created:
                                imported_count += 1
                                self.stdout.write(
                                    f'  ✓ {card.name} ({card.card_number})'
                                )
                            
                            # TODO: Download image to S3 if flag is set
                            if download_images and image_url:
                                self._download_image_to_s3(card, image_url)
                        
                        # Rate limiting
                        time.sleep(0.1)
                        
                    except Exception as e:
                        self.stdout.write(
                            self.style.ERROR(f'  ✗ Error importing card: {e}')
                        )
                        continue
            
                # Successfully completed the import
                return imported_count, skipped_count
            
            except (socket.timeout, TimeoutError, ConnectionError) as e:
                if attempt < max_retries - 1:
                    self.stdout.write(
                        self.style.WARNING(f'  ⊙ API timeout (attempt {attempt + 1}/{max_retries}), retrying in {retry_delay}s...')
                    )
                    time.sleep(retry_delay)
                    continue
                else:
                    self.stdout.write(
                        self.style.ERROR(f'✗ Max retries exceeded for {pokemon_set.name}. Skipping this set.')
                    )
                    return 0, 0
            
            except Exception as e:
                error_msg = str(e) if hasattr(e, '__str__') else 'API Error'
                self.stdout.write(self.style.ERROR(f'✗ Error querying cards: {error_msg}'))
                return 0, 0
        
        # Should never reach here, but just in case
        return 0, 0

    def _get_card_type(self, tcg_card) -> str:
        """Determine card type from TCG card data."""
        # Try to get supertype
        if hasattr(tcg_card, 'supertype') and tcg_card.supertype:
            supertype = tcg_card.supertype.lower()
            if 'pokémon' in supertype or 'pokemon' in supertype:
                return 'pokemon'
            elif 'trainer' in supertype:
                return 'trainer'
            elif 'energy' in supertype:
                return 'energy'
        
        # Fallback to types array
        if hasattr(tcg_card, 'types') and tcg_card.types:
            return 'pokemon'
        
        return 'trainer'  # Default

    def _get_image_url(self, tcg_card) -> str:
        """Extract the best quality image URL from TCG card."""
        if hasattr(tcg_card, 'images') and tcg_card.images:
            # Prefer large image, fallback to small
            if hasattr(tcg_card.images, 'large'):
                return tcg_card.images.large
            elif hasattr(tcg_card.images, 'small'):
                return tcg_card.images.small
        return ''

    def _download_image_to_s3(self, card: Card, image_url: str) -> None:
        """
        Download card image and upload to S3.
        TODO: Implement when AWS S3 is configured.
        """
        # This will be implemented later when S3 is set up
        pass

    def _parse_release_date(self, date_string: Optional[str]) -> Optional[str]:
        """Convert various date formats to YYYY-MM-DD."""
        if not date_string:
            return None
        
        try:
            from datetime import datetime
            
            # Try different date formats
            for fmt in ['%Y/%m/%d', '%m/%d/%Y', '%Y-%m-%d', '%d/%m/%Y']:
                try:
                    dt = datetime.strptime(date_string, fmt)
                    return dt.strftime('%Y-%m-%d')
                except ValueError:
                    continue
            
            # If all formats fail, return None
            return None
        except Exception:
            return None
