'use client'
import { useState } from 'react'

const IMG = '/assets/img'

const gallery = [
  { src: `${IMG}/gallery/baku.jpeg`, span: 'sm:col-span-2 sm:row-span-2' },
  { src: `${IMG}/gallery/singapore.jpeg`, span: '' },
  { src: `${IMG}/gallery/Thailand.webp`, span: '' },
  { src: `${IMG}/gallery/dubai.jpeg`, span: '' },
  { src: `${IMG}/gallery/malasyia.jpeg`, span: '' },
  { src: `${IMG}/gallery/hotels-1.webp`, span: 'sm:col-span-2' },
]

export default function GallerySection() {
  const [active, setActive] = useState<string | null>(null)

  return (
    <section className="texture-lines relative overflow-x-clip bg-slate-50 py-16">
      <div className="container-x relative">
        <div className="text-center">
          <p className="font-script text-4xl text-gold sm:text-5xl">Make Your Tour More Pleasure</p>
          <span className="script-accent mt-2">Photo Gallery</span>
          <h2 className="font-display text-3xl font-bold">Recent Gallery</h2>
        </div>
        <div className="mt-10 grid auto-rows-[150px] grid-cols-2 gap-4 sm:grid-cols-4">
          {gallery.map((g) => (
            <button
              key={g.src}
              onClick={() => setActive(g.src)}
              className={`group relative overflow-hidden rounded-2xl ${g.span}`}
            >
              <img
                src={g.src}
                alt="Gallery"
                className="h-full w-full object-cover transition duration-500 group-hover:scale-110"
              />
              <span className="absolute inset-0 grid place-items-center bg-ink/0 text-2xl text-white opacity-0 transition group-hover:bg-ink/40 group-hover:opacity-100">
                🔍
              </span>
            </button>
          ))}
        </div>
      </div>

      {active && (
        <div
          onClick={() => setActive(null)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/80 p-6"
        >
          <img src={active} alt="Preview" className="max-h-[85vh] max-w-[90vw] rounded-xl object-contain" />
          <button className="absolute right-6 top-6 text-3xl text-white" aria-label="Close">×</button>
        </div>
      )}
    </section>
  )
}
