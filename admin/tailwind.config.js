/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        farm: {
          green: {
            50: "#eef8f1",
            100: "#d6efdd",
            200: "#aedfbc",
            300: "#7cc997",
            400: "#4bad74",
            500: "#2e9358",
            600: "#1f7a46",
            700: "#1c6b3d", // primary brand green (matches logo)
            800: "#175534",
            900: "#14452c",
          },
          charcoal: {
            DEFAULT: "#2b3038",
            deep: "#20242b",
            light: "#3a4049",
          },
          cream: "#f7f8f5",
          mist: "#eef1ed",
        },
      },
      fontFamily: {
        display: ["'Sora'", "system-ui", "sans-serif"],
        body: ["'Inter'", "system-ui", "sans-serif"],
      },
      boxShadow: {
        card: "0 1px 2px rgba(20, 30, 25, 0.04), 0 4px 16px rgba(20, 30, 25, 0.06)",
        "card-hover": "0 2px 4px rgba(20, 30, 25, 0.06), 0 12px 28px rgba(20, 30, 25, 0.10)",
      },
      borderRadius: {
        xl2: "1.1rem",
      },
      keyframes: {
        "fade-in": {
          "0%": { opacity: 0, transform: "translateY(4px)" },
          "100%": { opacity: 1, transform: "translateY(0)" },
        },
        "slide-in": {
          "0%": { transform: "translateX(-100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.35s ease-out",
        "slide-in": "slide-in 0.25s ease-out",
      },
    },
  },
  plugins: [],
};
