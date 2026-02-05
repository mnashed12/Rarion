"""
Management command to import card prices from TCGdex API.

TCGdex provides pricing data from TCGplayer (USD) and Cardmarket (EUR).
This command fetches and updates prices for all cards in the database.

Usage:
    python manage.py import_prices                    # Update all cards
    python manage.py import_prices --set base1       # Update specific set
    python manage.py import_prices --limit 100       # Limit cards to update
"""

import time
import json
import urllib.request
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.utils import timezone
from inventory.models import Card, PokemonSet


class Command(BaseCommand):
    help = 'Import card prices from TCGdex API'

    def add_arguments(self, parser):
        parser.add_argument(
            '--set',
            type=str,
            help='Specific set code to update prices for (e.g., base1, swsh3)'
        )
        parser.add_argument(
            '--limit',
            type=int,
            help='Maximum number of cards to update'
        )
        parser.add_argument(
            '--delay',
            type=float,
            default=0.1,
            help='Delay between API requests in seconds (default: 0.1)'
        )

    def fetch_json(self, url):
        """Fetch JSON data from URL."""
        try:
            req = urllib.request.Request(
                url,
                headers={'User-Agent': 'PokemonInventory/1.0'}
            )
            with urllib.request.urlopen(req, timeout=10) as response:
                return json.loads(response.read().decode('utf-8'))
        except Exception as e:
            return None

    def handle(self, *args, **options):
        set_code = options['set']
        limit = options['limit']
        delay = options['delay']

        self.stdout.write(self.style.MIGRATE_HEADING('\n=== TCGdex Price Import Started ===\n'))

        # Get cards to update
        cards = Card.objects.select_related('pokemon_set').all()
        
        if set_code:
            cards = cards.filter(pokemon_set__set_code__iexact=set_code)
            self.stdout.write(f"Filtering by set: {set_code}")
        
        if limit:
            cards = cards[:limit]
            self.stdout.write(f"Limiting to {limit} cards")

        total_cards = cards.count()
        self.stdout.write(f"Processing {total_cards} cards...\n")

        updated = 0
        skipped = 0
        errors = 0

        for idx, card in enumerate(cards, 1):
            # Build TCGdex card ID (set_code-card_number format)
            # TCGdex uses lowercase set codes
            set_code_lower = card.pokemon_set.set_code.lower()
            card_num = card.card_number.split('/')[0]  # Handle "4/102" format
            
            # Try different ID formats
            card_ids_to_try = [
                f"{set_code_lower}-{card_num}",
                f"{set_code_lower}-{card_num.zfill(3)}",  # Zero-padded
                f"{set_code_lower}-{card_num.lstrip('0')}",  # No leading zeros
            ]
            
            price_data = None
            for card_id in card_ids_to_try:
                url = f"https://api.tcgdex.net/v2/en/cards/{card_id}"
                data = self.fetch_json(url)
                if data and 'pricing' in data:
                    price_data = data.get('pricing', {})
                    break
            
            if price_data:
                tcgplayer = price_data.get('tcgplayer') or {}
                cardmarket = price_data.get('cardmarket') or {}
                
                # Get normal variant prices first, fall back to other variants
                variant = tcgplayer.get('normal') or tcgplayer.get('holofoil') or tcgplayer.get('reverseHolofoil') or tcgplayer.get('reverse') or {}
                
                price_market = variant.get('marketPrice')
                price_low = variant.get('lowPrice')
                price_mid = variant.get('midPrice')
                price_high = variant.get('highPrice')
                
                # Fallback to Cardmarket (EUR) if no TCGplayer data
                # Convert EUR to approximate USD (1 EUR ≈ 1.10 USD)
                if not any([price_market, price_low, price_mid, price_high]) and cardmarket:
                    eur_to_usd = Decimal('1.10')
                    if cardmarket.get('trend'):
                        price_market = float(Decimal(str(cardmarket['trend'])) * eur_to_usd)
                    if cardmarket.get('low'):
                        price_low = float(Decimal(str(cardmarket['low'])) * eur_to_usd)
                    if cardmarket.get('avg'):
                        price_mid = float(Decimal(str(cardmarket['avg'])) * eur_to_usd)
                    if cardmarket.get('avg30'):
                        price_high = float(Decimal(str(cardmarket['avg30'])) * eur_to_usd)
                
                # Update if we have any price data
                if any([price_market, price_low, price_mid, price_high]):
                    card.price_market = Decimal(str(price_market)) if price_market else None
                    card.price_low = Decimal(str(price_low)) if price_low else None
                    card.price_mid = Decimal(str(price_mid)) if price_mid else None
                    card.price_high = Decimal(str(price_high)) if price_high else None
                    card.price_updated_at = timezone.now()
                    card.save(update_fields=['price_market', 'price_low', 'price_mid', 'price_high', 'price_updated_at'])
                    updated += 1
                    
                    if price_market:
                        self.stdout.write(f"  [{idx}/{total_cards}] ✓ {card.name}: ${price_market:.2f}")
                    else:
                        self.stdout.write(f"  [{idx}/{total_cards}] ✓ {card.name}: prices updated")
                else:
                    skipped += 1
                    self.stdout.write(self.style.WARNING(f"  [{idx}/{total_cards}] - {card.name}: no prices available"))
            else:
                skipped += 1
                if idx <= 10 or idx % 100 == 0:  # Only show first 10 and every 100th to reduce noise
                    self.stdout.write(self.style.WARNING(f"  [{idx}/{total_cards}] - {card.name}: not found in TCGdex"))
            
            # Rate limiting
            if delay > 0:
                time.sleep(delay)

        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'✓ Updated: {updated} cards'))
        self.stdout.write(self.style.WARNING(f'- Skipped: {skipped} cards'))
        if errors:
            self.stdout.write(self.style.ERROR(f'✗ Errors: {errors} cards'))
        self.stdout.write(self.style.MIGRATE_HEADING('\n=== Price Import Complete ===\n'))
