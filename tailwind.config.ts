import type { Config } from 'tailwindcss'

// Design tokens ported from the old classicgroupoftravels.com site.
const config: Config = {
  content: ['./app/**/*.{ts,tsx}', './components/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        gold: { DEFAULT: '#C1A058', dark: '#A8863F', light: '#D8BE7E' },
        ink: '#1F2433',
        charcoal: '#343434',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        display: ['Manrope', 'system-ui', 'sans-serif'],
        script: ['Montez', 'cursive'],
      },
      boxShadow: {
        card: '0 12px 32px -14px rgba(31,36,51,0.25)',
      },
    },
  },
  plugins: [],
}
export default config
