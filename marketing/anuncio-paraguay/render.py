"""Renderiza cada cena em MP4 (1080x1920, 30 fps) e junta tudo."""
import asyncio, subprocess, sys, os
from playwright.async_api import async_playwright
FPS = 30
SCENES = [('hook', 3.2), ('home', 3.4), ('rutina', 3.4), ('clases', 3.0), ('prog', 3.0), ('prof', 3.6), ('cta', 4.6)]
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, 'out')
only = sys.argv[1:]  # renderizar só algumas cenas, ou "stills"

async def main():
    os.makedirs(OUT, exist_ok=True)
    async with async_playwright() as p:
        b = await p.chromium.launch(executable_path=os.environ.get('CHROME', '/usr/bin/google-chrome'))
        pg = await (await b.new_context(viewport={'width': 1080, 'height': 1920})).new_page()
        await pg.goto('file://' + os.path.join(HERE, 'ad.html')); await pg.evaluate('prep()')
        if only == ['stills']:
            for name, d in SCENES:
                for t in [d * .5, d - .05]:
                    await pg.evaluate(f'frame("{name}", {t}, {d})')
                    await pg.screenshot(path=f'{OUT}/still_{name}_{t:.1f}.jpg', type='jpeg', quality=85)
            await b.close(); return
        for i, (name, d) in enumerate(SCENES):
            if only and name not in only: continue
            tmp = f'{OUT}/{i}_{name}.tmp.mp4'
            ff = subprocess.Popen(['ffmpeg', '-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', str(FPS), '-c:v', 'mjpeg', '-i', '-',
                                   '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '18', '-pix_fmt', 'yuv420p', '-r', str(FPS), tmp], stdin=subprocess.PIPE)
            n = round(d * FPS)
            for f in range(n):
                await pg.evaluate(f'frame("{name}", {f / FPS}, {d})')
                ff.stdin.write(await pg.screenshot(type='jpeg', quality=92))
            ff.stdin.close()
            if ff.wait() == 0: os.replace(tmp, f'{OUT}/{i}_{name}.mp4'); print('ok', name, n)
            else: print('FALHOU', name)
        await b.close()
asyncio.run(main())
