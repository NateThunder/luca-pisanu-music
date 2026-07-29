UPDATE epk_pages
SET
  rider_heading = 'Trio stage plan.',
  rider_inputs = 'CH 1-N: venue-selected multi-mic drum package. CH N+1: guitar amp mic (SM57 or equivalent). CH N+2: bass amp mic (SM57 or equivalent). CH N+3: Luca lead vocal (SM58 or equivalent). CH N+4: bass backing vocal (SM58 or equivalent). CH N+5: drummer backing vocal (SM58 or equivalent). All microphone lines use balanced XLR.',
  rider_requirements = 'Three boom vocal stands; suitable drum and amp mic stands/clips; three independent wedge mixes; stage box with the required inputs and three returns; four clean 230V AC drops at drums, guitar amp, guitar pedalboard, and the combined bass backline/pedalboard zone; safe cable runs. Guitar and bass use 1/4-inch TS instrument/pedal/amp connections. Active wedges use XLR returns; passive wedges use venue amplification and NL4.',
  rider_advance = 'Audience view: drums left, Luca centre, bass right. Mix 1 drums: lead vocal, drummer backing vocal, bass and guitar, with kick as required. Mix 2 Luca: lead vocal prominent, guitar, both backing vocals, with bass/kick as required. Mix 3 bass: bass backing vocal and lead vocal prominent, bass, guitar and kick as required. Final levels and the drum microphone package are agreed at soundcheck.',
  updated_at = strftime('%Y-%m-%dT%H:%M:%fZ', 'now')
WHERE id = 'epk';
