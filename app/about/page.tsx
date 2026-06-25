import Link from 'next/link'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import PageHero from '../../components/site/PageHero'

export const metadata = { title: 'About Us — Classic Group of Travels' }

const premium = [
  { t: 'Hajj & Umrah Services', d: 'Comprehensive Umrah packages with top-class accommodation, transport and guidance.' },
  { t: 'Air Tickets', d: 'Book domestic and international flights at the best market rates, hassle-free.' },
  { t: 'Visit Visa Services', d: 'Fast and reliable visa processing for multiple destinations worldwide.' },
  { t: 'Tour Packages', d: 'Explore customized tour packages for local and international destinations.' },
  { t: 'Hotel Bookings', d: 'Reserve top-rated hotels near the holy sites and worldwide at preferred partner rates.' },
  { t: 'Transport Services', d: 'Comfortable, reliable ground transport for groups and individual travelers.' },
]

export default function About() {
  return (
    <>
      <SiteHeader />
      <PageHero title="About Us" crumb="Home / About" />
      <section className="container-x py-16">
        <span className="script-accent">Let&rsquo;s Go Together</span>
        <h2 className="font-display text-3xl font-bold">Your Trusted Travel Partner</h2>
        <div className="mt-4 max-w-3xl space-y-4 text-slate-600">
          <p>
            Welcome to Classic Group of Travels — your trusted travel partner for unforgettable journeys around the
            world. Whether you&rsquo;re planning a peaceful Umrah pilgrimage, a family vacation, or a corporate trip, we
            provide tailored travel solutions designed to fit your needs, comfort and budget.
          </p>
          <p>
            We provide Umrah services 24/7, ensuring comfort, convenience and peace of mind — no matter where you are in
            the world. Our Umrah packages come with a Best Price Guarantee, top-rated hotels, visa assistance and
            reliable transport — all tailored to make your pilgrimage truly memorable.
          </p>
        </div>
      </section>
      <section className="bg-slate-50 py-16">
        <div className="container-x">
          <div className="text-center">
            <span className="script-accent">Best Experience</span>
            <h2 className="font-display text-3xl font-bold">Our Premium Travel Services</h2>
          </div>
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {premium.map((p) => (
              <div key={p.t} className="rounded-2xl bg-white p-6 shadow-card">
                <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-2xl text-gold">✈</div>
                <h3 className="mt-4 font-display text-lg font-bold">{p.t}</h3>
                <p className="mt-2 text-sm text-slate-600">{p.d}</p>
              </div>
            ))}
          </div>
          <div className="mt-10 text-center">
            <Link href="/contact" className="btn-gold">Plan Your Trip With Us</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
