/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        // Display serif (Granada-Serial equivalent) + body serif
        display: ['"Playfair Display"', "Georgia", "serif"],
        serif: ['"Playfair Display"', "Georgia", "serif"],
        mono: ['"JetBrains Mono"', "ui-monospace", "monospace"],
        // screenplay surface stays Courier for industry fidelity
        script: ['"Courier Prime"', '"Courier New"', "monospace"],
        sans: ['"Inter"', "system-ui", "sans-serif"],
      },
      colors: {
        // pulp.to palette
        pulp: {
          red: "#c81d05",
          "red-deep": "#a81704",
          "red-dark": "#190300",
          gold: "#f4ab11",
          "gold-soft": "rgba(244,171,17,0.72)",
          "gold-dim": "rgba(244,171,17,0.45)",
          "gold-faint": "rgba(244,171,17,0.16)",
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
        "fade-in": "fade-in 0.5s cubic-bezier(0.22,1,0.36,1)",
        "scale-in": "scale-in 0.3s cubic-bezier(0.22,1,0.36,1)",
      },
    },
  },
  plugins: [],
};
