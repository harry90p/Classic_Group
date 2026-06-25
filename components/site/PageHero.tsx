const IMG = '/assets/img'

export default function PageHero({ title, crumb }: { title: string; crumb: string }) {
  return (
    <section className="relative bg-ink">
      <img
        src={`${IMG}/madinah.webp`}
        alt=""
        className="h-56 w-full object-cover opacity-30"
      />
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center text-white">
        <h1 className="font-display text-4xl font-extrabold">{title}</h1>
        <p className="mt-1 text-sm text-white/70">{crumb}</p>
      </div>
    </section>
  )
}
