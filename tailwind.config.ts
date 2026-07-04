import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#0a0a0f",
        surface: "#13131a",
        surface2: "#1c1c26",
        border: "#2a2a36",
        accent: "#7c3aed",
        accentHover: "#6d28d9",
        text: "#f5f5f7",
        muted: "#8b8b96",
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "PingFang SC", "Helvetica Neue", "sans-serif"],
      },
    },
  },
  plugins: [],
};
export default config;