import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import PageHero from '../../components/site/PageHero'

export const metadata = { title: 'Destinations — Classic Group of Travels' }

const IMG = '/assets/img'

const groups = [
  { name: 'KSA Groups', loc: 'Kingdom of Saudi Arabia', img: `${IMG}/destination/riyadh.jpeg` },
  { name: 'UAE Groups', loc: 'United Arab Emirates', img: `${IMG}/destination/abu_dhabi.jpeg` },
  { name: 'Umrah Groups', loc: 'Makkah & Madinah', img: `${IMG}/destination/Makkah.jpeg` },
  { name: 'Oman Groups', loc: 'Oman', img: `${IMG}/destination/muscat.jpeg` },
  { name: 'Qatar Groups', loc: 'Qatar', img: `${IMG}/destination/qatar.jpeg` },
  { name: 'Bahrain Groups', loc: 'Bahrain', img: `${IMG}/destination/bahrain.jpeg` },
  { name: 'UK Groups', loc: 'United Kingdom', img: `${IMG}/destination/uk.jpeg` },
  { name: 'World Tours', loc: 'Iran, Iraq, Malaysia, Thailand & more', img: `${IMG}/destination/world.jpeg` },
]

export default function Destinations() {
  return (
    <>
      <SiteHeader />
      <PageHero title="Destinations" crumb="Home / Destinations" />
      <section className="container-x py-16">
        <div className="text-center">
          <span className="script-accent">Top Destinations</span>
          <h2 className="font-display text-3xl font-bold">Explore Our Travel Groups</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            Premium group deals to destinations worldwide. Log in to the agent portal for live seats and pricing.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {groups.map((g) => (
            <div key={g.name} className="group relative overflow-hidden rounded-2xl shadow-card">
              <img src={g.img} alt={g.name} className="h-64 w-full object-cover transition duration-500 group-hover:scale-110" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-4 text-white">
                <div className="font-display text-lg font-bold">{g.name}</div>
                <div className="text-xs text-white/80">📍 {g.loc}</div>
              </div>
            </div>
          ))}
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
