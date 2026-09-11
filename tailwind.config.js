/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./client/index.html",
    "./client/src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        dark: {
          900: '#090a0f',
          850: '#0f111a',
          800: '#141724',
          700: '#1e2235',
          600: '#2b304a',
        },
        accent: {
          primary: '#6366f1',
          hover: '#4f46e5',
          cyan: '#06b6d4',
        }
      },
      boxShadow: {
        'mockup-laptop': '0 30px 80px -15px rgba(0, 0, 0, 0.45), 0 0 1px 1px rgba(255, 255, 255, 0.1)',
        'mockup-mobile': '0 25px 60px -10px rgba(0, 0, 0, 0.5), 0 0 1px 1px rgba(255, 255, 255, 0.15)',
        'glow': '0 0 35px -5px rgba(99, 102, 241, 0.25)',
      },
      animation: {
        'pulse-subtle': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-6px)' },
        }
      }
    },
  },
  plugins: [],
}
