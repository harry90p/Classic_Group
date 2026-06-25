'use client'
import { Swiper, SwiperSlide } from 'swiper/react'
import { Autoplay, Navigation } from 'swiper/modules'
import 'swiper/css'
import 'swiper/css/navigation'

const IMG = '/assets/img'

const autoplayCfg = { delay: 3500, disableOnInteraction: false }
const breakpointsCfg = {
  0: { slidesPerView: 1.3 },
  640: { slidesPerView: 2.3 },
  1024: { slidesPerView: 3 },
}

const destinations = [
  { name: 'Baku', img: `${IMG}/destination/baku.jpeg` },
  { name: 'Singapore', img: `${IMG}/destination/singapore.jpeg` },
  { name: 'Thailand', img: `${IMG}/destination/Thailand.jpeg` },
  { name: 'Dubai', img: `${IMG}/destination/dubai.jpeg` },
  { name: 'Saudia', img: `${IMG}/destination/saudia.jpeg` },
  { name: 'Iran', img: `${IMG}/destination/iran.jpeg` },
  { name: 'Iraq', img: `${IMG}/destination/iraq.jpeg` },
  { name: 'Malaysia', img: `${IMG}/destination/malaysia.jpeg` },
  { name: 'Maldives', img: `${IMG}/destination/maldives.jpeg` },
]

export default function DestinationsSlider() {
  return (
    <Swiper
      modules={[Autoplay, Navigation]}
      autoplay={autoplayCfg}
      navigation
      spaceBetween={20}
      loop
      breakpoints={breakpointsCfg}
    >
      {destinations.map((d) => (
        <SwiperSlide key={d.name}>
          <div className="group overflow-hidden rounded-2xl shadow-card">
            <div className="h-60 overflow-hidden">
              <img
                src={d.img}
                alt={d.name}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
            </div>
            <div className="flex items-center justify-between bg-white px-4 py-3">
              <span className="font-display font-semibold">{d.name}</span>
              <span className="text-sm text-gold">📍 Explore</span>
            </div>
          </div>
        </SwiperSlide>
      ))}
    </Swiper>
  )
}
