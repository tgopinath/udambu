# Sketchfab candidates per body part -> contact sheets in .work/sheets for hand review
import json, sys, urllib.request, urllib.parse, io, os
from PIL import Image, ImageDraw
Q = json.load(open('tools/queries.json'))
os.makedirs('.work/sheets', exist_ok=True)
out = {}
import ssl, subprocess
def get(u):
    return subprocess.run(["curl","-sL","--max-time","30",u],capture_output=True).stdout
def _old(u):
    return urllib.request.urlopen(urllib.request.Request(u, headers={'User-Agent':'udambu'}), timeout=30).read()
only = sys.argv[1:]
for key, q in Q.items():
    if only and key not in only: continue
    seen, cands = set(), []
    for qq in q if isinstance(q, list) else [q]:
        d = json.loads(get('https://api.sketchfab.com/v3/search?type=models&count=24&sort_by=-likeCount&q=' + urllib.parse.quote(qq)))
        for m in d['results']:
            if m['uid'] in seen or m.get('isAgeRestricted'): continue
            seen.add(m['uid']); cands.append(m)
    cands = cands[:12]
    tiles = []
    for i, m in enumerate(cands):
        imgs = sorted(m['thumbnails']['images'], key=lambda x: abs(x['width'] - 256))
        try: im = Image.open(io.BytesIO(get(imgs[0]['url']))).convert('RGB').resize((256, 144))
        except Exception: im = Image.new('RGB', (256, 144), 'gray')
        t = Image.new('RGB', (256, 176), 'white'); t.paste(im, (0, 0))
        ImageDraw.Draw(t).text((4, 148), f"{i} {m['name'][:34]}\n{m['likeCount']} likes", fill='black')
        tiles.append(t)
    sheet = Image.new('RGB', (256 * 4, 176 * 3), 'white')
    for i, t in enumerate(tiles): sheet.paste(t, ((i % 4) * 256, (i // 4) * 176))
    sheet.save(f'.work/sheets/{key}.jpg', quality=80)
    out[key] = [{'uid': m['uid'], 'name': m['name'], 'user': m['user']['username'], 'likes': m['likeCount'], 'license': (m.get('license') or {}).get('label') if isinstance(m.get('license'), dict) else None} for m in cands]
    print(key, len(cands), flush=True)
prev = json.load(open('.work/cands.json')) if os.path.exists('.work/cands.json') else {}
prev.update(out); json.dump(prev, open('.work/cands.json', 'w'), indent=1)
