/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      animation: {
        'fade-in': 'fadeIn 1s ease-in-out',
        'fade-in-longer': 'fadeIn 2s ease-in-out',
        'fade-out': "fadeOut 2s ease-in forwards",
        'popout': "popout 0.3s ease-in-out",
        'shake': "shake 0.5s ease-in-out",
        'quest-remove': 'questRemove 0.5s ease-in-out',
        'border-shine': 'borderShine 2s linear infinite',
      },

      backgroundSize: {
        '200': '200% 200%',
      },
      
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        popout: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" }
        },
        shake: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "50%": { transform: "rotate(5deg)" },
          "75%": { transform: "rotate(-5deg)" }
        },
        questRemove: {
          '0%': { opacity: '1', transform: 'scale(1)' },
          '100%': { opacity: '0.6', transform: 'scale(0.05)' },
        },
        borderShine: {
          '0%': { backgroundPosition: '0% 50%' },
          '100%': { backgroundPosition: '200% 50%' },
        },
      },
    },
  },
  plugins: [],
}