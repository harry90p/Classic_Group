import SiteHeader from '../../components/site/SiteHeader'
import SiteFooter from '../../components/site/SiteFooter'
import PageHero from '../../components/site/PageHero'

export const metadata = { title: 'Contact Us — Classic Group of Travels' }

const offices = [
  {
    name: 'Islamabad Office (Head Office)',
    address: 'Office No. 1, 1st Floor, Rajpoot Plaza, Near PIA Building, Fazal-e-Haq Road, Blue Area, Islamabad — Pakistan',
    phones: ['+92 300 3000477', '+92 345 7777948', '+92 300 0773940', '051-2604315-16-17'],
    email: 'classicavt@gmail.com',
  },
  {
    name: 'Swat Office',
    address: 'Office # F03, F04, First Floor, Royal Arcade, Old Bus Stand, Mingora, Swat, KPK — Pakistan',
    phones: ['+92 300 0773940', '+92 346 9464623', '+92 345 7777956', '0946 711991-2'],
    email: 'info@classicgroupoftravels.com',
  },
]

export default function Contact() {
  return (
    <>
      <SiteHeader />
      <PageHero title="Contact Us" crumb="Home / Contact Us" />
      <section className="container-x py-16">
        <div className="text-center">
          <span className="script-accent">Get In Touch</span>
          <h2 className="font-display text-3xl font-bold">Our Contact Information</h2>
        </div>
        <div className="mt-10 grid gap-8 lg:grid-cols-2">
          {offices.map((o) => (
            <div key={o.name} className="rounded-2xl border border-slate-100 bg-white p-6 shadow-card">
              <h3 className="font-display text-xl font-bold text-gold">{o.name}</h3>
              <p className="mt-3 text-sm text-slate-600">📍 {o.address}</p>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Phone</div>
                <ul className="mt-1 space-y-1 text-sm">
                  {o.phones.map((p) => (
                    <li key={p}><a href={`tel:${p.replace(/[^+0-9]/g, '')}`} className="hover:text-gold">{p}</a></li>
                  ))}
                </ul>
              </div>
              <div className="mt-4">
                <div className="text-xs font-semibold uppercase tracking-wide text-slate-400">Email</div>
                <a href={`mailto:${o.email}`} className="text-sm hover:text-gold">{o.email}</a>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-12 rounded-2xl bg-slate-50 p-8">
          <h3 className="font-display text-2xl font-bold">Send Us a Message</h3>
          <form className="mt-6 grid gap-4 sm:grid-cols-2">
            <input className="field" placeholder="Your Name" />
            <input className="field" placeholder="Email Address" />
            <input className="field" placeholder="Phone Number" />
            <input className="field" placeholder="Subject" />
            <textarea className="field sm:col-span-2" rows={4} placeholder="Your Message" />
            <button type="button" className="btn-gold sm:col-span-2 sm:w-max">Send Message ✈</button>
          </form>
          <p className="mt-2 text-xs text-slate-400">
            Demo form — message handling will be wired to email in a later step.
          </p>
        </div>
      </section>
      <SiteFooter />
    </>
  )
}
