/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
    "../packages/landing-ui/src/**/*.{js,jsx}",
    "./packages/landing-ui/src/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        serif: ['Playfair Display', 'serif'],
        sans: ['Plus Jakarta Sans', 'sans-serif'],
      },
      keyframes: {
        'section-fade-in': {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        'section-slide-up': {
          '0%': { opacity: '0', transform: 'translateY(12px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'section-fade-in': 'section-fade-in 0.45s ease-out both',
        'section-slide-up': 'section-slide-up 0.5s ease-out both',
      },
    },
  },
  plugins: [],
}
