/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./frontend/index.html", "./frontend/src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        "ist-blue": "#213A61",
        "ist-gold": "#C5A064",
        "ist-cream": "#F8FAFC",
        "ist-text": "#071022",
        "ist-dark": "#020716",
        "ist-dark-surface": "#081022",
        clinical: {
          emerald: "#213A61",
          mint: "#C5A064",
          ink: "#071022",
          panel: "#F8FAFC"
        }
      },
      boxShadow: {
        "clinical-card": "0 18px 45px -32px rgba(7, 16, 34, 0.42)",
        "clinical-panel": "0 24px 70px -46px rgba(2, 7, 22, 0.66)"
      },
      fontFamily: {
        sans: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", "Arial", "sans-serif"],
        display: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", "Arial", "sans-serif"],
        mono: ["-apple-system", "BlinkMacSystemFont", "SF Pro Text", "SF Pro Display", "Helvetica Neue", "Segoe UI", "Arial", "sans-serif"]
      }
    }
  },
  plugins: []
};
