'use client'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, EffectFade, Pagination, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/effect-fade'
import 'swiper/css/pagination'
import 'swiper/css/navigation'

const HERO = '/assets/img/hero'

const autoplayCfg = { delay: 4500, disableOnInteraction: false }
const paginationCfg = { clickable: true }

const slides = [
  {
    img: `${HERO}/madinah.jpg`,
    script: 'Sacred Destinations Await',
    title: 'Visit Holy Sites With Trusted Travel Plans',
    text: 'Peaceful Hajj & Umrah journeys with top-class accommodation, transport and guidance.',
  },
  {
    img: `${HERO}/dubai.jpg`,
    script: 'Explore The World',
    title: 'Unforgettable Tours To Top Destinations',
    text: 'From Dubai to the Maldives — curated luxury escapes for families and groups.',
  },
  {
    img: `${HERO}/umrah.jpg`,
    script: 'Spiritual Journeys',
    title: 'Premium Umrah Packages, Done Right',
    text: 'Complete Umrah solutions designed for your comfort, budget and peace of mind.',
  },
  {
    img: `${HERO}/singapore.webp`,
    script: 'Make Your Tour More Pleasure',
    title: 'Group Flights & Visas, All Handled',
    text: 'Air tickets, visit visas and group bookings managed end-to-end by experts.',
  },
  {
    img: `${HERO}/malasia.webp`,
    script: 'Let’s Go Together',
    title: 'Your Trusted Travel Partner',
    text: 'A government-approved agency with thousands of happy travelers worldwide.',
  },
]

export default function HeroSlider() {
  return (
    <section className="hero-swiper relative">
      <Swiper
        modules={[Autoplay, EffectFade, Pagination, Navigation]}
        effect="fade"
        loop
        autoplay={autoplayCfg}
        pagination={paginationCfg}
        navigation
        className="h-[480px] md:h-[560px]"
      >
        {slides.map((s, i) => (
          <SwiperSlide key={i}>
            <div className="relative h-full w-full">
              <img src={s.img} alt={s.title} className="h-full w-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-r from-black/80 via-black/45 to-transparent" />
              <div className="container-x absolute inset-0 flex flex-col justify-center">
                <span className="script-accent text-3xl text-gold-light">{s.script}</span>
                <h1 className="mt-2 max-w-2xl font-display text-4xl font-extrabold leading-tight text-white md:text-5xl">
                  {s.title}
                </h1>
                <p className="mt-3 max-w-md text-white/85">{s.text}</p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link href="/contact" className="btn-gold">Plan Your Trip</Link>
                  <Link href="/destinations" className="btn-dark bg-white/10 backdrop-blur hover:bg-white/20">
                    Explore Destinations
                  </Link>
                </div>
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  )
}
