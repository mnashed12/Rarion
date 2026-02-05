#!/usr/bin/env python
"""Check for cards with broken image URLs (404 errors)"""
import os
import sys
import django
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from inventory.models import Card

def check_image_url(card_info):
    """Check if image URL returns 200"""
    card_id, name, set_name, card_number, image_url = card_info
    try:
        response = requests.head(image_url, timeout=5, allow_redirects=True)
        if response.status_code != 200:
            return (card_id, name, set_name, card_number, image_url, response.status_code)
    except Exception as e:
        return (card_id, name, set_name, card_number, image_url, str(e))
    return None

print("CHECKING FOR BROKEN IMAGE URLS (404s)")
print("=" * 120)
print("This may take a few minutes...\n")

# Get a sample of cards to check - prioritize recently problematic sets
cards = Card.objects.select_related('pokemon_set').filter(
    pokemon_set__set_code__in=[
        'base1', 'base2', 'basep', 'ecard2', 'ecard3', 'bog',  # Known problematic
        'sm3.5', 'smp', 'svp', 'swshp',  # Promos
        'xy8', 'xyp',  # XY era
        'cel25', 'cel25c',  # Celebrations
    ]
).order_by('pokemon_set__name', 'card_number')[:500]

if cards.count() == 0:
    # If no specific sets found, just sample some cards
    cards = Card.objects.select_related('pokemon_set').order_by('?')[:200]

print(f"Checking {cards.count()} cards from problematic sets...\n")

card_infos = [
    (c.id, c.name, c.pokemon_set.name, c.card_number, c.image)
    for c in cards if c.image
]

broken = []
checked = 0

with ThreadPoolExecutor(max_workers=20) as executor:
    futures = {executor.submit(check_image_url, info): info for info in card_infos}
    
    for future in as_completed(futures):
        checked += 1
        if checked % 50 == 0:
            print(f"Checked {checked}/{len(card_infos)} images...")
        
        result = future.result()
        if result:
            broken.append(result)

print(f"\n{'=' * 120}")
print(f"RESULTS: {len(broken)} broken images found out of {len(card_infos)} checked\n")

if broken:
    # Group by set
    by_set = {}
    for card_id, name, set_name, card_number, url, status in broken:
        if set_name not in by_set:
            by_set[set_name] = []
        by_set[set_name].append((card_id, name, card_number, url, status))
    
    for set_name, cards in sorted(by_set.items()):
        print(f"\n{set_name} ({len(cards)} broken):")
        for card_id, name, card_number, url, status in cards[:10]:  # Show first 10
            print(f"  - {name} (#{card_number}): {status}")
            print(f"    URL: {url}")
        if len(cards) > 10:
            print(f"  ... and {len(cards) - 10} more")
else:
    print("✓ All checked images are loading correctly!")
