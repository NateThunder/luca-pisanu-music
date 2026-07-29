from pathlib import Path
from reportlab.pdfgen import canvas
from reportlab.lib.pagesizes import A4
from reportlab.lib.colors import HexColor, Color
from reportlab.lib.utils import ImageReader
from reportlab.graphics.barcode import qr
from reportlab.graphics.shapes import Drawing
from reportlab.graphics import renderPDF
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "output" / "pdf"
OUT.mkdir(parents=True, exist_ok=True)
PDF = OUT / "luca-pisanu-epk.pdf"
W, H = A4
INK, PAPER, MUSTARD, RED, CREAM, MUTED = [HexColor(x) for x in ("#11100e","#e9dfc9","#d6a627","#a53a2b","#f5eddc","#756d61")]

def cover(c, path, x, y, w, h, top=False):
    im=Image.open(path); iw,ih=im.size; s=max(w/iw,h/ih); nw,nh=iw*s,ih*s
    ox=x+(w-nw)/2; oy=y+h-nh if top else y+(h-nh)/2
    c.saveState(); p=c.beginPath(); p.rect(x,y,w,h); c.clipPath(p,stroke=0,fill=0)
    c.drawImage(ImageReader(im),ox,oy,nw,nh,mask="auto"); c.restoreState()

def wrap(c,text,x,y,w,font="Helvetica",size=9,lead=12,color=INK):
    c.setFont(font,size); c.setFillColor(color); line=""; lines=[]
    for word in text.split():
        t=(line+" "+word).strip()
        if c.stringWidth(t,font,size)<=w: line=t
        else: lines.append(line); line=word
    if line: lines.append(line)
    for line in lines: c.drawString(x,y,line); y-=lead
    return y

def tag(c,text,x,y,color=MUSTARD):
    text=text.upper(); tw=c.stringWidth(text,"Helvetica-Bold",7.5)+14
    c.setFillColor(color); c.rect(x,y-12,tw,17,fill=1,stroke=0)
    c.setFillColor(INK if color==MUSTARD else CREAM); c.setFont("Helvetica-Bold",7.5); c.drawString(x+7,y-7,text)

def qr_code(c,url,x,y,size=62):
    q=qr.QrCodeWidget(url); b=q.getBounds(); d=Drawing(size,size,transform=[size/(b[2]-b[0]),0,0,size/(b[3]-b[1]),0,0]); d.add(q); renderPDF.draw(d,c,x,y)

def link(c,text,url,x,y,size=8,color=RED):
    c.setFillColor(color); c.setFont("Helvetica-Bold",size); c.drawString(x,y,text)
    c.linkURL(url,(x,y-2,x+c.stringWidth(text,"Helvetica-Bold",size),y+size+2),relative=0)

def footer(c,n):
    c.setStrokeColor(Color(0,0,0,.16)); c.line(30,25,W-30,25)
    c.setFillColor(MUTED); c.setFont("Helvetica",6.5); c.drawString(30,14,"LUCA PISANU / ELECTRONIC PRESS KIT / 2026")
    c.drawRightString(W-30,14,f"0{n}")

c=canvas.Canvas(str(PDF),pagesize=A4); c.setTitle("Luca Pisanu - Electronic Press Kit"); c.setAuthor("Luca Pisanu")

# PAGE 1 - identity, bio, credentials
c.setFillColor(PAPER); c.rect(0,0,W,H,fill=1,stroke=0)
cover(c,ROOT/"public/luca-guitar-live.png",0,H-365,W,365)
c.setFillColor(Color(0,0,0,.46)); c.rect(0,H-365,W,365,fill=1,stroke=0)
tag(c,"Electronic press kit",32,H-46)
c.setFillColor(CREAM); c.setFont("Helvetica-Bold",42); c.drawString(32,H-110,"LUCA PISANU")
c.setFillColor(MUSTARD); c.rect(32,H-129,267,4,fill=1,stroke=0)
c.setFont("Helvetica-Bold",10); c.drawString(32,H-154,"SINGER-SONGWRITER / COMPOSER / PRODUCER")
c.setFont("Helvetica",8.5); c.setFillColor(CREAM); c.drawString(32,H-172,"VINTAGE ROCK / BLUES / NEO-SOUL / FUNK / JAZZ")
c.setFillColor(Color(0,0,0,.72)); c.roundRect(32,H-336,310,116,7,fill=1,stroke=0)
wrap(c,"“A unique, suave voice. An expressive guitar style.”",49,H-251,280,"Helvetica-Bold",15,18,MUSTARD)
wrap(c,"Sardinia >>> Glasgow  /  Influences: Jimi Hendrix, Stevie Wonder, D'Angelo",49,H-300,275,"Helvetica",9.2,14,CREAM)

tag(c,"Biography",32,H-398,RED)
bio=("Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist known for his unique, suave voice and expressive guitar style. Blending a vast variety of genres that find expression in colourful melodies, rich harmonies and expressive bass lines, Luca brings a fresh sound to the current rock scene. After performing and co-writing with world-class artists and touring all over the UK and Europe, he is now focused on the release of his debut album Alchemy with Serdica Records. Its first single, Reborn, was released on 20 July 2026: a catchy rock song with a deep sound and meaningful lyrics that will have you hooked.")
wrap(c,bio,32,H-424,330,"Helvetica",9.1,12.5)

c.setFillColor(INK); c.roundRect(382,H-675,181,278,8,fill=1,stroke=0)
tag(c,"Selected highlights",397,H-423)
high=["Featured on corto.alto's Mercury Prize-nominated album Bad With Names.","Played Glastonbury's West Holts Stage for an audience of 25,000+.","We Out There main stage, Cross The Tracks, Love Supreme and other world-class festivals.","Performed at sold-out Glasgow Barrowland Ballroom shows attended by 2,000+ people.","Featured at Glasgow Jazz Festival, Celtic Connections and active in Glasgow's music scene."]
y=H-453
for h in high:
    c.setFillColor(MUSTARD); c.circle(403,y+2,2.5,fill=1,stroke=0)
    y=wrap(c,h,414,y,132,"Helvetica",7.6,10.2,CREAM)-8
tag(c,"Debut album",32,173)
wrap(c,"ALCHEMY / SERDICA RECORDS",32,145,315,"Helvetica-Bold",11,14,RED)
link(c,"LISTEN TO REBORN ->","https://lucapisanumusic.com/music",32,120,9,MUSTARD)
link(c,"lucapisanumusic.com","https://lucapisanumusic.com",382,155,9,MUSTARD)
link(c,"lucapisanumusic@gmail.com","mailto:lucapisanumusic@gmail.com",382,133,8.5,INK)
link(c,"@lucapisanumusic","https://www.instagram.com/lucapisanumusic/",382,112,8.5,RED)
footer(c,1); c.showPage()

# PAGE 2 - links, press, photos, tech, contact
c.setFillColor(PAPER); c.rect(0,0,W,H,fill=1,stroke=0)
cover(c,ROOT/"public/luca-sitting.png",0,H-255,W,255,True)
c.setFillColor(Color(0,0,0,.43)); c.rect(0,H-255,W,255,fill=1,stroke=0)
tag(c,"Listen / watch / book",30,H-40)
c.setFillColor(CREAM); c.setFont("Helvetica-Bold",29); c.drawString(30,H-91,"THE QUICK ADVANCE")
c.setFillColor(MUSTARD); c.setFont("Helvetica-Bold",10); c.drawString(30,H-118,"REBORN / OUT NOW")
qr_code(c,"https://lucapisanumusic.com/music",30,H-205,70)
link(c,"lucapisanumusic.com/music","https://lucapisanumusic.com/music",116,H-153,10,MUSTARD)
link(c,"Listen to the first single from Alchemy","https://lucapisanumusic.com/music",116,H-177,8.5,CREAM)
link(c,"Released 20 July 2026 / Serdica Records","https://lucapisanumusic.com/music",116,H-199,8.5,CREAM)

tag(c,"Press",30,H-288,RED)
quotes=[
("“Over 1,900 people gathered for a massive party ... the band truly set the place on fire.”","is this music? / Barrowland Ballroom","https://www.isthismusic.com/tom-mcguire-the-brassholes-cara-rose-bohemian-monk-machine"),
("“A Sardinian multi instrumentalist and well seasoned Glasgow musician.”","Glasgow Jazz Festival","https://www.jazzfest.co.uk/venues/green-room"),
("“Providing the backbone are Luca Pisanu on bass and James Mackay on guitar.”","is this music? / corto.alto + friends","https://www.isthismusic.com/corto-alto-friends-made-in-glasgow")]
y=H-315
for quote,source,url in quotes:
    c.setFillColor(CREAM); c.roundRect(30,y-74,330,64,6,fill=1,stroke=0)
    wrap(c,quote,43,y-31,305,"Helvetica-Bold",8.8,11,INK)
    link(c,source,url,43,y-62,7,RED); y-=78

tag(c,"Press photos",382,H-288)
cover(c,ROOT/"public/luca-standing-smiling.png",382,H-487,181,175,True)
cover(c,ROOT/"public/luca-guitar-live.png",382,H-629,181,126)
c.setFillColor(INK); c.setFont("Helvetica",6.8); c.drawString(382,H-642,"High-res originals available on request.")

tag(c,"Solo stage baseline",30,277)
c.setFillColor(INK); c.roundRect(30,125,330,125,7,fill=1,stroke=0)
c.setStrokeColor(MUTED); c.rect(47,143,296,89,fill=0,stroke=1)
c.setFillColor(RED); c.circle(195,185,17,fill=1,stroke=0); c.setFillColor(CREAM); c.setFont("Helvetica-Bold",6); c.drawCentredString(195,183,"LUCA")
c.setFillColor(MUSTARD); c.roundRect(170,149,50,14,3,fill=1,stroke=0); c.setFillColor(INK); c.drawCentredString(195,153,"MONITOR")
c.setFillColor(CREAM); c.setFont("Helvetica-Bold",6); c.drawString(62,205,"GTR AMP / DI"); c.drawRightString(329,205,"VOCAL MIC")
c.setFont("Helvetica",6); c.drawCentredString(195,132,"AUDIENCE / DOWNSTAGE")
wrap(c,"Inputs: lead vocal; guitar amp mic or pedalboard DI; optional stereo playback by advance. Requires boom stand, guitar stand, wedge mix and clean pedalboard power. Full-band line-ups require a show-specific plot.",30,108,330,"Helvetica",7.2,10)

c.setFillColor(RED); c.roundRect(382,87,181,169,7,fill=1,stroke=0)
c.setFillColor(CREAM); c.setFont("Helvetica-Bold",15); c.drawString(397,224,"BOOK / PRESS")
wrap(c,"Music, collaborations, sessions, live enquiries and press.",397,200,148,"Helvetica",8.5,12,CREAM)
link(c,"lucapisanumusic@gmail.com","mailto:lucapisanumusic@gmail.com",397,165,7.8,MUSTARD)
link(c,"lucapisanumusic.com","https://lucapisanumusic.com",397,143,8,CREAM)
link(c,"IG","https://www.instagram.com/lucapisanumusic/",397,121,8,CREAM)
link(c,"FB","https://www.facebook.com/lucapisanumusic",425,121,8,CREAM)
link(c,"TIKTOK","https://www.tiktok.com/@lucapisanumusic",451,121,8,CREAM)
link(c,"YT","https://www.youtube.com/@lucapisanumusic",507,121,8,CREAM)
footer(c,2); c.showPage(); c.save(); print(PDF)
