import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./src/pages/**/*.{ts,tsx}",
    "./src/components/**/*.{ts,tsx}",
    "./src/app/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Warm paper/cream, editorial print feel, not a generic dark demo panel.
        bg: {
          DEFAULT: "#f3ede0",
          raised: "#faf7ee",
          overlay: "#ece4d1",
        },
        border: {
          DEFAULT: "#d9d0b8",
          subtle: "#e6dfc9",
        },
        ink: {
          DEFAULT: "#1c1a15",
          muted: "#6f6754",
          faint: "#a39a82",
        },
        // Single restrained accent: deep ink-blue, dark enough to read as text
        // on a cream page. Not the pale/neon blue that only works on dark UI.
        brand: {
          50: "#eaf1f7",
          100: "#cddfec",
          200: "#8fb2cf",
          300: "#3d6690",
          400: "#2f5273",
          500: "#284b68",
          600: "#1f3a52",
          700: "#182d40",
          800: "#12212f",
          900: "#0d1822",
        },
        // Warm rust/terracotta for destructive + favorite states.
        accent: {
          DEFAULT: "#a1442b",
          muted: "#7a3320",
        },
        // Cream-to-ink-blue ramp for the activity heatmap.
        activity: {
          0: "#e6ddc7",
          1: "#b9d0dd",
          2: "#87abc4",
          3: "#4d7c9e",
          4: "#1f3a52",
        },
      },
      fontFamily: {
        sans: ["Helvetica Neue", "Helvetica", "Arial", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        display: ["Helvetica Neue", "Helvetica", "Arial", "-apple-system", "BlinkMacSystemFont", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      boxShadow: {
        card: "0 8px 30px -12px rgba(0,0,0,0.5)",
      },
    },
  },
  plugins: [],
};

export default config;
