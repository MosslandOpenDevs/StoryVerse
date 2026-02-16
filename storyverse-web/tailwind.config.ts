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
      },
      boxShadow: {
        nebula: "0 0 30px rgba(56, 189, 248, 0.25), 0 0 60px rgba(168, 85, 247, 0.2)",
      },
      backgroundImage: {
        "space-grid":
          "linear-gradient(rgba(148, 163, 184, 0.08) 1px, transparent 1px), linear-gradient(90deg, rgba(148, 163, 184, 0.08) 1px, transparent 1px)",
      },
    },
  },
};

export default config;
