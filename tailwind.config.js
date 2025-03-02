/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontFamily: {
        inter: ["Inter", "sans-serif"],
      },
      colors: {
        smokeWhite: "#F0F0F0",
        primary: "#4399FF",
        lavenderBlue: "#DCE8FF",
        gray: "#959590",
        lightGray: "#CDCDCD",
        slate:"#D9D9D9",
        lightSlate: "#BABABA",
      },
    },
  },
  plugins: [],
};
