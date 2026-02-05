"""
Check card counts for Base sets
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
django.setup()

from inventory.models import PokemonSet, Card

print("BASE SETS AND THEIR CARD COUNTS:")
print("=" * 80)

base_sets = PokemonSet.objects.filter(series='Base').order_by('release_date')

total_cards = 0
for s in base_sets:
    card_count = Card.objects.filter(pokemon_set=s).count()
    total_cards += card_count
    print(f"{s.name:40} ({s.set_code:10}) - {card_count:4} cards")

print("=" * 80)
print(f"Total cards in Base series: {total_cards}")
print()

# Check a few other series too
print("\nOTHER SERIES CARD COUNTS:")
print("=" * 80)

series_list = ['EX', 'Diamond & Pearl', 'Platinum', 'HeartGold & SoulSilver', 
               'Black & White', 'XY', 'Sun & Moon', 'Sword & Shield', 'Scarlet & Violet']

for series_name in series_list:
    count = Card.objects.filter(pokemon_set__series=series_name).count()
    sets_count = PokemonSet.objects.filter(series=series_name).count()
    print(f"{series_name:30} - {sets_count:3} sets, {count:5} cards")

print()
print(f"TOTAL CARDS IN DATABASE: {Card.objects.count()}")
