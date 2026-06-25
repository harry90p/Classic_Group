'use client'

// Airline partners shown as a continuously scrolling logo marquee.
//
// Drop your self-hosted logo files into:  public/assets/img/logos/airlines/
// then keep (or tweak) the `src` paths below. Transparent PNG or SVG works best.
// Recommended: same height, transparent background, trimmed whitespace.

type Airline = { name: string; src: string }

const LOGO_DIR = '/assets/img/logos/airlines'

const airlines: Airline[] = [
  { name: 'Saudia', src: `${LOGO_DIR}/saudia.png` },
  { name: 'flyadeal', src: `${LOGO_DIR}/flyadeal.png` },
  { name: 'flynas', src: `${LOGO_DIR}/flynas.png` },
  { name: 'Air Arabia', src: `${LOGO_DIR}/air-arabia.png` },
  { name: 'Qatar Airways', src: `${LOGO_DIR}/qatar-airways.png` },
  { name: 'PIA', src: `${LOGO_DIR}/pia.png` },
  { name: 'Fly Jinnah', src: `${LOGO_DIR}/fly-jinnah.png` },
  { name: 'AirSial', src: `${LOGO_DIR}/airsial.png` },
  { name: 'AirBlue', src: `${LOGO_DIR}/airblue.png` },
  { name: 'SereneAir', src: `${LOGO_DIR}/sereneair.png` },
  { name: 'flydubai', src: `${LOGO_DIR}/flydubai.png` },
  { name: 'SalamAir', src: `${LOGO_DIR}/salamair.png` },
  { name: 'Etihad', src: `${LOGO_DIR}/etihad.png` },
  { name: 'Jazeera', src: `${LOGO_DIR}/jazeera.png` },
  { name: 'Thai Airways', src: `${LOGO_DIR}/thai-airways.png` },
  { name: 'Turkish Airlines', src: `${LOGO_DIR}/turkish.png` },
  { name: 'Emirates', src: `${LOGO_DIR}/emirates.png` },
  { name: 'Oman Air', src: `${LOGO_DIR}/oman-air.png` },
  { name: 'Gulf Air', src: `${LOGO_DIR}/gulf-air.png` },
]

export default function AirlinesMarquee() {
  // Duplicate the list so the -50% scroll loops seamlessly.
  const row = [...airlines, ...airlines]

  return (
    <section className="border-y bg-white py-10">
      <div className="container-x">
        <p className="mb-6 text-center text-sm font-semibold uppercase tracking-widest text-slate-400">
          Our Trusted Airline Partners
        </p>
        <div className="marquee-mask overflow-hidden">
          <div className="animate-marquee flex w-max items-center gap-12">
            {row.map((a, i) => (
              <img
                key={i}
                src={a.src}
                alt={a.name}
                title={a.name}
                loading="lazy"
                draggable={false}
                className="h-10 w-auto shrink-0 object-contain opacity-70 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0 sm:h-12"
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
