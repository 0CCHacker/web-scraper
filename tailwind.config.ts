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
        bone: "var(--bone)",
        "bone-deep": "var(--bone-deep)",
        ink: "var(--ink)",
        "ink-soft": "var(--ink-soft)",
        "ink-quiet": "var(--ink-quiet)",
        rule: "var(--rule)",
        "rule-soft": "var(--rule-soft)",
        saffron: "var(--saffron)",
        "saffron-deep": "var(--saffron-deep)",
        crimson: "var(--crimson)",
      },
      fontFamily: {
        display: ["var(--font-fraunces)", "Georgia", "serif"],
        serif: ["var(--font-newsreader)", "Georgia", "serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      letterSpacing: {
        "press": "0.22em",
      },
    },
  },
  plugins: [],
};
export default config;
