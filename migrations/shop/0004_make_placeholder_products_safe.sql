UPDATE shop_products
SET sale_mode = 'unavailable',
    status = 'Coming soon',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id IN ('limited-vinyl', 'guitar-notes', 'artist-shirt');

UPDATE shop_products
SET status = 'Enquiries welcome',
    updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'remote-session';
