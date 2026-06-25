AIRLINE LOGOS — drop your self-hosted logo files here.

The marquee (components/site/AirlinesMarquee.tsx) expects these filenames.
Replace each with the real logo. Transparent PNG or SVG is best, trimmed,
roughly the same height (e.g. 80–120px tall). If you use .svg or .webp instead
of .png, just update the matching `src` in AirlinesMarquee.tsx.

  saudia.png
  flyadeal.png
  flynas.png
  air-arabia.png
  qatar-airways.png
  pia.png
  fly-jinnah.png
  airsial.png
  sereneair.png
  flydubai.png
  salamair.png

To ADD an airline: copy its logo here and add one line to the `airlines`
array in components/site/AirlinesMarquee.tsx, e.g.
  { name: 'Turkish Airlines', src: `${LOGO_DIR}/turkish.png` },

To REMOVE one: delete its line from that array.

Styling note: logos render in subtle greyscale and turn full-colour on hover.
If you prefer full colour always, remove `grayscale` and `opacity-70` from the
<img> className in AirlinesMarquee.tsx.
