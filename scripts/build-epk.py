from pathlib import Path
from shutil import copyfile

from PIL import Image
from reportlab.graphics import renderPDF
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.lib.colors import Color, HexColor
from reportlab.lib.pagesizes import A4
from reportlab.lib.utils import ImageReader
from reportlab.pdfgen import canvas


ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / "LUCA-PISANU-EPK-REVISED-JULY-2026.pdf"
PUBLIC_PDF = ROOT / "public" / PDF.name
W, H = A4

DARK = HexColor("#090907")
PANEL = HexColor("#12120f")
PANEL_2 = HexColor("#1b1a16")
CREAM = HexColor("#f3ead7")
MUTED = HexColor("#9b9384")
GOLD = HexColor("#d6a627")
RED = HexColor("#a53a2b")
RULE = Color(0.91, 0.87, 0.78, 0.24)


def image_cover(c, path, x, y, w, h, anchor="center"):
    image = Image.open(path)
    iw, ih = image.size
    scale = max(w / iw, h / ih)
    nw, nh = iw * scale, ih * scale
    ox = x + (w - nw) / 2
    oy = y + (h - nh) / 2
    if anchor == "top":
        oy = y + h - nh
    c.drawImage(ImageReader(image), ox, oy, nw, nh, mask="auto")


def page_base(c, number, section):
    c.setFillColor(DARK)
    c.rect(0, 0, W, H, fill=1, stroke=0)
    c.setFillColor(Color(1, 1, 1, 0.018))
    for index in range(64):
        c.circle((index * 79) % int(W), (index * 113) % int(H), 0.7, fill=1, stroke=0)
    c.setStrokeColor(RULE)
    c.line(34, 29, W - 34, 29)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawString(34, 17, f"LUCA PISANU / EPK / {section.upper()}")
    c.drawRightString(W - 34, 17, f"{number:02d}")


def kicker(c, text, x, y, color=GOLD):
    c.setFillColor(color)
    width = c.stringWidth(text.upper(), "Helvetica-Bold", 8) + 18
    c.rect(x, y - 12, width, 18, fill=1, stroke=0)
    c.setFillColor(DARK)
    c.setFont("Helvetica-Bold", 8)
    c.drawString(x + 9, y - 7, text.upper())


def heading(c, text, x, y, size=31, color=CREAM):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, text)


def rule(c, x, y, width, color=GOLD, thickness=3):
    c.setFillColor(color)
    c.rect(x, y, width, thickness, fill=1, stroke=0)


def wrap(c, text, x, y, width, font="Helvetica", size=10, leading=14, color=CREAM):
    c.setFont(font, size)
    c.setFillColor(color)
    words = text.split()
    line = ""
    lines = []
    for word in words:
        trial = f"{line} {word}".strip()
        if not line or c.stringWidth(trial, font, size) <= width:
            line = trial
        else:
            lines.append(line)
            line = word
    if line:
        lines.append(line)
    for value in lines:
        c.drawString(x, y, value)
        y -= leading
    return y


def link(c, label, url, x, y, size=9, color=GOLD):
    c.setFillColor(color)
    c.setFont("Helvetica-Bold", size)
    c.drawString(x, y, label)
    width = c.stringWidth(label, "Helvetica-Bold", size)
    c.linkURL(url, (x, y - 2, x + width, y + size + 2), relative=0)


def qr_code(c, url, x, y, size=82):
    quiet = 7
    c.setFillColor(HexColor("#ffffff"))
    c.roundRect(x - quiet, y - quiet, size + quiet * 2, size + quiet * 2, 4, fill=1, stroke=0)
    widget = qr.QrCodeWidget(url)
    bounds = widget.getBounds()
    drawing = Drawing(
        size,
        size,
        transform=[
            size / (bounds[2] - bounds[0]),
            0,
            0,
            size / (bounds[3] - bounds[1]),
            0,
            0,
        ],
    )
    drawing.add(widget)
    renderPDF.draw(drawing, c, x, y)


def panel(c, x, y, w, h, radius=8, fill=PANEL, stroke=RULE):
    c.setFillColor(fill)
    c.setStrokeColor(stroke)
    c.roundRect(x, y, w, h, radius, fill=1, stroke=1)


def pill(c, text, x, y, w, h=23, fill=PANEL_2, text_color=CREAM, size=7):
    c.setFillColor(fill)
    c.setStrokeColor(RULE)
    c.roundRect(x, y, w, h, 4, fill=1, stroke=1)
    c.setFillColor(text_color)
    c.setFont("Helvetica-Bold", size)
    c.drawCentredString(x + w / 2, y + (h - size) / 2 + 1, text)


c = canvas.Canvas(str(PDF), pagesize=A4)
c.setTitle("Luca Pisanu - Electronic Press Kit")
c.setAuthor("Luca Pisanu")
c.setSubject("Electronic press kit and trio technical rider")

# 01 - Cover
c.setFillColor(DARK)
c.rect(0, 0, W, H, fill=1, stroke=0)
image_cover(c, ROOT / "public" / "luca-guitar-live.png", 0, 0, W, H)
c.setFillColor(Color(0, 0, 0, 0.64))
c.rect(0, 0, W, H, fill=1, stroke=0)
c.setFillColor(Color(0, 0, 0, 0.38))
c.rect(0, 0, W, 245, fill=1, stroke=0)
kicker(c, "Electronic press kit", 38, H - 58)
c.setFillColor(CREAM)
c.setFont("Helvetica-Bold", 54)
c.drawString(38, 138, "LUCA")
c.drawString(38, 83, "PISANU")
rule(c, 38, 64, 296, GOLD, 5)
c.setFillColor(CREAM)
c.setFont("Helvetica", 9)
c.drawString(38, 43, "SINGER-SONGWRITER / COMPOSER / PRODUCER / MULTI-INSTRUMENTALIST")
c.showPage()

# 02 - Snapshot
page_base(c, 2, "Artist snapshot")
kicker(c, "Artist snapshot", 34, H - 49)
heading(c, "Soul in the pocket.", 34, H - 99, 32)
heading(c, "Songs with teeth.", 34, H - 136, 32, GOLD)
panel(c, 323, H - 455, 238, 306, 9)
image_cover(c, ROOT / "public" / "luca-sitting.png", 326, H - 452, 232, 300, "top")
y = H - 188
y = wrap(
    c,
    "Sardinian-born and Glasgow-based, Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist whose sound moves through blues, soul, jazz, funk and neo-soul.",
    34,
    y,
    260,
    "Helvetica",
    11,
    16,
)
y -= 15
wrap(
    c,
    "A guitarist since the age of eight, he pairs warm vocals with melodic guitar work and bass lines built for the body. His solo material carries the instincts of a seasoned collaborator: arrangement-first, groove-led and alive to the room.",
    34,
    y,
    260,
    "Helvetica",
    10,
    15,
    MUTED,
)
panel(c, 34, 78, 527, 247, 9)
kicker(c, "Selected highlights", 52, 299, RED)
highlights = [
    "Featured on corto.alto Mercury Prize nominated album Bad With Names.",
    "Played Glastonbury West Holts Stage for a 25k+ audience.",
    "We Out There main stage, Cross the Tracks, Love Supreme and other world-class festivals.",
    "Performed at sold-out Glasgow Barrowland Ballroom shows attended by 2k+ people.",
    "Featured at Glasgow Jazz Festival, Celtic Connections and active in Glasgow's music scene.",
]
yy = 263
for item in highlights:
    c.setFillColor(GOLD)
    c.circle(57, yy + 3, 3, fill=1, stroke=0)
    yy = wrap(c, item, 69, yy, 468, "Helvetica", 9.4, 13, CREAM) - 9
c.showPage()

# 03 - Biography
page_base(c, 3, "Biography")
kicker(c, "Biography", 34, H - 49)
heading(c, "Built across borders.", 34, H - 99, 31)
rule(c, 34, H - 118, 184)
panel(c, 34, H - 446, 215, 292, 9)
image_cover(c, ROOT / "public" / "luca-standing-smiling.png", 37, H - 443, 209, 286, "top")
kicker(c, "Short bio", 280, H - 161, RED)
short_bio = (
    "Luca Pisanu is a Sardinian singer-songwriter, producer and multi-instrumentalist based "
    "in Glasgow. Rooted in blues, soul, jazz, funk and neo-soul, his music joins warm vocals, "
    "expressive guitar and deep-pocket bass with a producer's ear for shape and detail."
)
y = wrap(c, short_bio, 280, H - 190, 281, "Helvetica", 10.5, 15)
kicker(c, "Full bio", 280, y - 22)
full_bio = (
    "Drawn to music early, Luca began guitar at eight and followed that spark through an eclectic "
    "musical education shaped by Stevie Wonder, Stevie Ray Vaughan and Jimi Hendrix. After "
    "performing across the UK, Italy and France, he developed a solo voice that is groovy, suave "
    "and emotionally direct. Alongside his own work, Luca has become a familiar presence in "
    "Glasgow's adventurous soul and jazz ecosystem - playing bass with Tom McGuire and the "
    "Brassholes, performing with Mercury Prize-nominated jazz collective corto.alto, working on "
    "guitar with Charlotte Marshall and the 45s, contributing as a session musician, and hosting "
    "jam sessions that connect players and audiences."
)
wrap(c, full_bio, 280, y - 50, 281, "Helvetica", 9.1, 13.1, MUTED)
panel(c, 34, 76, 527, 88, 8, RED, RED)
c.setFillColor(CREAM)
c.setFont("Helvetica-Bold", 17)
c.drawString(52, 125, '"Groove-led, expressive and alive to the room."')
c.setFont("Helvetica", 8)
c.drawString(52, 101, "POSITIONING LINE / FOR LISTINGS, INTRODUCTIONS AND PROGRAMMES")
c.showPage()

# 04 - Music
page_base(c, 4, "Listen and watch")
kicker(c, "Listen / watch", 34, H - 49)
heading(c, "Start here.", 34, H - 99, 34)
panel(c, 34, H - 363, 527, 214, 10)
qr_code(c, "https://lucapisanumusic.com/music", 55, H - 317, 122)
c.setFillColor(GOLD)
c.setFont("Helvetica-Bold", 9)
c.drawString(203, H - 191, "OFFICIAL MUSIC PAGE")
heading(c, "Listen in one click.", 203, H - 229, 23)
wrap(
    c,
    "Releases, audio and current platform links live on Luca's official website.",
    203,
    H - 256,
    325,
    "Helvetica",
    10,
    15,
    MUTED,
)
link(c, "lucapisanumusic.com/music", "https://lucapisanumusic.com/music", 203, H - 310, 11)
heading(c, "Key links", 34, H - 409, 24)
links = [
    ("NO TIME FOR LOVE - OFFICIAL VIDEO", "https://www.youtube.com/watch?v=WmWasQXIhi0"),
    ("YOUTUBE CHANNEL", "https://www.youtube.com/@lucapisanumusic"),
    ("APPLE MUSIC", "https://music.apple.com/gb/artist/luca-pisanu/497386712"),
    ("TIDAL", "https://tidal.com/artist/19084237"),
    ("INSTAGRAM", "https://www.instagram.com/lucapisanumusic/"),
]
yy = H - 453
for label, url in links:
    c.setStrokeColor(RULE)
    c.line(34, yy - 11, 561, yy - 11)
    link(c, label, url, 34, yy, 9.5)
    c.setFillColor(MUTED)
    c.setFont("Helvetica", 7)
    c.drawRightString(561, yy, "CLICK TO OPEN")
    yy -= 48
c.showPage()

# 05 - Press
page_base(c, 5, "Press")
kicker(c, "Press / selected notices", 34, H - 49)
heading(c, "What the room felt.", 34, H - 99, 31)
quotes = [
    (
        '"Over 1,900 people gathered for a massive party ... the band truly set the place on fire."',
        "is this music? - Celtic Connections, Barrowland Ballroom",
        "https://www.isthismusic.com/tom-mcguire-the-brassholes-cara-rose-bohemian-monk-machine",
    ),
    (
        '"Providing the backbone are Luca Pisanu on bass and James Mackay on guitar."',
        "is this music? - corto.alto + friends: Made in Glasgow",
        "https://www.isthismusic.com/corto-alto-friends-made-in-glasgow",
    ),
    (
        '"A Sardinian multi instrumentalist and well seasoned Glasgow musician."',
        "Glasgow Jazz Festival artist listing",
        "https://www.jazzfest.co.uk/venues/green-room",
    ),
    (
        '"The funk ... in great big huge buckets labelled EXTRA FUNKY FUNK."',
        "HiFi Pig - Tom McGuire and the Brassholes live",
        "https://www.hifipig.com/tom-mcguire-the-brassholes-the-voodoo-rooms-edinburgh/",
    ),
]
yy = H - 160
for index, (quote_text, source, url) in enumerate(quotes):
    panel(c, 34, yy - 119, 527, 105, 8, PANEL if index % 2 == 0 else PANEL_2)
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 24)
    c.drawString(50, yy - 42, '"')
    wrap(c, quote_text.strip('"'), 74, yy - 42, 458, "Helvetica-Bold", 12.2, 16, CREAM)
    link(c, source, url, 52, yy - 97, 8, RED)
    yy -= 135
c.setFillColor(MUTED)
c.setFont("Helvetica", 7)
c.drawString(34, 47, "Quotes refer to ensembles and appearances featuring Luca; reproduced in brief for press context.")
c.showPage()

# 06 - Trio technical rider
page_base(c, 6, "Technical rider")
kicker(c, "Technical / stage plan", 34, H - 49)
heading(c, "Trio stage plan.", 34, H - 99, 31)
c.setFillColor(MUTED)
c.setFont("Helvetica", 8)
c.drawRightString(W - 34, H - 94, "AUDIENCE VIEW / NOT TO SCALE")

stage_x, stage_y, stage_w, stage_h = 34, 390, 527, 326
panel(c, stage_x, stage_y, stage_w, stage_h, 8, PANEL)
c.setFillColor(MUTED)
c.setFont("Helvetica-Bold", 6.5)
c.drawString(stage_x + 12, stage_y + stage_h - 18, "UPSTAGE")
c.drawCentredString(W / 2, stage_y + 9, "AUDIENCE / DOWNSTAGE")

drum_x, centre_x, bass_x = 139, 303, 458
amp_y, performer_y, mic_y, pedal_y, wedge_y = 655, 568, 511, 462, 414
box_x, box_y = 529, 520

# Signal routes: instruments to pedals and amps.
c.setStrokeColor(RED)
c.setLineWidth(1.4)
c.setDash(4, 3)
c.line(centre_x, performer_y - 18, centre_x, pedal_y + 23)
c.bezier(centre_x, pedal_y, 271, 450, 272, 625, centre_x, amp_y - 17)
c.line(bass_x, performer_y - 18, bass_x, pedal_y + 23)
c.bezier(bass_x, pedal_y, 430, 450, 429, 625, bass_x, amp_y - 17)
c.setDash()

# XLR routes to stage box.
c.setStrokeColor(GOLD)
c.setLineWidth(1.1)
for sx, sy in [
    (drum_x + 45, 641),
    (centre_x + 42, amp_y),
    (bass_x + 42, amp_y),
    (drum_x, mic_y),
    (centre_x, mic_y),
    (bass_x, mic_y),
]:
    c.bezier(sx, sy, sx + 80, sy + 12, box_x - 35, box_y + 28, box_x, box_y + 28)

# Monitor returns.
c.setStrokeColor(CREAM)
c.setLineWidth(1)
c.setDash(1, 4)
for tx, ty in [(drum_x, wedge_y + 12), (centre_x, wedge_y + 12), (bass_x, wedge_y + 12)]:
    c.bezier(box_x, box_y + 5, box_x - 80, 488, tx + 30, 444, tx, ty)
c.setDash()

# Drum kit.
c.setFillColor(PANEL_2)
c.setStrokeColor(CREAM)
c.circle(drum_x, 641, 32, fill=1, stroke=1)
for dx, dy, radius in [(-28, 5, 15), (28, 5, 15), (-26, -22, 16), (27, -24, 19)]:
    c.circle(drum_x + dx, 641 + dy, radius, fill=1, stroke=1)
c.setFillColor(CREAM)
c.setFont("Helvetica-Bold", 7)
c.drawCentredString(drum_x, 643, "DRUM KIT")
c.drawCentredString(drum_x, 632, "VENUE MICS")

# Amps.
pill(c, "GUITAR AMP / SM57 EQ.", centre_x - 47, amp_y - 17, 94, 34, PANEL_2, CREAM, 6.2)
pill(c, "BASS AMP / SM57 EQ.", bass_x - 47, amp_y - 17, 94, 34, PANEL_2, CREAM, 6.2)

# Performers.
for x, line1, line2 in [
    (drum_x, "DRUMMER", "BACKING VOX"),
    (centre_x, "LUCA", "GTR / LEAD VOX"),
    (bass_x, "BASS", "BACKING VOX"),
]:
    c.setFillColor(RED)
    c.setStrokeColor(HexColor("#cf6d60"))
    c.circle(x, performer_y, 25, fill=1, stroke=1)
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawCentredString(x, performer_y + 2, line1)
    c.drawCentredString(x, performer_y - 8, line2)

# Vocal microphones and stands.
for x, label in [(drum_x, "SM58 / EQ."), (centre_x, "LEAD VOX"), (bass_x, "BASS BGV")]:
    c.setFillColor(GOLD)
    c.circle(x, mic_y, 5, fill=1, stroke=0)
    c.setStrokeColor(GOLD)
    c.line(x, mic_y - 5, x, mic_y - 26)
    c.line(x - 8, mic_y - 26, x + 8, mic_y - 26)
    c.setFont("Helvetica-Bold", 5.8)
    c.drawCentredString(x, mic_y - 37, label)

# Pedalboards.
pill(c, "GTR PEDALBOARD", centre_x - 41, pedal_y, 82, 22, GOLD, DARK, 6)
pill(c, "BASS PEDALBOARD", bass_x - 41, pedal_y, 82, 22, GOLD, DARK, 6)

# Wedges.
for x, label in [(drum_x, "MIX 1"), (centre_x, "MIX 2"), (bass_x, "MIX 3")]:
    c.setFillColor(PANEL_2)
    c.setStrokeColor(CREAM)
    path = c.beginPath()
    path.moveTo(x - 32, wedge_y)
    path.lineTo(x - 19, wedge_y + 24)
    path.lineTo(x + 19, wedge_y + 24)
    path.lineTo(x + 32, wedge_y)
    path.close()
    c.drawPath(path, fill=1, stroke=1)
    c.setFillColor(CREAM)
    c.setFont("Helvetica-Bold", 6.2)
    c.drawCentredString(x, wedge_y + 9, label)

# Power drops.
for x, y, label in [
    (57, 603, "DRUMS"),
    (247, 670, "GTR AMP"),
    (247, 470, "GTR PEDAL"),
    (519, 467, "BASS ZONE"),
]:
    c.setFillColor(HexColor("#32322f"))
    c.setStrokeColor(MUTED)
    c.circle(x, y, 9, fill=1, stroke=1)
    c.setFillColor(MUTED)
    c.setFont("Helvetica-Bold", 5.5)
    c.drawCentredString(x, y - 2, "AC")
    c.drawCentredString(x, y - 16, label)

# Stage box.
c.setFillColor(GOLD)
c.roundRect(box_x, box_y, 19, 76, 3, fill=1, stroke=0)
c.saveState()
c.translate(box_x + 12, box_y + 10)
c.rotate(90)
c.setFillColor(DARK)
c.setFont("Helvetica-Bold", 5.7)
c.drawString(0, 0, "STAGE BOX / FOH")
c.restoreState()

c.setFillColor(MUTED)
c.setFont("Helvetica-Bold", 5.5)
c.drawString(322, 690, "GOLD: BALANCED XLR")
c.drawString(322, 680, "RED DASH: 1/4-IN TS")
c.drawString(422, 690, "CREAM DOT: MONITOR RETURN")
c.drawString(422, 680, "XLR ACTIVE / NL4 PASSIVE")

# Patch and monitor notes.
panel(c, 34, 277, 527, 92, 7, PANEL)
kicker(c, "Flexible patch", 49, 350, RED)
patch_lines = [
    "CH 1-N  Venue-selected multi-mic drum package",
    "CH N+1  Guitar amp - SM57 or equivalent",
    "CH N+2  Bass amp - SM57 or equivalent",
    "CH N+3  Luca lead vocal - SM58 or equivalent",
    "CH N+4  Bass backing vocal - SM58 or equivalent",
    "CH N+5  Drummer backing vocal - SM58 or equivalent",
]
for index, value in enumerate(patch_lines):
    col = 49 if index < 3 else 306
    row = 326 - (index % 3) * 18
    c.setFillColor(CREAM)
    c.setFont("Helvetica", 7.1)
    c.drawString(col, row, value)

panel(c, 34, 136, 527, 121, 7, PANEL)
kicker(c, "Independent monitor mixes", 49, 238)
monitor_notes = [
    ("MIX 1 / DRUMS", "Lead vocal, drummer BGV, bass and guitar; kick as required."),
    ("MIX 2 / LUCA", "Lead vocal prominent, guitar, both BGVs; bass/kick as required."),
    ("MIX 3 / BASS", "Bass BGV and lead vocal prominent, bass, guitar and kick as required."),
]
for index, (label, body) in enumerate(monitor_notes):
    x = 49 + index * 171
    c.setFillColor(GOLD)
    c.setFont("Helvetica-Bold", 7)
    c.drawString(x, 207, label)
    wrap(c, body, x, 191, 151, "Helvetica", 6.8, 10, MUTED)
c.setStrokeColor(RULE)
c.line(49, 162, 546, 162)
c.setFillColor(CREAM)
c.setFont("Helvetica", 6.8)
c.drawString(49, 149, "Final monitor levels and drum microphone package are agreed with the venue engineer at soundcheck.")

panel(c, 34, 50, 527, 66, 7, RED, RED)
c.setFillColor(CREAM)
c.setFont("Helvetica-Bold", 7)
c.drawString(49, 96, "REQUIREMENTS")
wrap(
    c,
    "Three boom vocal stands; suitable drum and amp mic stands/clips; stage box with required inputs "
    "and three returns; four clean 230V AC drops; venue PA and engineer; safe XLR, 1/4-inch TS, "
    "XLR/NL4 monitor and mains cable runs.",
    49,
    81,
    493,
    "Helvetica",
    6.8,
    10,
    CREAM,
)
c.showPage()

# 07 - Contact
c.setFillColor(DARK)
c.rect(0, 0, W, H, fill=1, stroke=0)
image_cover(c, ROOT / "public" / "luca-sitting.png", 0, H / 2, W, H / 2, "top")
image_cover(c, ROOT / "public" / "luca-guitar-live.png", 0, 0, W, H / 2)
c.setFillColor(Color(0, 0, 0, 0.73))
c.rect(0, 0, W, H / 2, fill=1, stroke=0)
kicker(c, "Press photos / approved selection", 34, 353)
heading(c, "Book. Feature.", 34, 303, 31)
heading(c, "Collaborate.", 34, 268, 31, GOLD)
wrap(
    c,
    "High-resolution originals and additional selects are available on request.",
    34,
    237,
    350,
    "Helvetica",
    10,
    15,
    CREAM,
)
link(c, "lucapisanumusic@gmail.com", "mailto:lucapisanumusic@gmail.com", 34, 191, 13)
link(c, "lucapisanumusic.com", "https://lucapisanumusic.com", 34, 159, 11, CREAM)
link(
    c,
    "instagram.com/lucapisanumusic",
    "https://www.instagram.com/lucapisanumusic/",
    34,
    130,
    9,
    CREAM,
)
qr_code(c, "https://lucapisanumusic.com", 452, 128, 92)
c.setFillColor(MUTED)
c.setFont("Helvetica", 7)
c.drawString(34, 35, "For editorial and promotional use in connection with Luca Pisanu. Please credit the photographer where supplied.")
c.showPage()

c.save()
copyfile(PDF, PUBLIC_PDF)
print(PDF)
print(PUBLIC_PDF)
