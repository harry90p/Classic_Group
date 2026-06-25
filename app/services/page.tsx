import Link from 'next/link'
import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import PageHero from '../../components/site/PageHero'

export const metadata = { title: 'Services — Classic Group of Travels' }

const services = [
  { t: 'Hajj & Umrah Services', d: 'Complete Umrah and Hajj packages with visa, transport, ziyarat and accommodation near the Haramain.' },
  { t: 'Group Flight Tickets', d: 'Pre-blocked group seats to KSA, UAE, Oman, Qatar, Bahrain, UK and Umrah sectors at agent rates.' },
  { t: 'Air Tickets', d: 'Domestic and international ticketing on all major airlines at the best market fares.' },
  { t: 'Visit Visa Services', d: 'Fast, reliable visa processing for multiple destinations worldwide.' },
  { t: 'Tour Packages', d: 'Customized local and international tour packages for families, groups and corporates.' },
  { t: 'Hotel Bookings', d: 'Top-rated hotels worldwide and near the holy sites at preferred partner rates.' },
  { t: 'Transport Services', d: 'Comfortable ground transport and transfers for individuals and large groups.' },
  { t: 'Travel Insurance', d: 'Protect every journey with reliable travel insurance options.' },
]

export default function Services() {
  return (
    <>
      <SiteHeader />
      <PageHero title="Our Services" crumb="Home / Services" />
      <section className="container-x py-16">
        <div className="text-center">
          <span className="script-accent">What We Offer</span>
          <h2 className="font-display text-3xl font-bold">Complete Travel Solutions</h2>
          <p className="mx-auto mt-2 max-w-xl text-slate-600">
            From tickets to visas, Umrah to world tours — we handle every part of your journey.
          </p>
        </div>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {services.map((s) => (
            <div key={s.t} className="rounded-2xl bg-white p-6 shadow-card transition hover:-translate-y-1">
              <div className="grid h-12 w-12 place-items-center rounded-xl bg-gold/10 text-2xl text-gold">✈</div>
              <h3 className="mt-4 font-display text-base font-bold">{s.t}</h3>
              <p className="mt-2 text-sm text-slate-600">{s.d}</p>
            </div>
          ))}
        </div>
        <div className="mt-12 rounded-2xl bg-ink p-10 text-center text-white">
          <h3 className="font-display text-2xl font-bold">Are you a travel agent?</h3>
          <p className="mx-auto mt-2 max-w-lg text-white/80">
            Join our partner portal for exclusive group rates, live PNR deadline tracking and instant booking.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <Link href="/register" className="btn-gold">Become a Partner</Link>
            <Link href="/login" className="btn-dark bg-white/10 hover:bg-white/20">Agent Login</Link>
          </div>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
