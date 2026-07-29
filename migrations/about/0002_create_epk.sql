CREATE TABLE IF NOT EXISTS epk_pages (
  id TEXT PRIMARY KEY NOT NULL,
  hero_eyebrow TEXT NOT NULL,
  hero_title TEXT NOT NULL,
  hero_subtitle TEXT NOT NULL,
  positioning_line TEXT NOT NULL,
  snapshot_heading TEXT NOT NULL,
  snapshot_body TEXT NOT NULL,
  short_bio TEXT NOT NULL,
  full_bio TEXT NOT NULL,
  biography_quote TEXT NOT NULL,
  music_heading TEXT NOT NULL,
  music_intro TEXT NOT NULL,
  rider_heading TEXT NOT NULL,
  rider_inputs TEXT NOT NULL,
  rider_requirements TEXT NOT NULL,
  rider_advance TEXT NOT NULL,
  contact_heading TEXT NOT NULL,
  contact_body TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  website_url TEXT NOT NULL,
  instagram_url TEXT NOT NULL,
  photo_usage_note TEXT NOT NULL,
  hero_image_key TEXT,
  portrait_image_key TEXT,
  contact_image_key TEXT,
  pdf_key TEXT,
  pdf_original_filename TEXT,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS epk_highlights (
  id TEXT PRIMARY KEY NOT NULL,
  body TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS epk_links (
  id TEXT PRIMARY KEY NOT NULL,
  label TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS epk_quotes (
  id TEXT PRIMARY KEY NOT NULL,
  quote_text TEXT NOT NULL,
  source TEXT NOT NULL,
  url TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE TABLE IF NOT EXISTS epk_gallery (
  id TEXT PRIMARY KEY NOT NULL,
  title TEXT NOT NULL,
  credit TEXT NOT NULL,
  alt_text TEXT NOT NULL,
  image_key TEXT NOT NULL,
  original_filename TEXT NOT NULL,
  content_type TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
);

CREATE INDEX IF NOT EXISTS idx_epk_highlights_sort ON epk_highlights (sort_order, id);
CREATE INDEX IF NOT EXISTS idx_epk_links_sort ON epk_links (sort_order, id);
CREATE INDEX IF NOT EXISTS idx_epk_quotes_sort ON epk_quotes (sort_order, id);
CREATE INDEX IF NOT EXISTS idx_epk_gallery_sort ON epk_gallery (sort_order, created_at);

INSERT OR IGNORE INTO epk_pages (
  id, hero_eyebrow, hero_title, hero_subtitle, positioning_line,
  snapshot_heading, snapshot_body, short_bio, full_bio, biography_quote,
  music_heading, music_intro, rider_heading, rider_inputs, rider_requirements,
  rider_advance, contact_heading, contact_body, contact_email, website_url,
  instagram_url, photo_usage_note
) VALUES (
  'epk',
  'Electronic press kit',
  'Luca Pisanu',
  'Singer-songwriter / Composer / Producer / Multi-instrumentalist',
  'Soul in the pocket. Songs with teeth.',
  'Artist snapshot',
  'Sardinian-born and Glasgow-based, Luca Pisanu is a singer-songwriter, composer, producer and multi-instrumentalist whose sound moves through blues, soul, jazz, funk and neo-soul.||A guitarist since the age of eight, he pairs warm vocals with melodic guitar work and bass lines built for the body. His solo material carries the instincts of a seasoned collaborator: arrangement-first, groove-led and alive to the room.',
  'Luca Pisanu is a Sardinian singer-songwriter, producer and multi-instrumentalist based in Glasgow. Rooted in blues, soul, jazz, funk and neo-soul, his music joins warm vocals, expressive guitar and deep-pocket bass with a producer''s ear for shape and detail.',
  'Drawn to music early, Luca began guitar at eight and followed that spark through an eclectic musical education shaped by Stevie Wonder, Stevie Ray Vaughan and Jimi Hendrix. After performing across the UK, Italy and France, he developed a solo voice that is groovy, suave and emotionally direct. Alongside his own work, Luca has become a familiar presence in Glasgow''s adventurous soul and jazz ecosystem - playing bass with Tom McGuire & the Brassholes, performing with Mercury Prize-nominated jazz collective corto.alto, working on guitar with Charlotte Marshall and the 45s, contributing as a session musician, and hosting jam sessions that connect players and audiences. Whether fronting a solo set or locking into an ensemble, he brings musicianship without stiffness and sophistication without losing the song.',
  'Groove-led, expressive and alive to the room.',
  'Start here.',
  'Releases, audio and current platform links live on Luca''s official website.',
  'Solo show.',
  '1. Lead vocal - venue-quality cardioid dynamic mic. 2. Guitar - mic on amp or balanced DI from pedalboard. 3. Optional playback/stereo DI - advance before show.',
  '1 vocal boom stand; 1 guitar stand; 1 wedge monitor with independent mix; clean mains power at pedalboard; chair/stool if requested; safe cable runs. Venue PA and engineer appropriate to room.',
  'This is a provisional solo baseline. Full-band or alternate instrument line-ups require a show-specific input list and stage plot.',
  'Book. Feature. Collaborate.',
  'Music, collaborations, sessions, live enquiries and press.',
  'lucapisanumusic@gmail.com',
  'https://lucapisanumusic.com',
  'https://www.instagram.com/lucapisanumusic/',
  'For editorial and promotional use in connection with Luca Pisanu. Please credit the photographer where supplied.'
);

INSERT OR IGNORE INTO epk_highlights (id, body, sort_order) VALUES
  ('barrowland', 'Bass at a sold-out Glasgow Barrowland Ballroom show attended by 1,900+ people.', 10),
  ('stay-rad', 'Bass credit on Tom McGuire & the Brassholes'' 2023 album Stay Rad.', 20),
  ('corto-alto', 'Performed with corto.alto at Celtic Connections'' Made in Glasgow concert.', 30),
  ('jazz-festival', 'Featured artist at Glasgow Jazz Festival; a regular host and catalyst in Glasgow''s jam scene.', 40);

INSERT OR IGNORE INTO epk_links (id, label, url, sort_order) VALUES
  ('music', 'Official music page', 'https://lucapisanumusic.com/music', 10),
  ('no-time-for-love', 'No Time For Love - official video', 'https://www.youtube.com/watch?v=WmWasQXIhi0', 20),
  ('youtube', 'YouTube channel', 'https://www.youtube.com/@lucapisanumusic', 30),
  ('apple-music', 'Apple Music', 'https://music.apple.com/gb/artist/luca-pisanu/497386712', 40),
  ('tidal', 'Tidal', 'https://tidal.com/artist/19084237', 50),
  ('instagram', 'Instagram', 'https://www.instagram.com/lucapisanumusic/', 60);

INSERT OR IGNORE INTO epk_quotes (id, quote_text, source, url, sort_order) VALUES
  ('barrowland', 'Over 1,900 people gathered for a massive party ... the band truly set the place on fire.', 'is this music? - Celtic Connections, Barrowland Ballroom', 'https://www.isthismusic.com/tom-mcguire-the-brassholes-cara-rose-bohemian-monk-machine', 10),
  ('made-in-glasgow', 'Providing the backbone are Luca Pisanu on bass and James Mackay on guitar.', 'is this music? - corto.alto + friends: Made in Glasgow', 'https://www.isthismusic.com/corto-alto-friends-made-in-glasgow', 20),
  ('glasgow-jazz', 'A Sardinian multi instrumentalist and well seasoned Glasgow musician.', 'Glasgow Jazz Festival artist listing', 'https://www.jazzfest.co.uk/venues/green-room', 30),
  ('hifi-pig', 'The funk ... in great big huge buckets labelled EXTRA FUNKY FUNK.', 'HiFi Pig - Tom McGuire & the Brassholes live', 'https://www.hifipig.com/tom-mcguire-the-brassholes-the-voodoo-rooms-edinburgh/', 40);
