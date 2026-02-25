import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#FF7A00",
          50: "#FFF3E6",
          100: "#FFE0B3",
          200: "#FFCC80",
          300: "#FFB84D",
          400: "#FFA41A",
          500: "#FF7A00",
          600: "#E06C00",
          700: "#B35600",
          800: "#804000",
          900: "#4D2600",
        },
        shell: "#0A0A0A",
      },
      borderRadius: {
        card: "0.75rem",
      },
      boxShadow: {
        card: "0 1px 3px 0 rgb(0 0 0 / 0.04), 0 1px 2px -1px rgb(0 0 0 / 0.04)",
      },
      fontSize: {
        "page-title": ["1.5rem", { lineHeight: "2rem", fontWeight: "700" }],
        "page-subtitle": ["0.875rem", { lineHeight: "1.25rem", fontWeight: "400" }],
      },
    },
  },
  plugins: [],
};

export default config;
