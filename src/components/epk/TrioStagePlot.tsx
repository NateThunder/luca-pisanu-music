export function TrioStagePlot() {
  return (
    <div className="epk2-stage-scroll">
      <p className="epk2-stage-scroll__hint">Swipe to see the full stage plan →</p>
      <svg
        aria-labelledby="trio-stage-title trio-stage-description"
        className="epk2-stage"
        role="img"
        viewBox="0 0 900 620"
      >
        <title id="trio-stage-title">Luca Pisanu trio stage plan, viewed from the audience</title>
        <desc id="trio-stage-description">
          Drums and drummer backing vocal are on audience left, Luca with lead vocal,
          guitar pedalboard and guitar amplifier is in the centre, and bass with backing
          vocal, pedalboard and bass amplifier is on audience right. All microphones feed
          the stage box by XLR. Instruments connect to pedalboards and amplifiers by
          quarter-inch TS cable. Three independent monitor mixes return to wedges.
        </desc>

        <defs>
          <marker id="epk-stage-arrow" markerHeight="5" markerWidth="6" orient="auto" refX="5" refY="2.5">
            <path d="M0,0 L5,2.5 L0,5 Z" />
          </marker>
          <pattern height="32" id="epk-stage-grid" patternUnits="userSpaceOnUse" width="32">
            <path d="M32 0H0V32" fill="none" />
          </pattern>
        </defs>

        <rect className="epk2-stage__floor" height="570" rx="8" width="860" x="20" y="20" />
        <rect className="epk2-stage__grid" height="570" rx="8" width="860" x="20" y="20" />
        <text className="epk2-stage__orientation" x="42" y="51">UPSTAGE</text>
        <text className="epk2-stage__orientation" textAnchor="middle" x="450" y="607">
          AUDIENCE / DOWNSTAGE
        </text>

        <g className="epk2-stage__route epk2-stage__route--signal">
          <path d="M454 286 V384" />
          <path d="M454 416 C454 458 390 454 390 119 H427" />
          <path d="M736 286 V384" />
          <path d="M736 416 C736 458 682 454 682 119 H708" />
        </g>
        <g className="epk2-stage__route-label">
          <text x="464" y="352">¼″ TS</text>
          <text x="400" y="448">¼″ TS</text>
          <text x="746" y="352">¼″ TS</text>
          <text x="687" y="448">¼″ TS</text>
        </g>

        <g className="epk2-stage__route epk2-stage__route--xlr">
          <path d="M230 120 C320 74 760 74 828 247" />
          <path d="M465 119 C600 128 750 151 828 254" />
          <path d="M746 119 C792 137 817 178 828 261" />
          <path d="M148 316 C300 305 610 276 828 268" />
          <path d="M454 340 C610 336 738 302 828 275" />
          <path d="M736 340 C774 331 808 310 828 282" />
        </g>

        <g className="epk2-stage__route epk2-stage__route--monitor">
          <path d="M828 305 C654 337 344 392 180 447" />
          <path d="M828 312 C684 383 545 438 474 491" />
          <path d="M828 319 C794 384 768 438 748 491" />
        </g>

        <g className="epk2-stage__route-label">
          <text x="601" y="82">BALANCED XLR TO STAGE BOX</text>
          <text x="583" y="394">MIX 1–3: XLR ACTIVE / NL4 PASSIVE</text>
        </g>

        <g className="epk2-stage__equipment epk2-stage__equipment--drums">
          <circle cx="158" cy="112" r="54" />
          <circle cx="117" cy="92" r="23" />
          <circle cx="199" cy="92" r="23" />
          <circle cx="105" cy="142" r="25" />
          <circle cx="211" cy="142" r="31" />
          <text textAnchor="middle" x="158" y="108">DRUM KIT</text>
          <text textAnchor="middle" x="158" y="124">VENUE MIC PACKAGE</text>
        </g>

        <g className="epk2-stage__equipment">
          <rect height="64" rx="5" width="106" x="427" y="87" />
          <text textAnchor="middle" x="480" y="114">GUITAR AMP</text>
          <text textAnchor="middle" x="480" y="132">SM57 / EQ.</text>
          <rect height="64" rx="5" width="106" x="708" y="87" />
          <text textAnchor="middle" x="761" y="114">BASS AMP</text>
          <text textAnchor="middle" x="761" y="132">SM57 / EQ.</text>
        </g>

        <g className="epk2-stage__performer">
          <circle cx="158" cy="252" r="42" />
          <text textAnchor="middle" x="158" y="248">DRUMMER</text>
          <text textAnchor="middle" x="158" y="265">BGV</text>
          <circle cx="454" cy="252" r="42" />
          <text textAnchor="middle" x="454" y="248">LUCA</text>
          <text textAnchor="middle" x="454" y="265">GTR / LEAD VOX</text>
          <circle cx="736" cy="252" r="42" />
          <text textAnchor="middle" x="736" y="248">BASS</text>
          <text textAnchor="middle" x="736" y="265">BGV</text>
        </g>

        <g className="epk2-stage__mic">
          <circle cx="148" cy="316" r="11" />
          <path d="M148 327 V359 M134 359 H162" />
          <text textAnchor="middle" x="148" y="380">SM58 / EQ.</text>
          <circle cx="454" cy="340" r="11" />
          <path d="M454 351 V383 M440 383 H468" />
          <text textAnchor="middle" x="454" y="365">LEAD VOCAL</text>
          <circle cx="736" cy="340" r="11" />
          <path d="M736 351 V383 M722 383 H750" />
          <text textAnchor="middle" x="736" y="365">BACKING VOCAL</text>
        </g>

        <g className="epk2-stage__pedal">
          <rect height="32" rx="4" width="94" x="407" y="384" />
          <text textAnchor="middle" x="454" y="405">GTR PEDALBOARD</text>
          <rect height="32" rx="4" width="94" x="689" y="384" />
          <text textAnchor="middle" x="736" y="405">BASS PEDALBOARD</text>
        </g>

        <g className="epk2-stage__monitor">
          <path d="M113 465 L137 429 H203 L227 465 Z" />
          <text textAnchor="middle" x="170" y="453">MIX 1</text>
          <path d="M397 515 L421 479 H487 L511 515 Z" />
          <text textAnchor="middle" x="454" y="503">MIX 2</text>
          <path d="M681 515 L705 479 H771 L795 515 Z" />
          <text textAnchor="middle" x="738" y="503">MIX 3</text>
        </g>

        <g className="epk2-stage__power">
          <circle cx="69" cy="189" r="16" />
          <text textAnchor="middle" x="69" y="194">AC</text>
          <text x="42" y="218">DRUMS</text>
          <circle cx="371" cy="119" r="16" />
          <text textAnchor="middle" x="371" y="124">AC</text>
          <text textAnchor="middle" x="371" y="148">GTR AMP</text>
          <circle cx="371" cy="400" r="16" />
          <text textAnchor="middle" x="371" y="405">AC</text>
          <text textAnchor="middle" x="371" y="429">GTR PEDAL</text>
          <circle cx="830" cy="400" r="16" />
          <text textAnchor="middle" x="830" y="405">AC</text>
          <text textAnchor="middle" x="830" y="429">BASS ZONE</text>
        </g>

        <g className="epk2-stage__stagebox">
          <rect height="116" rx="5" width="54" x="816" y="238" />
          <text textAnchor="middle" transform="rotate(90 843 296)" x="843" y="296">
            STAGE BOX / FOH
          </text>
        </g>

        <g className="epk2-stage__patch">
          <rect height="73" rx="5" width="348" x="42" y="497" />
          <text x="58" y="520">PATCH: 1–N DRUMS · N+1 GTR AMP · N+2 BASS AMP</text>
          <text x="58" y="540">N+3 LEAD VOX · N+4 BASS BGV · N+5 DRUM BGV</text>
          <text x="58" y="559">ALL MICROPHONE LINES: BALANCED XLR</text>
        </g>
      </svg>
    </div>
  );
}
