/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        mono: ['"Courier Prime"', '"Courier New"', "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
        serif: ['"Newsreader"', "Georgia", "serif"],
      },
      colors: {
        ink: {
          950: "#0a0a0c",
          900: "#0e0e11",
          850: "#141418",
          800: "#1a1a1f",
          700: "#26262d",
          600: "#3a3a44",
        },
        amber: {
          glow: "#f5b942",
        },
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: "0", transform: "translateY(6px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        "scale-in": {
          "0%": { opacity: "0", transform: "scale(0.97)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
