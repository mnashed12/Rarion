"""
Management command to generate sample data for testing.

Usage:
    python manage.py generate_sample_data
    python manage.py generate_sample_data --sets 5 --cards-per-set 20 --inventory 50

This creates sample Pokemon sets, cards, inventory items, and stream events
for development and testing purposes.
"""

import random
from decimal import Decimal
from datetime import timedelta
from django.core.management.base import BaseCommand
from django.utils import timezone
from django.db import transaction
from inventory.models import PokemonSet, Card, InventoryItem, StreamEvent, StreamInventory


class Command(BaseCommand):
    help = 'Generate sample data for development and testing'
    
    # Sample data for generation
    SAMPLE_SETS = [
        {'name': 'Base Set', 'set_code': 'BS', 'series': 'Original Series', 'year': 1999},
        {'name': 'Jungle', 'set_code': 'JU', 'series': 'Original Series', 'year': 1999},
        {'name': 'Fossil', 'set_code': 'FO', 'series': 'Original Series', 'year': 1999},
        {'name': 'Team Rocket', 'set_code': 'TR', 'series': 'Original Series', 'year': 2000},
        {'name': 'Neo Genesis', 'set_code': 'N1', 'series': 'Neo Series', 'year': 2000},
        {'name': 'Scarlet & Violet', 'set_code': 'SV', 'series': 'Scarlet & Violet', 'year': 2023},
        {'name': 'Paldea Evolved', 'set_code': 'PE', 'series': 'Scarlet & Violet', 'year': 2023},
        {'name': 'Obsidian Flames', 'set_code': 'OF', 'series': 'Scarlet & Violet', 'year': 2023},
        {'name': 'Paradox Rift', 'set_code': 'PR', 'series': 'Scarlet & Violet', 'year': 2023},
        {'name': 'Temporal Forces', 'set_code': 'TF', 'series': 'Scarlet & Violet', 'year': 2024},
    ]
    
    POKEMON_NAMES = [
        'Charizard', 'Blastoise', 'Venusaur', 'Pikachu', 'Mewtwo',
        'Mew', 'Dragonite', 'Gyarados', 'Alakazam', 'Gengar',
        'Machamp', 'Golem', 'Ninetales', 'Arcanine', 'Poliwrath',
        'Electabuzz', 'Magmar', 'Jynx', 'Tauros', 'Lapras',
        'Snorlax', 'Articuno', 'Zapdos', 'Moltres', 'Dratini',
        'Eevee', 'Vaporeon', 'Jolteon', 'Flareon', 'Porygon',
        'Bulbasaur', 'Charmander', 'Squirtle', 'Caterpie', 'Weedle',
        'Pidgey', 'Rattata', 'Spearow', 'Ekans', 'Sandshrew',
        'Nidoran', 'Clefairy', 'Vulpix', 'Jigglypuff', 'Zubat',
        'Oddish', 'Paras', 'Venonat', 'Diglett', 'Meowth',
    ]
    
    TRAINER_NAMES = [
        'Professor Oak', 'Bill', 'Pokemon Trader', 'Pokemon Breeder',
        'Energy Removal', 'Super Energy Removal', 'Computer Search',
        'Item Finder', 'Switch', 'Potion', 'Super Potion',
        'Full Heal', 'Revive', 'Rare Candy', 'Ultra Ball',
        'Great Ball', 'Poke Ball', 'Professor\'s Research', 'Boss\'s Orders',
        'Marnie', 'Judge', 'Cynthia', 'N', 'Colress',
    ]
    
    ENERGY_TYPES = [
        'Fire Energy', 'Water Energy', 'Grass Energy', 'Lightning Energy',
        'Psychic Energy', 'Fighting Energy', 'Darkness Energy', 'Metal Energy',
        'Fairy Energy', 'Dragon Energy', 'Colorless Energy', 'Double Colorless Energy',
    ]
    
    LOCATIONS = [
        'Binder A, Page 1', 'Binder A, Page 2', 'Binder A, Page 3',
        'Binder B, Page 1', 'Binder B, Page 2', 'Binder B, Page 3',
        'Top Loader Box 1', 'Top Loader Box 2', 'Graded Case',
        'Display Case', 'Storage Box A', 'Storage Box B',
    ]
    
    STREAM_TITLES = [
        'Opening Vintage Packs!',
        'Base Set Hunt Continues',
        'Searching for Charizard',
        'Modern Hits Only',
        'Graded Card Showcase',
        'Collection Update',
        'Rare Card Giveaway',
        'Pack Opening Marathon',
        'Vintage vs Modern',
        'Community Box Break',
    ]
    
    def add_arguments(self, parser):
        parser.add_argument(
            '--sets',
            type=int,
            default=5,
            help='Number of sets to create (default: 5)'
        )
        parser.add_argument(
            '--cards-per-set',
            type=int,
            default=15,
            help='Number of cards per set (default: 15)'
        )
        parser.add_argument(
            '--inventory',
            type=int,
            default=30,
            help='Number of inventory items to create (default: 30)'
        )
        parser.add_argument(
            '--streams',
            type=int,
            default=5,
            help='Number of stream events to create (default: 5)'
        )
        parser.add_argument(
            '--clear',
            action='store_true',
            help='Clear existing data before generating new data'
        )
    
    def handle(self, *args, **options):
        num_sets = min(options['sets'], len(self.SAMPLE_SETS))
        cards_per_set = options['cards_per_set']
        num_inventory = options['inventory']
        num_streams = options['streams']
        clear = options['clear']
        
        if clear:
            self.stdout.write(self.style.WARNING('Clearing existing data...'))
            StreamInventory.objects.all().delete()
            StreamEvent.objects.all().delete()
            InventoryItem.objects.all().delete()
            Card.objects.all().delete()
            PokemonSet.objects.all().delete()
            self.stdout.write(self.style.SUCCESS('Existing data cleared'))
        
        self.stdout.write(f'Generating sample data:')
        self.stdout.write(f'  - Sets: {num_sets}')
        self.stdout.write(f'  - Cards per set: {cards_per_set}')
        self.stdout.write(f'  - Inventory items: {num_inventory}')
        self.stdout.write(f'  - Stream events: {num_streams}')
        self.stdout.write('')
        
        with transaction.atomic():
            # Create sets
            sets = self._create_sets(num_sets)
            
            # Create cards
            cards = self._create_cards(sets, cards_per_set)
            
            # Create inventory items
            inventory_items = self._create_inventory(cards, num_inventory)
            
            # Create stream events
            streams = self._create_streams(num_streams)
            
            # Link inventory to streams
            self._create_stream_inventory(streams, inventory_items)
        
        self.stdout.write('')
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(self.style.SUCCESS('SAMPLE DATA GENERATED SUCCESSFULLY'))
        self.stdout.write(self.style.SUCCESS('=' * 50))
        self.stdout.write(f'Sets created:      {len(sets)}')
        self.stdout.write(f'Cards created:     {len(cards)}')
        self.stdout.write(f'Inventory created: {len(inventory_items)}')
        self.stdout.write(f'Streams created:   {len(streams)}')
    
    def _create_sets(self, num_sets):
        """Create sample Pokemon sets."""
        sets = []
        for i, set_data in enumerate(self.SAMPLE_SETS[:num_sets]):
            pokemon_set, created = PokemonSet.objects.get_or_create(
                set_code=set_data['set_code'],
                defaults={
                    'name': set_data['name'],
                    'series': set_data['series'],
                    'release_date': timezone.datetime(
                        set_data['year'], 
                        random.randint(1, 12), 
                        random.randint(1, 28)
                    ).date(),
                    'total_cards': random.randint(100, 200),
                }
            )
            sets.append(pokemon_set)
            status = 'created' if created else 'exists'
            self.stdout.write(f'  Set {status}: {pokemon_set.name}')
        
        return sets
    
    def _create_cards(self, sets, cards_per_set):
        """Create sample cards for each set."""
        cards = []
        
        for pokemon_set in sets:
            # Shuffle available names
            all_names = (
                self.POKEMON_NAMES.copy() + 
                self.TRAINER_NAMES.copy() + 
                self.ENERGY_TYPES.copy()
            )
            random.shuffle(all_names)
            
            for i in range(cards_per_set):
                card_number = f'{i + 1}/{cards_per_set + random.randint(0, 50)}'
                
                # Determine card type based on name
                if i < len(self.POKEMON_NAMES) and i < cards_per_set * 0.7:
                    name = self.POKEMON_NAMES[i % len(self.POKEMON_NAMES)]
                    card_type = Card.CardType.POKEMON
                elif i < cards_per_set * 0.9:
                    name = self.TRAINER_NAMES[i % len(self.TRAINER_NAMES)]
                    card_type = Card.CardType.TRAINER
                else:
                    name = self.ENERGY_TYPES[i % len(self.ENERGY_TYPES)]
                    card_type = Card.CardType.ENERGY
                
                # Random rarity with weighted distribution
                rarity_weights = [
                    (Card.Rarity.COMMON, 0.4),
                    (Card.Rarity.UNCOMMON, 0.25),
                    (Card.Rarity.RARE, 0.15),
                    (Card.Rarity.HOLO_RARE, 0.1),
                    (Card.Rarity.ULTRA_RARE, 0.07),
                    (Card.Rarity.SECRET_RARE, 0.03),
                ]
                rarity = random.choices(
                    [r[0] for r in rarity_weights],
                    weights=[r[1] for r in rarity_weights]
                )[0]
                
                card, created = Card.objects.get_or_create(
                    pokemon_set=pokemon_set,
                    card_number=card_number,
                    defaults={
                        'name': name,
                        'rarity': rarity,
                        'card_type': card_type,
                    }
                )
                
                if created:
                    cards.append(card)
        
        self.stdout.write(f'  Created {len(cards)} cards')
        return cards
    
    def _create_inventory(self, cards, num_inventory):
        """Create sample inventory items."""
        inventory_items = []
        
        if not cards:
            self.stdout.write(self.style.WARNING('No cards available for inventory'))
            return inventory_items
        
        # Select random cards for inventory
        selected_cards = random.sample(cards, min(num_inventory, len(cards)))
        
        for card in selected_cards:
            # Random condition with realistic distribution
            condition_weights = [
                (InventoryItem.Condition.MINT, 0.1),
                (InventoryItem.Condition.NEAR_MINT, 0.35),
                (InventoryItem.Condition.LIGHTLY_PLAYED, 0.25),
                (InventoryItem.Condition.MODERATELY_PLAYED, 0.15),
                (InventoryItem.Condition.HEAVILY_PLAYED, 0.1),
                (InventoryItem.Condition.DAMAGED, 0.05),
            ]
            condition = random.choices(
                [c[0] for c in condition_weights],
                weights=[c[1] for c in condition_weights]
            )[0]
            
            # Check if this card+condition combo already exists
            if InventoryItem.objects.filter(card=card, condition=condition).exists():
                continue
            
            # Generate realistic prices based on rarity
            base_prices = {
                Card.Rarity.COMMON: (0.10, 1.00),
                Card.Rarity.UNCOMMON: (0.25, 3.00),
                Card.Rarity.RARE: (1.00, 15.00),
                Card.Rarity.HOLO_RARE: (5.00, 50.00),
                Card.Rarity.ULTRA_RARE: (15.00, 150.00),
                Card.Rarity.SECRET_RARE: (30.00, 300.00),
            }
            
            price_range = base_prices.get(card.rarity, (1.00, 10.00))
            purchase_price = Decimal(str(round(random.uniform(*price_range), 2)))
            
            # Current price with some variance
            price_change = random.uniform(0.8, 1.5)
            current_price = Decimal(str(round(float(purchase_price) * price_change, 2)))
            
            item = InventoryItem.objects.create(
                card=card,
                condition=condition,
                quantity=random.randint(1, 5),
                purchase_price=purchase_price,
                current_price=current_price,
                location=random.choice(self.LOCATIONS),
                notes=f'Sample inventory item for {card.name}',
            )
            inventory_items.append(item)
        
        self.stdout.write(f'  Created {len(inventory_items)} inventory items')
        return inventory_items
    
    def _create_streams(self, num_streams):
        """Create sample stream events."""
        streams = []
        
        for i in range(num_streams):
            # Random date in the past 30 days
            stream_date = timezone.now() - timedelta(days=random.randint(0, 30))
            
            platform = random.choice([
                StreamEvent.Platform.TWITCH,
                StreamEvent.Platform.YOUTUBE,
                StreamEvent.Platform.OTHER,
            ])
            
            stream = StreamEvent.objects.create(
                title=random.choice(self.STREAM_TITLES) + f' #{i + 1}',
                stream_date=stream_date,
                platform=platform,
                notes=f'Sample stream event #{i + 1}',
            )
            streams.append(stream)
        
        self.stdout.write(f'  Created {len(streams)} stream events')
        return streams
    
    def _create_stream_inventory(self, streams, inventory_items):
        """Link inventory items to streams."""
        if not streams or not inventory_items:
            return
        
        links_created = 0
        
        for stream in streams:
            # Add 3-8 random items to each stream
            num_items = random.randint(3, min(8, len(inventory_items)))
            selected_items = random.sample(inventory_items, num_items)
            
            for item in selected_items:
                quantity_shown = random.randint(1, item.quantity)
                quantity_sold = random.randint(0, quantity_shown)
                
                StreamInventory.objects.create(
                    stream_event=stream,
                    inventory_item=item,
                    quantity_shown=quantity_shown,
                    quantity_sold=quantity_sold,
                    featured=random.random() < 0.2,  # 20% chance of being featured
                )
                links_created += 1
        
        self.stdout.write(f'  Created {links_created} stream inventory links')
