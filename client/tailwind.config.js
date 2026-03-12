/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Deyaar Brand Colors
        deyaar: {
          orange: '#E8754F',
          'orange-light': '#F08A6A',
          'orange-dark': '#D5633F',
          brown: '#A2593F',
          'brown-light': '#B56D52',
          'brown-dark': '#8A4A33',
          beige: '#F5EBD5',
          'beige-light': '#FAF5E8',
          'beige-dark': '#E8DCC0',
          dark: '#2D2420',
          'dark-light': '#3D3228',
        },
      },
      fontFamily: {
        acta: ['"Acta Pro"', 'Georgia', 'serif'],
        helvetica: ['"Helvetica Neue"', 'Arial', 'sans-serif'],
      },
      boxShadow: {
        'deyaar': '0 4px 20px rgba(168, 89, 63, 0.15)',
        'deyaar-lg': '0 8px 30px rgba(168, 89, 63, 0.2)',
      },
      backgroundImage: {
        'deyaar-gradient': 'linear-gradient(135deg, #E8754F 0%, #A2593F 100%)',
        'deyaar-gradient-soft': 'linear-gradient(135deg, #F5EBD5 0%, #FAF5E8 100%)',
      },
    },
  },
  plugins: [],
};
