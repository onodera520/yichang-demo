/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f5f7fb',
        ink: '#1D273B',
        muted: '#7889A8',
        line: '#E3E9F3',
        brand: '#2F7BFF',
        warning: '#f59e0b',
        danger: '#dc2626',
      },
      boxShadow: {
        panel: '0 8px 26px rgba(28, 39, 71, 0.055)',
        drawer: '-22px 0 42px rgba(16, 24, 40, 0.18)',
        toast: '0 14px 34px rgba(16, 24, 40, 0.16)',
      },
    },
  },
  plugins: [],
};
