"""
Fix ALL cards with missing or invalid image URLs
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
django.setup()

from inventory.models import Card
from django.db.models import Q

print("FIXING ALL CARDS WITH MISSING OR INVALID IMAGE URLS")
print("=" * 120)
print()

# Find all problematic cards
problematic_cards = Card.objects.filter(
    Q(image__isnull=True) | 
    Q(image='') | 
    Q(image__contains='pokemontcg.io')
).select_related('pokemon_set')

total = problematic_cards.count()
print(f"Found {total} cards that need fixing...")
print()

fixed_count = 0
failed_count = 0
failed_cards = []

for card in problematic_cards:
    try:
        # Build TCGdex URL based on set code and card number
        set_code = card.pokemon_set.set_code
        card_number = card.card_number
        
        # Determine the series path for TCGdex
        series = card.pokemon_set.series
        
        # Map series to TCGdex paths
        series_map = {
            'Base': 'base',
            'E-Card': 'ecard',
            'EX': 'ex',
            'Diamond & Pearl': 'dp',
            'Platinum': 'pl',
            'HeartGold & SoulSilver': 'hgss',
            'Call of Legends': 'col',
            'Black & White': 'bw',
            'XY': 'xy',
            'Sun & Moon': 'sm',
            'Sword & Shield': 'swsh',
            'Scarlet & Violet': 'sv',
            'POP': 'pop',
            'Legendary Collection': 'lc',
            'Trainer kits': 'tk',
            'Pokémon TCG Pocket': 'tcgp',
            'Mega Evolution': 'me',
        }
        
        # Get series path
        series_path = series_map.get(series, series.lower().replace(' ', '').replace('&', ''))
        
        # Build URL
        new_url = f"https://assets.tcgdex.net/en/{series_path}/{set_code}/{card_number}/high.webp"
        
        # Update the card
        card.image = new_url
        card.save(update_fields=['image'])
        
        fixed_count += 1
        
        if fixed_count % 100 == 0:
            print(f"Fixed {fixed_count}/{total} cards...")
            
    except Exception as e:
        failed_count += 1
        failed_cards.append(f"{card.name} ({card.pokemon_set.set_code} #{card.card_number}): {e}")

print()
print("=" * 120)
print(f"SUMMARY:")
print(f"  Fixed: {fixed_count} cards")
print(f"  Failed: {failed_count} cards")
print("=" * 120)

if failed_cards:
    print("\nFailed cards:")
    for fail in failed_cards[:20]:
        print(f"  - {fail}")
    if len(failed_cards) > 20:
        print(f"  ... and {len(failed_cards) - 20} more")
else:
    print("\n✓ All cards fixed successfully!")
