/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx,ts,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // For elegant, classic titles. Corresponds to Cinzel.
        solo: ['"Cinzel"', "serif"],

        // For high-contrast, stylish headlines. Corresponds to Playfair Display.
        display: ['"Playfair Display"', "serif"],

        // Your primary body font. Corresponds to Lato.
        // Using 'sans' will override Tailwind's default sans-serif font stack.
        sans: ['"Lato"', "sans-serif"],

        // For code blocks or technical text. Corresponds to Google Sans Code.
        // Using 'mono' will override the default monospace font stack.
        mono: ['"Google Sans Code"', "monospace"],

        // A decorative, handwritten style. Corresponds to Macondo.
        script: ['"Macondo"', "cursive"],

        // A specific serif font for Korean text. Corresponds to Noto Serif KR.
        serifKr: ['"Noto Serif KR"', "serif"],

        // A condensed, bold font for impactful headings. Corresponds to Oswald.
        heading: ['"Oswald"', "sans-serif"],
      },
      colors: {
        primary: "#3B82F6",
        secondary: "#A11B29",
        background: "#040a20",
        text: "#F4F7FA",
      },
      dropShadow: {
        "glow-orange": "0 0 6px #fb923c, 0 0 12px #fb923c", // Tailwind's orange-400
      },

      animation: {
        "fade-in": "fadeIn 1s ease-in-out",
        "fade-in-longer": "fadeIn 2s ease-in-out",
        "fade-out": "fadeOut 2s ease-in forwards",
        popout: "popout 0.3s ease-in-out",
        shake: "shake 0.5s ease-in-out infinite",
        "quest-remove": "questRemove 0.5s ease-in-out",
        "border-shine": "borderShine 2s linear infinite",
        shine: "shine 2s linear infinite",
        "ping-slow": "ping 3s cubic-bezier(0, 0, 0.2, 1) infinite",
        glow: "glow 2s ease-in-out infinite",
        riseUp: "riseUp 1.5s ease-out",
        rotatePulse: "rotatePulse 4s linear infinite",
        stripes: "stripes 2s linear infinite",
      },

      backgroundSize: {
        200: "200% 200%",
      },

      keyframes: {
        fadeIn: {
          "0%": { opacity: 0 },
          "100%": { opacity: 1 },
        },
        fadeOut: {
          "0%": { opacity: 1 },
          "100%": { opacity: 0 },
        },
        popout: {
          "0%": { transform: "scale(0.5)", opacity: "0" },
          "60%": { transform: "scale(1.1)", opacity: "1" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        shake: {
          "0%, 100%": { transform: "rotate(0deg)" },
          "20%, 60%": { transform: "rotate(-6deg)" },
          "40%, 80%": { transform: "rotate(6deg)" },
        },

        questRemove: {
          "0%": { opacity: "1", transform: "scale(1)" },
          "100%": { opacity: "0.6", transform: "scale(0.05)" },
        },
        shine: {
          "0%": { backgroundPosition: "-100%" },
          "100%": { backgroundPosition: "200%" },
        },
        glow: {
          "0%, 100%": { textShadow: "0 0 10px #3b82f6, 0 0 20px #6366f1" },
          "50%": { textShadow: "0 0 20px #60a5fa, 0 0 40px #a78bfa" },
        },
        riseUp: {
          "0%": { opacity: 0, transform: "translateY(20px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        rotatePulse: {
          "0%": { transform: "rotate(0deg) scale(1)" },
          "50%": { transform: "rotate(180deg) scale(1.1)" },
          "100%": { transform: "rotate(360deg) scale(1)" },
        },

        stripes: {
          "0%": { backgroundPosition: "0 0" },
          "100%": { backgroundPosition: "-40px 0" }, // move left
        },
      },
    },
  },
  plugins: [],
};
