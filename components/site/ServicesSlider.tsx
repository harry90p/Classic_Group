'use client'
import Link from 'next/link'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Pagination } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/pagination'

const IMG = '/assets/img'

const autoplayCfg = { delay: 3000, disableOnInteraction: false }
const paginationCfg = { clickable: true }
const breakpointsCfg = {
  0: { slidesPerView: 1.2 },
  640: { slidesPerView: 2.2 },
  1024: { slidesPerView: 4 },
}

const services = [
  { title: 'Visit Visa Services', cta: 'Apply Now', img: `${IMG}/services/visa.jpeg` },
  { title: 'Tour Packages', cta: 'Explore Tours', img: `${IMG}/services/tour_services.jpg` },
  { title: 'Hotel Booking', cta: 'Book Now', img: `${IMG}/services/hotels.jpg` },
  { title: 'Hajj & Umrah Services', cta: 'View Details', img: `${IMG}/services/hajj_umrah.jpg` },
  { title: 'Air Tickets', cta: 'Book Now', img: `${IMG}/services/tickets.png` },
  { title: 'Ziarat Services', cta: 'Learn More', img: `${IMG}/services/ziyarat.jpg` },
  { title: 'Travel Insurance', cta: 'View Details', img: `${IMG}/services/travel_insurance.png` },
  { title: 'Transport Services', cta: 'View Details', img: `${IMG}/services/transport.jpg` },
]

export default function ServicesSlider() {
  return (
    <Swiper
      modules={[Autoplay, Pagination]}
      autoplay={autoplayCfg}
      pagination={paginationCfg}
      spaceBetween={24}
      loop
      className="!pb-12"
      breakpoints={breakpointsCfg}
    >
      {services.map((s) => (
        <SwiperSlide key={s.title}>
          <div className="group overflow-hidden rounded-2xl bg-white text-left shadow-card transition hover:-translate-y-1">
            <div className="h-44 overflow-hidden">
              <img
                src={s.img}
                alt={s.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </div>
            <div className="p-5">
              <h3 className="font-display text-lg font-bold">{s.title}</h3>
              <Link href="/services" className="mt-2 inline-block text-sm font-semibold text-gold">
                {s.cta} →
              </Link>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
