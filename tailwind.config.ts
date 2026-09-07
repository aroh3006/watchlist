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
        // Every token below reads from a CSS custom property defined in
        // globals.css, one set under :root (light) and one under .dark, so
        // toggling the dark class swaps the whole palette without touching
        // any of the utility classes that use these names. The rgb(... /
        // <alpha-value>) form keeps opacity modifiers like bg-brand-900/30
        // working the same way they did with plain hex values.
        bg: {
          DEFAULT: "rgb(var(--color-bg) / <alpha-value>)",
          raised: "rgb(var(--color-bg-raised) / <alpha-value>)",
          overlay: "rgb(var(--color-bg-overlay) / <alpha-value>)",
        },
        border: {
          DEFAULT: "rgb(var(--color-border) / <alpha-value>)",
          subtle: "rgb(var(--color-border-subtle) / <alpha-value>)",
        },
        ink: {
          DEFAULT: "rgb(var(--color-ink) / <alpha-value>)",
          muted: "rgb(var(--color-ink-muted) / <alpha-value>)",
          faint: "rgb(var(--color-ink-faint) / <alpha-value>)",
        },
        brand: {
          50: "rgb(var(--color-brand-50) / <alpha-value>)",
          100: "rgb(var(--color-brand-100) / <alpha-value>)",
          200: "rgb(var(--color-brand-200) / <alpha-value>)",
          300: "rgb(var(--color-brand-300) / <alpha-value>)",
          400: "rgb(var(--color-brand-400) / <alpha-value>)",
          500: "rgb(var(--color-brand-500) / <alpha-value>)",
          600: "rgb(var(--color-brand-600) / <alpha-value>)",
          700: "rgb(var(--color-brand-700) / <alpha-value>)",
          800: "rgb(var(--color-brand-800) / <alpha-value>)",
          900: "rgb(var(--color-brand-900) / <alpha-value>)",
        },
        accent: {
          DEFAULT: "rgb(var(--color-accent) / <alpha-value>)",
          muted: "rgb(var(--color-accent-muted) / <alpha-value>)",
        },
        danger: {
          DEFAULT: "rgb(var(--color-danger) / <alpha-value>)",
          muted: "rgb(var(--color-danger-muted) / <alpha-value>)",
        },
        activity: {
          0: "rgb(var(--color-activity-0) / <alpha-value>)",
          1: "rgb(var(--color-activity-1) / <alpha-value>)",
          2: "rgb(var(--color-activity-2) / <alpha-value>)",
          3: "rgb(var(--color-activity-3) / <alpha-value>)",
          4: "rgb(var(--color-activity-4) / <alpha-value>)",
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
