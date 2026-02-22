import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        cosmos: {
          950: "#020617",
          900: "#0a1230",
          800: "#101b3d",
          700: "#172554",
          200: "#bfdbfe",
          100: "#dbeafe",
        },
        neon: {
          cyan: "#22d3ee",
          violet: "#a855f7",
          rose: "#f472b6",
        },
        domain: {
          movie: "#60a5fa",
          history: "#34d399",
          novel: "#f472b6",
        },
      },
      boxShadow: {
        nebula:
          "0 0 30px rgba(56, 189, 248, 0.25), 0 0 60px rgba(168, 85, 247, 0.2)",
        movie:
          "0 0 20px rgba(96, 165, 250, 0.3), 0 0 40px rgba(96, 165, 250, 0.15)",
        history:
          "0 0 20px rgba(52, 211, 153, 0.3), 0 0 40px rgba(52, 211, 153, 0.15)",
        novel:
          "0 0 20px rgba(244, 114, 182, 0.3), 0 0 40px rgba(244, 114, 182, 0.15)",
      },
      backgroundImage: {
        "space-grid":
          "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-up": {
          from: { opacity: "0", transform: "translateY(12px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { boxShadow: "0 0 8px rgba(34, 211, 238, 0.4)" },
          "50%": { boxShadow: "0 0 20px rgba(34, 211, 238, 0.7)" },
        },
        shimmer: {
          from: { backgroundPosition: "-200% 0" },
          to: { backgroundPosition: "200% 0" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.5s ease-out forwards",
        "slide-up": "slide-up 0.5s ease-out forwards",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
        shimmer: "shimmer 3s linear infinite",
        float: "float 6s ease-in-out infinite",
      },
    },
  },
};

export default config;
