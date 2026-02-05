"""
Check for missing Pokemon TCG sets against the comprehensive list
"""
import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pokemon_inventory_backend.settings')
django.setup()

from inventory.models import PokemonSet

# Comprehensive list of all major Pokemon TCG sets
EXPECTED_SETS = {
    "Base / Original Era": [
        "Base Set", "Jungle", "Fossil", "Base Set 2", "Team Rocket",
        "Gym Heroes", "Gym Challenge", "Neo Genesis", "Neo Discovery",
        "Neo Revelation", "Neo Destiny", "Legendary Collection"
    ],
    "e-Card Era": [
        "Expedition Base Set", "Aquapolis", "Skyridge"
    ],
    "EX Era": [
        "EX Ruby & Sapphire", "EX Sandstorm", "EX Dragon",
        "EX Team Magma vs Team Aqua", "EX Hidden Legends",
        "EX FireRed & LeafGreen", "EX Team Rocket Returns",
        "EX Deoxys", "EX Emerald", "EX Unseen Forces",
        "EX Delta Species", "EX Legend Maker", "EX Holon Phantoms",
        "EX Crystal Guardians", "EX Dragon Frontiers", "EX Power Keepers"
    ],
    "Diamond & Pearl Era": [
        "Diamond & Pearl", "Mysterious Treasures", "Secret Wonders",
        "Great Encounters", "Majestic Dawn", "Legends Awakened", "Stormfront"
    ],
    "Platinum Era": [
        "Platinum", "Rising Rivals", "Supreme Victors", "Arceus"
    ],
    "HeartGold & SoulSilver Era": [
        "HeartGold & SoulSilver", "Unleashed", "Undaunted",
        "Triumphant", "Call of Legends"
    ],
    "Black & White Era": [
        "Black & White", "Emerging Powers", "Noble Victories",
        "Next Destinies", "Dark Explorers", "Dragons Exalted",
        "Boundaries Crossed", "Plasma Storm", "Plasma Freeze",
        "Plasma Blast", "Legendary Treasures"
    ],
    "XY Era": [
        "XY", "Flashfire", "Furious Fists", "Phantom Forces",
        "Primal Clash", "Roaring Skies", "Ancient Origins",
        "BREAKthrough", "BREAKpoint", "Fates Collide",
        "Steam Siege", "Evolutions"
    ],
    "Sun & Moon Era": [
        "Sun & Moon", "Guardians Rising", "Burning Shadows",
        "Crimson Invasion", "Ultra Prism", "Forbidden Light",
        "Celestial Storm", "Dragon Majesty", "Lost Thunder",
        "Team Up", "Detective Pikachu", "Unbroken Bonds",
        "Unified Minds", "Hidden Fates", "Cosmic Eclipse"
    ],
    "Sword & Shield Era": [
        "Sword & Shield", "Rebel Clash", "Darkness Ablaze",
        "Champion's Path", "Vivid Voltage", "Shining Fates",
        "Battle Styles", "Chilling Reign", "Evolving Skies",
        "Celebrations", "Fusion Strike", "Brilliant Stars",
        "Astral Radiance", "Pokémon GO", "Lost Origin",
        "Silver Tempest", "Crown Zenith"
    ],
    "Scarlet & Violet Era": [
        "Scarlet & Violet", "Paldea Evolved", "Obsidian Flames",
        "151", "Paradox Rift", "Temporal Forces",
        "Twilight Masquerade", "Shrouded Fable", "Stellar Crown",
        "Surging Sparks"
    ]
}

def normalize_name(name):
    """Normalize set names for comparison"""
    # Remove common prefixes and normalize characters
    name = name.lower()
    name = name.replace('ex ', '').replace('&', '').replace('é', 'e')
    name = name.replace(' ', '').strip()
    return name

# Get all sets from database
db_sets = PokemonSet.objects.all()
db_set_names = {normalize_name(s.name): s.name for s in db_sets}

print("=" * 80)
print("CHECKING FOR MISSING POKEMON TCG SETS")
print("=" * 80)
print()

missing_sets = []
found_count = 0
total_count = 0

for era, sets in EXPECTED_SETS.items():
    print(f"\n{era}")
    print("-" * len(era))
    
    for set_name in sets:
        total_count += 1
        normalized = normalize_name(set_name)
        
        # Check if we have this set
        found_match = None
        for db_norm, db_name in db_set_names.items():
            if normalized == db_norm or normalized in db_norm or db_norm in normalized:
                found_match = db_name
                break
        
        if found_match:
            status = f"✓ ({found_match})"
            found_count += 1
        else:
            status = "✗ MISSING"
            missing_sets.append(set_name)
        
        print(f"  {status:60} {set_name}")

print()
print("=" * 80)
print(f"SUMMARY: {found_count}/{total_count} sets found")
print(f"Missing {len(missing_sets)} sets")
print("=" * 80)

if missing_sets:
    print("\nMISSING SETS:")
    for set_name in missing_sets:
        print(f"  - {set_name}")
else:
    print("\n✓ All major Pokemon TCG sets are present!")
