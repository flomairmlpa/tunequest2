import type { Config } from "tailwindcss";
import plugin from "tailwindcss/plugin";

const config: Config = {
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        ink: "#0c0717",
        night: "#160e2a",
        neon: {
          pink: "#ff4fa3",
          violet: "#8b5cf6",
          cyan: "#3ee6ff",
          amber: "#ffc94d",
        },
      },
      fontFamily: {
        sans: ["var(--font-sans)", "system-ui", "sans-serif"],
        display: ["var(--font-display)", "system-ui", "sans-serif"],
      },
      keyframes: {
        blob: {
          "0%, 100%": { transform: "translate(0, 0) scale(1)" },
          "33%": { transform: "translate(40px, -60px) scale(1.15)" },
          "66%": { transform: "translate(-30px, 30px) scale(0.9)" },
        },
        "fade-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "none" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "slide-in": {
          from: { transform: "translateX(100%)" },
          to: { transform: "none" },
        },
        scan: {
          "0%, 100%": { top: "8%" },
          "50%": { top: "92%" },
        },
        pop: {
          "0%": { opacity: "0", transform: "scale(0.4)" },
          "70%": { opacity: "1", transform: "scale(1.08)" },
          "100%": { opacity: "1", transform: "scale(1)" },
        },
        "cover-in": {
          from: { opacity: "0", transform: "scale(1.15)" },
          to: { opacity: "1", transform: "scale(1)" },
        },
        eq: {
          "0%, 100%": { transform: "scaleY(0.25)" },
          "50%": { transform: "scaleY(1)" },
        },
        "ping-slow": {
          "75%, 100%": { transform: "scale(1.5)", opacity: "0" },
        },
      },
      animation: {
        blob: "blob 20s ease-in-out infinite",
        "fade-up": "fade-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "fade-in": "fade-in 0.3s ease-out both",
        "slide-in": "slide-in 0.35s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        scan: "scan 2.4s ease-in-out infinite",
        pop: "pop 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        "cover-in": "cover-in 1s cubic-bezier(0.2, 0.8, 0.2, 1) both",
        eq: "eq 0.9s ease-in-out infinite",
        "ping-slow": "ping-slow 2s cubic-bezier(0, 0, 0.2, 1) infinite",
        "spin-slow": "spin 2.4s linear infinite",
      },
    },
  },
  plugins: [
    require('@tailwindcss/typography'),
    plugin(function ({addVariant}) {
      addVariant('progress-unfilled', ['&::-webkit-progress-bar', '&']);
      addVariant('progress-filled', ['&::-webkit-progress-value', '&::-moz-progress-bar']);
    })
  ],
};
export default config;
