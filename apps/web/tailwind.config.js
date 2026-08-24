/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          DEFAULT: "#1e90ff",
          dark: "#1670cc",
        },
      },
    },
  },
  plugins: [],
};
