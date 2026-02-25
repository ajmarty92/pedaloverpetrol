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
      },
    },
  },
  plugins: [],
};

export default config;
