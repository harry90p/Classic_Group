import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Classic Group of Travels — Hajj, Umrah, Tours & Air Tickets',
  description:
    'Your trusted travel partner for Umrah, Hajj, group flights, visas, hotels and worldwide tours. Best-price guarantee with 24/7 support.',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
