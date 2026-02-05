"""
Find all cards with missing or invalid image URLs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
django.setup()

from inventory.models import Card

print("FINDING CARDS WITH MISSING OR INVALID IMAGE URLS")
print("=" * 120)
print()

# Get all cards
all_cards = Card.objects.all()
total = all_cards.count()

# Find cards with issues
no_image = []
invalid_url = []
missing_webp = []
non_tcgdex = []

for card in all_cards:
    if not card.image:
        no_image.append(card)
    elif not card.image.startswith('http'):
        invalid_url.append(card)
    elif 'tcgdex.net' in card.image and '/high.webp' not in card.image:
        missing_webp.append(card)
    elif 'tcgdex.net' not in card.image and 'pokemontcg.io' in card.image:
        non_tcgdex.append(card)

print(f"Total cards: {total}")
print(f"Cards with NO image URL: {len(no_image)}")
print(f"Cards with invalid URL format: {len(invalid_url)}")
print(f"TCGdex URLs missing /high.webp: {len(missing_webp)}")
print(f"Cards using old Pokemon TCG API: {len(non_tcgdex)}")
print()

if no_image:
    print("=" * 120)
    print(f"CARDS WITH NO IMAGE URL ({len(no_image)} total):")
    print("=" * 120)
    for i, card in enumerate(no_image[:50], 1):  # Show first 50
        print(f"{i}. {card.name} - {card.pokemon_set.name} ({card.pokemon_set.set_code}) #{card.card_number}")
    if len(no_image) > 50:
        print(f"... and {len(no_image) - 50} more")
    print()

if non_tcgdex:
    print("=" * 120)
    print(f"CARDS USING OLD POKEMON TCG API ({len(non_tcgdex)} total):")
    print("=" * 120)
    for i, card in enumerate(non_tcgdex[:50], 1):
        print(f"{i}. {card.name} - {card.pokemon_set.name} ({card.pokemon_set.set_code}) #{card.card_number}")
        print(f"   {card.image}")
    if len(non_tcgdex) > 50:
        print(f"... and {len(non_tcgdex) - 50} more")
    print()

if invalid_url:
    print("=" * 120)
    print(f"CARDS WITH INVALID URL FORMAT ({len(invalid_url)} total):")
    print("=" * 120)
    for i, card in enumerate(invalid_url[:20], 1):
        print(f"{i}. {card.name} - {card.pokemon_set.name} ({card.pokemon_set.set_code}) #{card.card_number}")
        print(f"   {card.image}")
    print()

print("=" * 120)
print(f"TOTAL PROBLEMATIC CARDS: {len(no_image) + len(invalid_url) + len(missing_webp) + len(non_tcgdex)}")
