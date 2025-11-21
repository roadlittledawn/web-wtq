import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        // Dark theme colors inspired by GitHub/Shopify
        dark: {
          bg: "#0d1117",
          "bg-secondary": "#161b22",
          "bg-tertiary": "#21262d",
          border: "#30363d",
          text: "#e6edf3",
          "text-secondary": "#8b949e",
          "text-muted": "#6e7681",
        },
        // Fun accent colors
        accent: {
          pink: "#ff006e",
          "pink-light": "#ff4d9f",
          teal: "#06ffa5",
          "teal-dark": "#00d98a",
          purple: "#8b5cf6",
          blue: "#3b82f6",
        },
      },
    },
  },
  plugins: [],
};
export default config;
