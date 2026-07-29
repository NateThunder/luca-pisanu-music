DELETE FROM epk_highlights;

INSERT INTO epk_highlights (id, body, sort_order, updated_at) VALUES
  ('corto-alto-bad-with-names', 'Featured on corto.alto Mercury Prize nominated album Bad With Names', 10, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('glastonbury-west-holts', 'Played Glastonbury West Holts Stage for a 25k+ audience', 20, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('world-class-festivals', 'We Out There main stage, Cross the Tracks, Love Supreme and other world-class festivals', 30, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('glasgow-barrowland', 'Performed at sold-out Glasgow Barrowland Ballroom shows attended by 2k+ people', 40, strftime('%Y-%m-%dT%H:%M:%fZ', 'now')),
  ('glasgow-music-scene', 'Featured at Glasgow Jazz festival, Celtic Connections and active in Glasgow’s music scene', 50, strftime('%Y-%m-%dT%H:%M:%fZ', 'now'));
