import urllib.request
import json
import time

# Test TCGdex API
start = time.time()
try:
    # Try to get sets
    response = urllib.request.urlopen('https://api.tcgdex.net/v2/en/sets', timeout=10)
    data = json.loads(response.read())
    print(f'✓ TCGdex API responded in {time.time()-start:.1f}s')
    print(f'✓ Found {len(data)} sets')
    if data:
        print(f'✓ Example set: {data[0]["name"]} ({data[0]["id"]})')
except Exception as e:
    print(f'✗ Failed: {type(e).__name__}: {e}')
