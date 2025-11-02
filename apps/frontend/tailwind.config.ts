import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        background: '#1e1e1e',
        surface: '#252526',
        border: '#3e3e42',
        text: {
          primary: '#cccccc',
          secondary: '#858585',
          accent: '#4fc1ff'
        }
      }
    }
  }
} satisfies Config;
