/** @type {import('tailwindcss').Config} */

export default {
  darkMode: "class",
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    container: {
      center: true,
      padding: {
        DEFAULT: "1rem",
        sm: "1.5rem",
        lg: "2rem",
      },
    },
    extend: {
      colors: {
        forest: {
          50: "#f0f7ec",
          100: "#d9ebd0",
          200: "#b5d8a4",
          300: "#86bf6c",
          400: "#5fa342",
          500: "#3d8724",
          600: "#2D5016",
          700: "#264012",
          800: "#1f330e",
          900: "#162609",
        },
        sand: {
          50: "#faf8f2",
          100: "#f5f0e3",
          200: "#e8dfc6",
          300: "#d9cba5",
          400: "#C4A265",
          500: "#b08f4e",
          600: "#95763d",
          700: "#7a5f32",
          800: "#5f4a28",
          900: "#45361d",
        },
        fog: {
          50: "#FDFCFA",
          100: "#F5F3EF",
          200: "#EBE7DF",
          300: "#D9D3C7",
        },
        warning: {
          50: "#fff7ed",
          100: "#ffedd5",
          200: "#fed7aa",
          300: "#fdba74",
          400: "#E97A2B",
          500: "#d4641a",
          600: "#b04d12",
        },
      },
      fontFamily: {
        serif: ['"Noto Serif SC"', 'Georgia', 'serif'],
        sans: ['"Noto Sans SC"', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
    },
  },
  plugins: [],
};
