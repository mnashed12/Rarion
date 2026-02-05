import urllib.request
import time

start = time.time()
try:
    response = urllib.request.urlopen('https://api.pokemontcg.io/v2/sets', timeout=10)
    data = response.read()
    print(f'✓ API responded in {time.time()-start:.1f}s')
    print(f'✓ Response size: {len(data)} bytes')
except Exception as e:
    print(f'✗ Failed after {time.time()-start:.1f}s: {type(e).__name__}: {e}')
