import Link from 'next/link'

export default function SiteFooter() {
  return (
    <footer className="bg-ink text-slate-300">
      <div className="border-b border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-4 py-8 text-center md:flex-row md:text-left">
          <h3 className="font-display text-2xl font-bold text-white">
            Register Now &amp; Start Your Journey With Us
          </h3>
          <Link href="/register" className="btn-gold">Register Now ✈</Link>
        </div>
      </div>
      <div className="container-x grid gap-8 py-12 md:grid-cols-4">
        <div>
          <img
            src="/assets/img/logos/logo-footer.png"
            alt="Classic Group of Travels"
            className="h-10 w-auto md:h-14"
          />
          <p className="mt-3 text-sm leading-relaxed">
            We specialize in providing seamless travel experiences — from affordable air tickets to
            complete Umrah packages.
          </p>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/" className="hover:text-gold-light">Home</Link></li>
            <li><Link href="/about" className="hover:text-gold-light">About us</Link></li>
            <li><Link href="/destinations" className="hover:text-gold-light">Packages</Link></li>
            <li><Link href="/contact" className="hover:text-gold-light">Contact Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Services</h4>
          <ul className="space-y-2 text-sm">
            <li>Air Tickets</li>
            <li>Visa Services</li>
            <li>Umrah Services</li>
            <li>Hotel Bookings</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-semibold text-white">Get In Touch</h4>
          <ul className="space-y-2 text-sm">
            <li>+92 300 0773940</li>
            <li>+92 345 7777948</li>
            <li>info@classicgroupoftravels.com</li>
            <li>Office No. 1, 1st Floor, Rajpoot Plaza, Blue Area, Islamabad</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-xs text-slate-400">
        © 2026 Classic Group of Travels. All Rights Reserved.
      </div>
    </footer>
  )
}
