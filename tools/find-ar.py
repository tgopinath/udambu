# Finds downloadable, openly licensed versions of each part that exist in the Objaverse mirror (for AR),
# and makes contact sheets in .work/ar-sheets for hand review.  python3 tools/find-ar.py [keys...]
import json, sys, subprocess, gzip, io, os, urllib.parse
from PIL import Image, ImageDraw
OK = {'CC Attribution', 'CC Attribution-ShareAlike', 'CC0 Public Domain', 'CC Attribution-NoDerivs', 'CC Attribution-NonCommercial', 'CC Attribution-NonCommercial-ShareAlike'}
paths = json.load(gzip.open('/tmp/claude-502/object-paths.json.gz'))
Q = json.load(open('tools/queries.json')); Q['body'] = ['human skeleton anatomy', 'human anatomy full body']
get = lambda u: subprocess.run(['curl', '-sL', '--max-time', '30', u], capture_output=True).stdout
os.makedirs('.work/ar-sheets', exist_ok=True); out = {}
for key, qs in Q.items():
    if sys.argv[1:] and key not in sys.argv[1:]: continue
    seen, c = set(), []
    for q in (qs if isinstance(qs, list) else [qs]):
        for page in range(2):
            d = json.loads(get('https://api.sketchfab.com/v3/search?type=models&downloadable=true&count=24&sort_by=-likeCount&q=' + urllib.parse.quote(q) + (f'&cursor={page*24}' if page else '')))
            for m in d.get('results', []):
                lic = (m.get('license') or {}).get('label') if isinstance(m.get('license'), dict) else None
                if m['uid'] in seen or m.get('isAgeRestricted') or m['uid'] not in paths or lic not in OK: continue
                seen.add(m['uid']); c.append(dict(uid=m['uid'], name=m['name'], user=m['user']['username'], by=m['user']['displayName'], likes=m['likeCount'], license=lic,
                    faces=m.get('faceCount'), path=paths[m['uid']], thumb=sorted(m['thumbnails']['images'], key=lambda x: abs(x['width'] - 256))[0]['url']))
    c = c[:8]; out[key] = c
    tiles = []
    for i, m in enumerate(c):
        try: im = Image.open(io.BytesIO(get(m['thumb']))).convert('RGB').resize((256, 144))
        except Exception: im = Image.new('RGB', (256, 144), 'gray')
        t = Image.new('RGB', (256, 176), 'white'); t.paste(im, (0, 0)); ImageDraw.Draw(t).text((4, 148), f"{i} {m['name'][:32]}\n{m['license'][:30]} {m['likes']}", fill='black'); tiles.append(t)
    S = Image.new('RGB', (1024, 352), 'white'); [S.paste(t, ((i % 4) * 256, (i // 4) * 176)) for i, t in enumerate(tiles)]; S.save(f'.work/ar-sheets/{key}.jpg', quality=80)
    print(key, len(c), flush=True)
json.dump(out, open('.work/ar-cands.json', 'w'), indent=1)
