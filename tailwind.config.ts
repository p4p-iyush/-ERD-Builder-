import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        brand: {
          50:  "#f0f4ff",
          100: "#e0e9ff",
          200: "#c7d7fe",
          300: "#a5b8fc",
          400: "#8193f8",
          500: "#6270f1",
          600: "#4f56e5",
          700: "#4145ca",
          800: "#353aa3",
          900: "#303681",
          950: "#1e2050",
        },
        dark: {
          50:  "#f8f8f8",
          100: "#e8e8e8",
          200: "#d0d0d0",
          300: "#a8a8a8",
          400: "#737373",
          500: "#525252",
          600: "#404040",
          700: "#2e2e2e",
          800: "#1f1f1f",
          900: "#141414",
          950: "#0a0a0a",
        },
      },
      fontFamily: {
        sans: ["Inter", "system-ui", "sans-serif"],
        mono: ["JetBrains Mono", "Fira Code", "monospace"],
      },
      animation: {
        "fade-in":    "fadeIn 0.2s ease-in-out",
        "slide-up":   "slideUp 0.25s ease-out",
        "slide-down": "slideDown 0.25s ease-out",
        "pulse-slow": "pulse 3s cubic-bezier(0.4,0,0.6,1) infinite",
        "spin-slow":  "spin 3s linear infinite",
        "shrink":     "shrink linear forwards",
        "shimmer":    "shimmer 1.5s linear infinite",
      },
      keyframes: {
        fadeIn: {
          "0%":   { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%":   { transform: "translateY(12px)", opacity: "0" },
          "100%": { transform: "translateY(0)",    opacity: "1" },
        },
        slideDown: {
          "0%":   { transform: "translateY(-12px)", opacity: "0" },
          "100%": { transform: "translateY(0)",     opacity: "1" },
        },
        shrink: {
          "0%":   { width: "100%" },
          "100%": { width: "0%"   },
        },
        shimmer: {
          "0%":   { backgroundPosition: "-200% center" },
          "100%": { backgroundPosition:  "200% center" },
        },
      },
      boxShadow: {
        "glow":     "0 0 20px rgba(98,112,241,0.3)",
        "glow-sm":  "0 0 10px rgba(98,112,241,0.2)",
        "dark-lg":  "0 10px 40px rgba(0,0,0,0.5)",
        "dark-sm":  "0 2px 8px rgba(0,0,0,0.4)",
      },
      backgroundSize: {
        "200": "200% auto",
      },
    },
  },
  plugins: [],
};

export default config;