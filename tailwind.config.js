/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        surface: '#f5f7fb',
        ink: '#1D273B',
        muted: '#7889A8',
        line: '#E6EAF2',
        brand: '#2F7BFF',
        warning: '#f59e0b',
        danger: '#dc2626',
      },
      boxShadow: {
        panel: '0 1px 2px rgba(16, 24, 40, 0.05)',
        drawer: '-16px 0 36px rgba(16, 24, 40, 0.16)',
        toast: '0 14px 34px rgba(16, 24, 40, 0.16)',
      },
    },
  },
  plugins: [],
};
