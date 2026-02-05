#!/usr/bin/env python
"""Fix cards with broken image URLs by trying alternate formats"""
import os
import sys
import django
import requests
from concurrent.futures import ThreadPoolExecutor, as_completed

# Setup Django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
django.setup()

from inventory.models import Card, PokemonSet
from django.db.models import Q

def check_url(url):
    """Check if URL returns 200"""
    try:
        response = requests.head(url, timeout=5, allow_redirects=True)
        return response.status_code == 200
    except:
        return False

def find_working_url(card):
    """Try different URL formats to find a working image"""
    set_code = card.pokemon_set.set_code
    card_num = card.card_number
    series = card.pokemon_set.series or ''
    
    # Determine series path
    series_map = {
        'Base': 'base',
        'Gym': 'gym',
        'Neo': 'neo',
        'Legendary Collection': 'base',
        'E-Card': 'ecard',
        'EX': 'ex',
        'Diamond & Pearl': 'dp',
        'Platinum': 'pl',
        'HeartGold & SoulSilver': 'hgss',
        'Black & White': 'bw',
        'XY': 'xy',
        'Sun & Moon': 'sm',
        'Sword & Shield': 'swsh',
        'Scarlet & Violet': 'sv',
    }
    
    # Find series path
    series_path = None
    for key, val in series_map.items():
        if key.lower() in series.lower():
            series_path = val
            break
    
    if not series_path:
        if set_code.startswith('sv'):
            series_path = 'sv'
        elif set_code.startswith('swsh'):
            series_path = 'swsh'
        elif set_code.startswith('sm'):
            series_path = 'sm'
        elif set_code.startswith('xy'):
            series_path = 'xy'
        elif set_code.startswith('bw'):
            series_path = 'bw'
        elif set_code.startswith('ecard'):
            series_path = 'ecard'
        elif set_code.startswith('ex'):
            series_path = 'ex'
        elif set_code in ['base1', 'base2', 'base3', 'base4', 'base5', 'base6', 'basep']:
            series_path = 'base'
        elif set_code.startswith('dp'):
            series_path = 'dp'
        elif set_code.startswith('pl'):
            series_path = 'pl'
        elif set_code.startswith('hgss'):
            series_path = 'hgss'
        elif set_code in ['gym1', 'gym2']:
            series_path = 'gym'
        elif set_code.startswith('neo'):
            series_path = 'neo'
        elif set_code == 'bog':
            series_path = 'ecard'
        elif set_code.startswith('cel'):
            series_path = 'swsh'
        else:
            series_path = set_code.split('-')[0] if '-' in set_code else set_code
    
    base_url = "https://assets.tcgdex.net/en"
    
    # Try different card number formats
    card_num_variants = [card_num]
    
    # If it has a letter suffix, try without it
    if card_num and len(card_num) > 1 and card_num[-1].isalpha():
        card_num_variants.append(card_num[:-1])
    
    # If it ends with a digit after a letter (e.g., 15A1), try without the final digit
    if card_num and len(card_num) > 2 and card_num[-1].isdigit() and card_num[-2].isalpha():
        card_num_variants.append(card_num[:-2])
        card_num_variants.append(card_num[:-1])
    
    # For H-series cards, try different formats
    if card_num and card_num.startswith('H'):
        # Try lowercase
        card_num_variants.append(card_num.lower())
        # Try without H prefix
        card_num_variants.append(card_num[1:])
    
    urls_to_try = []
    for num in card_num_variants:
        urls_to_try.append(f"{base_url}/{series_path}/{set_code}/{num}/high.webp")
    
    # Also try with different quality suffixes
    for num in card_num_variants:
        urls_to_try.append(f"{base_url}/{series_path}/{set_code}/{num}/low.webp")
    
    for url in urls_to_try:
        if check_url(url):
            return url
    
    return None

print("FIXING BROKEN IMAGE URLS")
print("=" * 120)

# First, find all cards with broken URLs
all_cards = Card.objects.select_related('pokemon_set').all()

# Check a subset that might have issues (variant cards, H-series, etc.)
problem_patterns = ['a', 'b', 'A', 'H', 'A1', 'A2', 'A3', 'A4']
potential_problems = []

for card in all_cards:
    num = card.card_number or ''
    # Check if card number has problematic patterns
    if any(num.endswith(p) for p in problem_patterns) or num.startswith('H'):
        potential_problems.append(card)

# Also check specific problematic sets entirely
problem_sets = ['bog']
for card in all_cards:
    if card.pokemon_set.set_code in problem_sets and card not in potential_problems:
        potential_problems.append(card)

print(f"Found {len(potential_problems)} cards with potentially problematic card numbers")
print("Checking URLs...")

# Check which are actually broken
broken_cards = []
for i, card in enumerate(potential_problems):
    if i % 50 == 0:
        print(f"Checking {i}/{len(potential_problems)}...")
    if card.image and not check_url(card.image):
        broken_cards.append(card)

print(f"\nFound {len(broken_cards)} actually broken images")

# Try to fix them
fixed = 0
unfixable = []

for card in broken_cards:
    new_url = find_working_url(card)
    if new_url:
        card.image = new_url
        card.save()
        fixed += 1
        print(f"  Fixed: {card.name} ({card.pokemon_set.name} #{card.card_number})")
    else:
        unfixable.append(card)

print(f"\n{'=' * 120}")
print(f"SUMMARY:")
print(f"  Fixed: {fixed} cards")
print(f"  Unfixable: {len(unfixable)} cards (no working URL found)")

if unfixable:
    print(f"\nUnfixable cards (need manual review):")
    by_set = {}
    for card in unfixable:
        set_name = card.pokemon_set.name
        if set_name not in by_set:
            by_set[set_name] = []
        by_set[set_name].append(card)
    
    for set_name, cards in sorted(by_set.items()):
        print(f"\n  {set_name}:")
        for card in cards[:5]:
            print(f"    - {card.name} (#{card.card_number})")
        if len(cards) > 5:
            print(f"    ... and {len(cards) - 5} more")
