import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  container: {
    center: true,
    padding: "2rem",
    screens: {
      "2xl": "1400px",
    },
  },
  theme: {
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        brand: {
          amber: "#d87943", // Darkmatter light primary (deep orange)
          amberInk: "#e59a6a", // readable deep-orange text on dark tints
          blue: "#5f8787", // Darkmatter chart-1 (teal)
          blueInk: "#8fb3b3", // readable teal text on dark tints
          purple: "#fbcb97", // Darkmatter chart-3 (peach)
          purpleInk: "#fbcb97",
          green: "#e78a53", // Darkmatter primary
          greenInk: "#e78a53", // readable primary text on cards
          red: "#ef4444", // Darkmatter destructive
          redInk: "#f08c8c", // readable red text on dark tints
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      fontFamily: {
        // Darkmatter theme font: Geist Mono, bundled via @fontsource/geist-mono.
        sans: ["Geist Mono", ...defaultTheme.fontFamily.mono],
      },
    },
  },
  plugins: [tailwindcssAnimate],
};

export default config;
