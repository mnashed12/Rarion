"""
Management command to import Pokemon card data from a CSV file.

Usage:
    python manage.py import_cards path/to/cards.csv

CSV Format:
    set_name,set_code,series,release_date,card_name,card_number,rarity,card_type

Example CSV:
    Base Set,BS,Original Series,1999-01-09,Charizard,4/102,holo_rare,pokemon
    Base Set,BS,Original Series,1999-01-09,Blastoise,2/102,holo_rare,pokemon
"""

import csv
import logging
from datetime import datetime
from django.core.management.base import BaseCommand, CommandError
from django.db import transaction
from inventory.models import PokemonSet, Card

logger = logging.getLogger(__name__)


class Command(BaseCommand):
    help = 'Import Pokemon card data from a CSV file'
    
    def add_arguments(self, parser):
        parser.add_argument(
            'csv_file',
            type=str,
            help='Path to the CSV file containing card data'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Parse and validate without saving to database'
        )
        parser.add_argument(
            '--skip-errors',
            action='store_true',
            help='Continue importing even if some rows have errors'
        )
        parser.add_argument(
            '--update-existing',
            action='store_true',
            help='Update existing cards if they already exist'
        )
    
    def handle(self, *args, **options):
        csv_file = options['csv_file']
        dry_run = options['dry_run']
        skip_errors = options['skip_errors']
        update_existing = options['update_existing']
        
        self.stdout.write(f'Importing cards from: {csv_file}')
        
        if dry_run:
            self.stdout.write(self.style.WARNING('DRY RUN MODE - No data will be saved'))
        
        try:
            with open(csv_file, 'r', encoding='utf-8') as file:
                reader = csv.DictReader(file)
                
                # Validate CSV headers
                required_headers = [
                    'set_name', 'set_code', 'card_name', 'card_number', 'rarity', 'card_type'
                ]
                if not all(header in reader.fieldnames for header in required_headers):
                    missing = [h for h in required_headers if h not in reader.fieldnames]
                    raise CommandError(f'Missing required CSV headers: {missing}')
                
                # Track statistics
                stats = {
                    'sets_created': 0,
                    'sets_existing': 0,
                    'cards_created': 0,
                    'cards_updated': 0,
                    'cards_skipped': 0,
                    'errors': 0,
                }
                
                # Cache for sets to reduce database queries
                set_cache = {}
                
                with transaction.atomic():
                    for row_num, row in enumerate(reader, start=2):  # Start at 2 (header is row 1)
                        try:
                            # Process the row
                            result = self._process_row(
                                row, 
                                row_num, 
                                set_cache, 
                                update_existing,
                                dry_run
                            )
                            
                            # Update statistics
                            if result['set_created']:
                                stats['sets_created'] += 1
                            elif result['set_existing']:
                                stats['sets_existing'] += 1
                            
                            if result['card_created']:
                                stats['cards_created'] += 1
                            elif result['card_updated']:
                                stats['cards_updated'] += 1
                            elif result['card_skipped']:
                                stats['cards_skipped'] += 1
                                
                        except Exception as e:
                            stats['errors'] += 1
                            error_msg = f'Row {row_num}: {str(e)}'
                            
                            if skip_errors:
                                self.stdout.write(self.style.WARNING(f'SKIPPED - {error_msg}'))
                                logger.warning(f'Import error: {error_msg}')
                            else:
                                raise CommandError(error_msg)
                    
                    # Rollback if dry run
                    if dry_run:
                        transaction.set_rollback(True)
                
                # Print summary
                self.stdout.write('')
                self.stdout.write(self.style.SUCCESS('=' * 50))
                self.stdout.write(self.style.SUCCESS('IMPORT COMPLETE'))
                self.stdout.write(self.style.SUCCESS('=' * 50))
                self.stdout.write(f'Sets created:    {stats["sets_created"]}')
                self.stdout.write(f'Sets existing:   {stats["sets_existing"]}')
                self.stdout.write(f'Cards created:   {stats["cards_created"]}')
                self.stdout.write(f'Cards updated:   {stats["cards_updated"]}')
                self.stdout.write(f'Cards skipped:   {stats["cards_skipped"]}')
                
                if stats['errors'] > 0:
                    self.stdout.write(self.style.WARNING(f'Errors:          {stats["errors"]}'))
                
                if dry_run:
                    self.stdout.write(self.style.WARNING('\nDRY RUN - No changes were saved'))
                    
        except FileNotFoundError:
            raise CommandError(f'File not found: {csv_file}')
        except csv.Error as e:
            raise CommandError(f'CSV parsing error: {str(e)}')
    
    def _process_row(self, row, row_num, set_cache, update_existing, dry_run):
        """Process a single CSV row and return result statistics."""
        result = {
            'set_created': False,
            'set_existing': False,
            'card_created': False,
            'card_updated': False,
            'card_skipped': False,
        }
        
        # Extract and validate data
        set_code = row['set_code'].strip().upper()
        set_name = row['set_name'].strip()
        card_name = row['card_name'].strip()
        card_number = row['card_number'].strip()
        rarity = row['rarity'].strip().lower()
        card_type = row['card_type'].strip().lower()
        
        # Optional fields
        series = row.get('series', '').strip()
        release_date_str = row.get('release_date', '').strip()
        total_cards = row.get('total_cards', '')
        
        # Validate rarity
        valid_rarities = [choice[0] for choice in Card.Rarity.choices]
        if rarity not in valid_rarities:
            raise ValueError(f'Invalid rarity "{rarity}". Must be one of: {valid_rarities}')
        
        # Validate card type
        valid_types = [choice[0] for choice in Card.CardType.choices]
        if card_type not in valid_types:
            raise ValueError(f'Invalid card_type "{card_type}". Must be one of: {valid_types}')
        
        # Parse release date
        release_date = None
        if release_date_str:
            try:
                release_date = datetime.strptime(release_date_str, '%Y-%m-%d').date()
            except ValueError:
                raise ValueError(f'Invalid date format "{release_date_str}". Use YYYY-MM-DD')
        
        # Parse total cards
        total_cards_int = 0
        if total_cards:
            try:
                total_cards_int = int(total_cards)
            except ValueError:
                pass
        
        # Get or create PokemonSet
        if set_code in set_cache:
            pokemon_set = set_cache[set_code]
            result['set_existing'] = True
        else:
            pokemon_set, created = PokemonSet.objects.get_or_create(
                set_code=set_code,
                defaults={
                    'name': set_name,
                    'series': series,
                    'release_date': release_date,
                    'total_cards': total_cards_int,
                }
            )
            set_cache[set_code] = pokemon_set
            
            if created:
                result['set_created'] = True
                self.stdout.write(f'  Created set: {set_name} ({set_code})')
            else:
                result['set_existing'] = True
        
        # Check if card exists
        existing_card = Card.objects.filter(
            pokemon_set=pokemon_set,
            card_number=card_number
        ).first()
        
        if existing_card:
            if update_existing:
                existing_card.name = card_name
                existing_card.rarity = rarity
                existing_card.card_type = card_type
                existing_card.save()
                result['card_updated'] = True
                self.stdout.write(f'  Updated card: {card_name} ({set_code} {card_number})')
            else:
                result['card_skipped'] = True
        else:
            Card.objects.create(
                name=card_name,
                card_number=card_number,
                pokemon_set=pokemon_set,
                rarity=rarity,
                card_type=card_type,
            )
            result['card_created'] = True
            self.stdout.write(f'  Created card: {card_name} ({set_code} {card_number})')
        
        return result
