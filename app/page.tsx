import Link from 'next/link'
import SiteHeader from '../components/site/SiteHeader'
import SiteFooter from '../components/site/SiteFooter'
import HeroSlider from '../components/site/HeroSlider'
import ServicesSlider from '../components/site/ServicesSlider'
import DestinationsSlider from '../components/site/DestinationsSlider'
import GallerySection from '../components/site/GallerySection'
import AirlinesMarquee from '../components/site/AirlinesMarquee'

const IMG = '/assets/img'

const planPoints: Array<[string, string]> = [
  ['Exclusive Trips', 'From luxurious getaways to spiritual journeys, our packages make every trip memorable and stress-free.'],
  ['Safety First Always', 'We work only with trusted airlines, hotels and transport partners.'],
  ['Professional Guides', 'Our expert consultants and on-ground guides ensure ease and confidence.'],
]

const why: Array<[string, string]> = [
  ['24/7 Customer Support', 'Round-the-clock assistance to make sure your travel is stress-free at every step.'],
  ['Affordable Packages', 'Get the best value for your money with transparent pricing and no hidden costs.'],
  ['Trusted & Licensed', 'A government-approved and experienced travel agency with thousands of happy clients.'],
  ['Global Destinations', 'From Umrah to world tours — explore a wide range of destinations with expert planning.'],
]

export default function Home() {
  return (
    <>
      <SiteHeader />

      {/* Hero slider */}
      <HeroSlider />

      {/* Plan your trip */}
      <section className="container-x grid items-center gap-10 py-16 md:grid-cols-2">
        <div className="grid grid-cols-2 gap-4">
          <img src={`${IMG}/Makkah.jpg`} alt="Makkah" className="col-span-2 h-64 w-full rounded-2xl object-cover" />
          <img src={`${IMG}/Cave-of-Hira-2.jpg`} alt="Cave of Hira" className="h-40 w-full rounded-2xl object-cover" />
          <img src={`${IMG}/dubai-1.webp`} alt="Dubai" className="h-40 w-full rounded-2xl object-cover" />
        </div>
        <div>
          <span className="script-accent">Let&rsquo;s Go Together</span>
          <h2 className="mt-1 font-display text-3xl font-bold">Plan Your Trip With Us</h2>
          <p className="mt-4 text-slate-600">
            Welcome to Classic Group of Travels — your trusted travel partner for unforgettable journeys around the
            world. Whether a peaceful Umrah pilgrimage, a family vacation, or a corporate trip, we provide tailored
            solutions designed for your needs, comfort and budget.
          </p>
          <ul className="mt-6 space-y-4">
            {planPoints.map(([t, d]) => (
              <li key={t} className="flex gap-3">
                <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full bg-gold/10 text-gold">✓</span>
                <div>
                  <div className="font-semibold">{t}</div>
                  <p className="text-sm text-slate-600">{d}</p>
                </div>
              </li>
            ))}
          </ul>
          <Link href="/about" className="btn-dark mt-6">Learn More →</Link>
        </div>
      </section>

      {/* Services slider (with category texture) */}
      <section className="texture-category relative bg-slate-50 py-16">
        <div className="container-x relative">
          <div className="text-center">
            <p className="font-script text-4xl text-gold sm:text-5xl">Our Services</p>
            <span className="script-accent mt-2">What We Offer</span>
            <h2 className="font-display text-3xl font-bold">Our Travel Services</h2>
            <p className="mx-auto mt-2 max-w-xl text-slate-600">
              Discover complete travel solutions with Classic Group of Travels.
            </p>
          </div>
          <div className="mt-10">
            <ServicesSlider />
          </div>
        </div>
      </section>

      {/* Destinations slider */}
      <section className="container-x py-16">
        <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
          <div>
            <span className="script-accent">Top Destinations</span>
            <h2 className="font-display text-3xl font-bold">Explore The World&rsquo;s Most Loved Places</h2>
          </div>
          <p className="max-w-sm text-sm text-slate-600">
            100+ destinations across the globe — from spiritual journeys to luxury escapes, expertly curated.
          </p>
        </div>
        <div className="mt-8">
          <DestinationsSlider />
        </div>
      </section>

      {/* Why choose us (with line texture) */}
      <section className="texture-lines bg-sky-50 py-16">
        <div className="container-x text-center">
          <span className="script-accent">Why Choose Us</span>
          <h2 className="font-display text-3xl font-bold">Your Trusted Partner In Every Journey</h2>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {why.map(([t, d]) => (
              <div key={t} className="rounded-2xl border border-slate-100 bg-white p-6 text-left">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-2xl text-gold">★</div>
                <h3 className="mt-4 font-display text-lg font-bold">{t}</h3>
                <p className="mt-2 text-sm text-slate-600">{d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recent gallery (with lightbox + watermark + texture) */}
      <GallerySection />

      {/* Airline partners marquee */}
      <AirlinesMarquee />

      <SiteFooter />
    </>
  )
}
