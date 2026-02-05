"""
Check Charizard card image URLs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
django.setup()

from inventory.models import Card

print("CHARIZARD CARDS AND THEIR IMAGE URLS:")
print("=" * 120)
print()

cards = Card.objects.filter(name__icontains='charizard').select_related('pokemon_set').order_by('pokemon_set__release_date')

for i, card in enumerate(cards, 1):
    print(f"{i}. {card.name} - {card.pokemon_set.name} ({card.pokemon_set.set_code}) #{card.card_number}")
    print(f"   Image URL: {card.image}")
    
    # Check if image URL looks valid
    if not card.image:
        print(f"   ❌ NO IMAGE URL")
    elif not card.image.startswith('http'):
        print(f"   ⚠️  INVALID URL (doesn't start with http)")
    elif '/high.webp' not in card.image and 'tcgdex.net' in card.image:
        print(f"   ⚠️  MISSING /high.webp suffix")
    elif 'tcgdex.net' not in card.image:
        print(f"   ⚠️  NOT A TCGDEX URL")
    else:
        print(f"   ✓ Looks OK")
    print()

print(f"Total Charizard cards found: {cards.count()}")
