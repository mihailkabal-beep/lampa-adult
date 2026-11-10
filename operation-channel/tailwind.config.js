/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        ink: { 950: '#070b12', 900: '#0b111c', 850: '#0f1724', 800: '#131d2d', 700: '#1b2840', 600: '#26375a', 500: '#3a4f78' },
        signal: { DEFAULT: '#2ee6c5', dim: '#1a8f7c' },
        warn: '#ffb547',
        alert: '#ff5d6c',
        info: '#5aa9ff',
      },
      fontFamily: {
        sans: ['"Inter"', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'Consolas', 'monospace'],
      },
      keyframes: {
        ping2: { '0%': { transform: 'scale(1)', opacity: '0.8' }, '100%': { transform: 'scale(2.4)', opacity: '0' } },
        scan: { '0%': { transform: 'translateY(-100%)' }, '100%': { transform: 'translateY(100%)' } },
        rise: { '0%': { opacity: '0', transform: 'translateY(8px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        blink: { '0%,100%': { opacity: '1' }, '50%': { opacity: '0.25' } },
      },
      animation: {
        ping2: 'ping2 1.8s cubic-bezier(0,0,0.2,1) infinite',
        scan: 'scan 6s linear infinite',
        rise: 'rise .35s ease-out both',
        blink: 'blink 1s steps(2) infinite',
      },
    },
  },
  plugins: [],
};
