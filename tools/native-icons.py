# Renders icon.svg into the iPhone and Android app icons and launch screens: python3 tools/native-icons.py
import subprocess, glob, os
from PIL import Image, ImageDraw
T = '/tmp/udambu-icons'; os.makedirs(T, exist_ok=True)
full = open('icon.svg').read().replace('rx="112" ', '')            # square art; the phone rounds the corners
open(f'{T}/full.svg', 'w').write(full)
subprocess.run(['qlmanage', '-t', '-s', '1024', '-o', T, f'{T}/full.svg', 'icon.svg'], capture_output=True)
sq = Image.open(f'{T}/full.svg.png').convert('RGB'); rounded = Image.open(f'{T}/icon.svg.png').convert('RGBA')
m = Image.new('L', rounded.size, 0); ImageDraw.Draw(m).rounded_rectangle((0, 0, *[x - 1 for x in rounded.size]), radius=int(rounded.size[0] * 112 / 512), fill=255); rounded.putalpha(m)
ios = os.path.expanduser('~/Documents/Udambu-iOS/Udambu/Assets.xcassets')
sq.save(f'{ios}/AppIcon.appiconset/icon-1024.png'); rounded.resize((360, 360), Image.LANCZOS).save(f'{ios}/LaunchIcon.imageset/icon.png')
res = os.path.expanduser('~/Documents/android-wrappers/udambu/android/app/src/main/res')
bg = sq.getpixel((8, 8))
for d, s in {'mdpi': 48, 'hdpi': 72, 'xhdpi': 96, 'xxhdpi': 144, 'xxxhdpi': 192}.items():
    sq.resize((s, s), Image.LANCZOS).save(f'{res}/mipmap-{d}/ic_launcher.png')
    c = Image.new('L', (s, s), 0); ImageDraw.Draw(c).ellipse((0, 0, s - 1, s - 1), fill=255); r = sq.resize((s, s), Image.LANCZOS).convert('RGBA'); r.putalpha(c); r.save(f'{res}/mipmap-{d}/ic_launcher_round.png')
    fs = int(s * 108 / 48); f = Image.new('RGB', (fs, fs), (5, 7, 11)); i = int(fs * .66); f.paste(sq.resize((i, i), Image.LANCZOS), ((fs - i) // 2, (fs - i) // 2)); f.save(f'{res}/mipmap-{d}/ic_launcher_foreground.png')
open(f'{res}/values/ic_launcher_background.xml', 'w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#05070B</color>\n</resources>\n')
for p in glob.glob(f'{res}/drawable*/splash.png'):
    w, h = Image.open(p).size; c = Image.new('RGBA', (w, h), (6, 8, 12, 255)); i = int(min(w, h) * .28)
    c.alpha_composite(rounded.resize((i, i), Image.LANCZOS), ((w - i) // 2, (h - i) // 2)); c.convert('RGB').save(p)
print('icons done')
