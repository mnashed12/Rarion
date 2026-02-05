"""
Fix missing Charizard image URLs
"""
import os
import django
import urllib.request
import json

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
django.setup()

from inventory.models import Card

# Cards that need fixing
fixes = [
    {"set_code": "cel25", "card_number": "4A", "expected_url": "https://assets.tcgdex.net/en/swsh/cel25/4/high.webp"},
    {"set_code": "svp", "card_number": "196", "expected_url": "https://assets.tcgdex.net/en/sv/svp/196/high.webp"},
    {"set_code": "base1", "card_number": "4", "expected_url": "https://assets.tcgdex.net/en/base/base1/4/high.webp"},
    {"set_code": "smp", "card_number": "SM195", "expected_url": "https://assets.tcgdex.net/en/sm/smp/SM195/high.webp"},
    {"set_code": "smp", "card_number": "SM226", "expected_url": "https://assets.tcgdex.net/en/sm/smp/SM226/high.webp"},
    {"set_code": "smp", "card_number": "SM230", "expected_url": "https://assets.tcgdex.net/en/sm/smp/SM230/high.webp"},
    {"set_code": "sm7.5", "card_number": "3", "expected_url": "https://assets.tcgdex.net/en/sm/sm7.5/3/high.webp"},
]

print("Fixing Charizard image URLs...")
print("=" * 80)

for fix in fixes:
    try:
        card = Card.objects.get(
            pokemon_set__set_code=fix["set_code"],
            card_number=fix["card_number"]
        )
        
        old_url = card.image
        card.image = fix["expected_url"]
        card.save()
        
        print(f"✓ Fixed: {card.name} - {card.pokemon_set.name} (#{card.card_number})")
        print(f"  Old: {old_url or 'None'}")
        print(f"  New: {card.image}")
        print()
        
    except Card.DoesNotExist:
        print(f"✗ Not found: {fix['set_code']} #{fix['card_number']}")
        print()
    except Exception as e:
        print(f"✗ Error fixing {fix['set_code']} #{fix['card_number']}: {e}")
        print()

print("=" * 80)
print("Done! Check your frontend - images should now load.")
