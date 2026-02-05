"""
Import cards from a CSV file (TCGPlayer/collection export format)
Matches against existing cards in the database by name and card number.
"""

import csv
import re
from decimal import Decimal
from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.db.models import Q
from inventory.models import Card, PokemonSet, InventoryItem, Deck


class Command(BaseCommand):
    help = 'Import cards from a CSV file into a specified deck (matches existing cards)'

    def add_arguments(self, parser):
        parser.add_argument('csv_file', type=str, help='Path to the CSV file')
        parser.add_argument('--deck', type=str, default='Inventory', help='Name of the deck to import into')
        parser.add_argument('--clear', action='store_true', help='Clear the deck before importing')

    def handle(self, *args, **options):
        csv_file = options['csv_file']
        deck_name = options['deck']
        clear_deck = options.get('clear', False)
        
        # Get or create the deck
        User = get_user_model()
        default_user = User.objects.first()
        if not default_user:
            default_user = User.objects.create_user(username='default', password='default')
        
        deck, created = Deck.objects.get_or_create(
            name=deck_name,
            defaults={'owner': default_user}
        )
        if created:
            self.stdout.write(self.style.SUCCESS(f'Created new deck: {deck_name}'))
        else:
            self.stdout.write(f'Using existing deck: {deck_name}')
        
        # Clear deck if requested
        if clear_deck:
            deleted_count = InventoryItem.objects.filter(deck=deck).delete()[0]
            self.stdout.write(self.style.WARNING(f'Cleared {deleted_count} items from deck'))
        
        # Condition mapping
        condition_map = {
            'mint': 'mint',
            'near mint': 'near_mint',
            'lightly played': 'lightly_played',
            'moderately played': 'moderately_played',
            'heavily played': 'heavily_played',
            'damaged': 'damaged',
        }
        
        imported = 0
        updated = 0
        not_found = 0
        errors = 0
        not_found_cards = []
        
        self.stdout.write(f'\nSearching {Card.objects.count()} cards in database...\n')
        
        with open(csv_file, 'r', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            
            for row in reader:
                try:
                    # Clean up values (remove extra quotes)
                    card_name = row['Card Name'].strip('"').strip()
                    card_number = row['Number'].strip('"').strip()
                    set_name = row['Set'].strip('"').strip()
                    condition_str = row['Condition'].strip('"').strip().lower()
                    quantity = int(row['Quantity'])
                    variation = row.get('Variation', '').strip('"').strip()
                    
                    # Parse prices (remove $ and handle empty)
                    market_price_str = row.get('Market Price', '').replace('$', '').strip()
                    purchase_price_str = row.get('Acquisition Price', '').replace('$', '').strip()
                    
                    market_price = Decimal(market_price_str) if market_price_str else None
                    purchase_price = Decimal(purchase_price_str) if purchase_price_str else None
                    
                    # Map condition
                    condition = condition_map.get(condition_str, 'near_mint')
                    
                    # Try to find the card in the database
                    card = self._find_card(card_name, card_number, set_name)
                    
                    if not card:
                        not_found += 1
                        not_found_cards.append(f"{card_name} ({card_number}) - {set_name}")
                        continue
                    
                    # Get or create inventory item
                    inventory_item, inv_created = InventoryItem.objects.get_or_create(
                        card=card,
                        condition=condition,
                        deck=deck,
                        defaults={
                            'quantity': quantity,
                            'purchase_price': purchase_price,
                            'current_price': market_price or card.price_market,
                            'notes': f"Imported from CSV. Variation: {variation}" if variation else "Imported from CSV"
                        }
                    )
                    
                    if inv_created:
                        imported += 1
                        self.stdout.write(self.style.SUCCESS(
                            f'  ✓ Matched: {card.name} ({card.card_number}) - {card.pokemon_set.name}'
                        ))
                    else:
                        # Update quantity if already exists
                        inventory_item.quantity += quantity
                        if purchase_price:
                            inventory_item.purchase_price = purchase_price
                        if market_price:
                            inventory_item.current_price = market_price
                        inventory_item.save()
                        updated += 1
                        self.stdout.write(f'  ↑ Updated: {card.name} - qty now {inventory_item.quantity}')
                    
                except Exception as e:
                    errors += 1
                    self.stdout.write(self.style.ERROR(f'  ✗ Error importing row: {e}'))
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS(f'Import complete!'))
        self.stdout.write(f'  Matched & Imported: {imported}')
        self.stdout.write(f'  Updated existing: {updated}')
        self.stdout.write(f'  Not found in DB: {not_found}')
        self.stdout.write(f'  Errors: {errors}')
        self.stdout.write(f'  Deck: {deck_name}')
        
        if not_found_cards:
            self.stdout.write('')
            self.stdout.write(self.style.WARNING(f'Cards not found in database ({len(not_found_cards)}):'))
            for card_info in not_found_cards[:20]:  # Show first 20
                self.stdout.write(f'    - {card_info}')
            if len(not_found_cards) > 20:
                self.stdout.write(f'    ... and {len(not_found_cards) - 20} more')
    
    def _find_card(self, card_name, card_number, set_name):
        """
        Try to find a matching card in the database using multiple strategies.
        """
        # Clean up the card name (remove parenthetical variations)
        base_name = re.sub(r'\s*\([^)]*\)\s*$', '', card_name).strip()
        
        # Clean up card number
        clean_number = card_number.strip()
        # Normalize card number format (e.g., "63/106" -> "63/106", "006/102" -> "6/102")
        number_match = re.match(r'^0*(\d+)/0*(\d+)$', clean_number)
        if number_match:
            normalized_number = f"{number_match.group(1)}/{number_match.group(2)}"
        else:
            normalized_number = clean_number
        
        # Strategy 1: Exact match on name and card number
        card = Card.objects.filter(
            Q(name__iexact=card_name) | Q(name__iexact=base_name),
            card_number__iexact=clean_number
        ).first()
        if card:
            return card
        
        # Strategy 2: Try with normalized card number
        card = Card.objects.filter(
            Q(name__iexact=card_name) | Q(name__iexact=base_name),
            card_number__iexact=normalized_number
        ).first()
        if card:
            return card
        
        # Strategy 3: Match by card number and set name
        card = Card.objects.filter(
            Q(card_number__iexact=clean_number) | Q(card_number__iexact=normalized_number),
            pokemon_set__name__icontains=set_name.split()[0]  # First word of set name
        ).filter(
            Q(name__icontains=base_name.split()[0]) |  # First word of card name
            Q(name__icontains=base_name)
        ).first()
        if card:
            return card
        
        # Strategy 4: Fuzzy match on name, exact on number
        card = Card.objects.filter(
            Q(card_number__iexact=clean_number) | Q(card_number__iexact=normalized_number)
        ).filter(
            name__icontains=base_name.split()[0]  # Match first word of name
        ).first()
        if card:
            return card
        
        # Strategy 5: Match name with set (for promos without standard numbers)
        if 'promo' in set_name.lower() or len(clean_number) <= 4:
            card = Card.objects.filter(
                name__icontains=base_name
            ).filter(
                Q(pokemon_set__name__icontains='promo') |
                Q(pokemon_set__name__icontains=set_name.split()[0])
            ).first()
            if card:
                return card
        
        # Strategy 6: Just try name match as last resort
        card = Card.objects.filter(
            Q(name__iexact=card_name) | Q(name__iexact=base_name)
        ).first()
        if card:
            return card
        
        return None
    
    def _generate_set_code(self, set_name):
        """Generate a set code from the set name."""
        # Common set name to code mappings
        code_map = {
            'base set': 'BS',
            'jungle': 'JU',
            'fossil': 'FO',
            'team rocket': 'TR',
            'gym heroes': 'G1',
            'gym challenge': 'G2',
            'neo genesis': 'N1',
            'neo discovery': 'N2',
            'neo revelation': 'N3',
            'neo destiny': 'N4',
            'legendary collection': 'LC',
            'expedition': 'EX',
            'aquapolis': 'AQ',
            'skyridge': 'SK',
            'ruby & sapphire': 'RS',
            'sandstorm': 'SS',
            'dragon': 'DR',
            'team magma vs team aqua': 'MA',
            'hidden legends': 'HL',
            'firered & leafgreen': 'RG',
            'team rocket returns': 'TRR',
            'deoxys': 'DX',
            'emerald': 'EM',
            'unseen forces': 'UF',
            'delta species': 'DS',
            'legend maker': 'LM',
            'holon phantoms': 'HP',
            'crystal guardians': 'CG',
            'dragon frontiers': 'DF',
            'power keepers': 'PK',
            'diamond & pearl': 'DP',
            'diamond and pearl': 'DP',
            'mysterious treasures': 'MT',
            'secret wonders': 'SW',
            'great encounters': 'GE',
            'majestic dawn': 'MD',
            'legends awakened': 'LA',
            'stormfront': 'SF',
            'platinum': 'PL',
            'rising rivals': 'RR',
            'supreme victors': 'SV',
            'arceus': 'AR',
            'heartgold soulsilver': 'HS',
            'heartgold & soulsilver': 'HS',
            'unleashed': 'UL',
            'undaunted': 'UD',
            'triumphant': 'TM',
            'call of legends': 'CL',
            'black & white': 'BW',
            'emerging powers': 'EP',
            'noble victories': 'NV',
            'next destinies': 'ND',
            'dark explorers': 'DE',
            'dragons exalted': 'DRX',
            'boundaries crossed': 'BC',
            'plasma storm': 'PS',
            'plasma freeze': 'PF',
            'plasma blast': 'PB',
            'legendary treasures': 'LT',
            'xy': 'XY',
            'flashfire': 'FF',
            'furious fists': 'FFI',
            'phantom forces': 'PHF',
            'primal clash': 'PC',
            'roaring skies': 'ROS',
            'ancient origins': 'AO',
            'breakthrough': 'BT',
            'breakpoint': 'BP',
            'fates collide': 'FC',
            'steam siege': 'STS',
            'evolutions': 'EVO',
            'sun & moon': 'SM',
            'guardians rising': 'GR',
            'burning shadows': 'BS2',
            'crimson invasion': 'CI',
            'ultra prism': 'UP',
            'forbidden light': 'FL',
            'celestial storm': 'CS',
            'lost thunder': 'LT2',
            'team up': 'TU',
            'unbroken bonds': 'UB',
            'unified minds': 'UM',
            'cosmic eclipse': 'CE',
            'sword & shield': 'SSH',
            'rebel clash': 'RC',
            'darkness ablaze': 'DA',
            'vivid voltage': 'VV',
            'battle styles': 'BST',
            'chilling reign': 'CR',
            'evolving skies': 'ES',
            'fusion strike': 'FS',
            'brilliant stars': 'BRS',
            'astral radiance': 'ASR',
            'lost origin': 'LO',
            'silver tempest': 'ST',
            'crown zenith': 'CZ',
            'scarlet & violet': 'SVI',
            'paldea evolved': 'PE',
            'obsidian flames': 'OF',
            '151': '151',
            'paradox rift': 'PR',
            'paldean fates': 'PF2',
            'temporal forces': 'TF',
            'twilight masquerade': 'TM2',
            'shrouded fable': 'SF2',
            'stellar crown': 'SC',
            'surging sparks': 'SS2',
            'prismatic evolutions': 'PRI',
            'pop series 1': 'POP1',
            'pop series 2': 'POP2',
            'pop series 3': 'POP3',
            'pop series 4': 'POP4',
            'pop series 5': 'POP5',
            'diamond and pearl promos': 'DPP',
        }
        
        name_lower = set_name.lower().strip()
        if name_lower in code_map:
            return code_map[name_lower]
        
        # Generate code from first letters of words
        words = re.findall(r'[A-Za-z]+', set_name)
        if len(words) >= 2:
            return ''.join(w[0].upper() for w in words[:3])
        elif words:
            return words[0][:3].upper()
        return 'UNK'
