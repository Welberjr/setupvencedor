from pathlib import Path

from PIL import Image, ImageDraw, ImageFilter, ImageFont


ROOT = Path(__file__).resolve().parents[1]
PUBLIC = ROOT / 'public'
BRAND = PUBLIC / 'brand' / 'setup-vencedor-sv-approved.png'


def font(name: str, size: int) -> ImageFont.FreeTypeFont:
    return ImageFont.truetype(Path('C:/Windows/Fonts') / name, size=size)


def main() -> None:
    mark = Image.open(BRAND).convert('RGBA')
    for size, destination in ((512, 'icon-512.png'), (192, 'icon-192.png'), (180, 'apple-touch-icon.png')):
        mark.resize((size, size), Image.Resampling.LANCZOS).save(PUBLIC / destination, 'PNG', optimize=True)

    mark.resize((512, 512), Image.Resampling.LANCZOS).save(
        PUBLIC / 'favicon.ico',
        format='ICO',
        sizes=[(16, 16), (32, 32), (48, 48)],
    )

    image = Image.new('RGB', (1200, 630), '#070a10')
    draw = ImageDraw.Draw(image)
    for y in range(630):
        ratio = y / 630
        draw.line((0, y, 1200, y), fill=(7 + int(5 * ratio), 10 + int(9 * ratio), 16 + int(9 * ratio)))
    for x in range(0, 1201, 36):
        draw.line((x, 0, x, 630), fill='#0f1520', width=1)
    for y in range(0, 631, 36):
        draw.line((0, y, 1200, y), fill='#0f1520', width=1)

    halo = Image.new('RGBA', image.size, (0, 0, 0, 0))
    halo_draw = ImageDraw.Draw(halo)
    halo_draw.ellipse((690, -10, 1280, 590), fill=(180, 255, 46, 52))
    halo = halo.filter(ImageFilter.GaussianBlur(52))
    image = Image.alpha_composite(image.convert('RGBA'), halo)
    draw = ImageDraw.Draw(image)
    draw.rounded_rectangle((42, 42, 1158, 588), radius=26, outline=(180, 255, 46, 70), width=2)
    draw.line((92, 155, 410, 155), fill=(180, 255, 46, 82), width=2)
    draw.ellipse((87, 150, 97, 160), fill='#b4ff2e')

    mono = font('consola.ttf', 18)
    headline = font('arialbd.ttf', 67)
    body = font('arial.ttf', 26)
    pill = font('arialbd.ttf', 18)
    footer = font('consola.ttf', 15)
    draw.text((92, 89), 'SETUP VENCEDOR / BIBLIOTECA PRIVADA', font=mono, fill='#b5c0d8', spacing=4)
    draw.text((92, 178), 'O próximo atalho', font=headline, fill='#f8fbff')
    draw.text((92, 252), 'técnico da sua equipe.', font=headline, fill='#b4ff2e')
    draw.text((94, 349), 'Ferramentas, skills e fluxos para transformar a execução.', font=body, fill='#b8c2d5')
    draw.rounded_rectangle((92, 454, 355, 508), radius=27, fill='#b4ff2e')
    draw.text((121, 470), '133 RECURSOS CURADOS', font=pill, fill='#081008')
    draw.text((92, 539), 'FERRAMENTAS  ·  SKILLS  ·  PLUGINS  ·  MCPs', font=footer, fill='#8f9ab0')

    logo = mark.resize((272, 272), Image.Resampling.LANCZOS)
    image.alpha_composite(logo, (820, 88))
    draw = ImageDraw.Draw(image)
    draw.arc((797, 65, 1115, 383), start=205, end=343, fill=(180, 255, 46, 120), width=2)
    draw.arc((774, 42, 1138, 406), start=205, end=343, fill=(180, 255, 46, 55), width=1)
    draw.arc((748, 19, 1164, 435), start=205, end=343, fill=(180, 255, 46, 30), width=1)
    draw.arc((802, 455, 1044, 534), start=6, end=162, fill=(180, 255, 46, 118), width=2)
    draw.line((1035, 517, 1057, 525), fill=(180, 255, 46, 170), width=3)
    draw.line((1057, 525, 1044, 545), fill=(180, 255, 46, 170), width=3)
    image.convert('RGB').save(PUBLIC / 'social-preview.png', 'PNG', optimize=True)


if __name__ == '__main__':
    main()
