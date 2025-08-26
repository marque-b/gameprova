/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        ocean: {
          50: "#f0f9ff",
          100: "#e0f2fe",
          200: "#bae6fd",
          300: "#7dd3fc",
          400: "#38bdf8",
          500: "#0ea5e9",
          600: "#0284c7",
          700: "#0369a1",
          800: "#075985",
          900: "#0c4a6e",
          950: "#082f49",
        },
        nautical: {
          gold: "#d4af37",
          rope: "#deb887",
          wood: "#8b4513",
          sail: "#f5f5dc",
          anchor: "#2f4f4f",
          waves: "#4682b4",
          sunset: "#ff6b35",
          lighthouse: "#ff0000",
        },
      },
      fontFamily: {
        nautical: ["Pirata One", "serif"],
        maritime: ["Roboto Slab", "serif"],
      },
      backgroundImage: {
        "ocean-gradient":
          "linear-gradient(135deg, #0ea5e9 0%, #0369a1 50%, #082f49 100%)",
        "sunset-gradient":
          "linear-gradient(135deg, #ff6b35 0%, #f59e0b 50%, #d4af37 100%)",
        "wave-pattern":
          'url(\'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23ffffff" fill-opacity="0.1"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\')',
      },
      animation: {
        wave: "wave 3s ease-in-out infinite",
        float: "float 6s ease-in-out infinite",
        sail: "sail 4s ease-in-out infinite",
      },
      keyframes: {
        wave: {
          "0%, 100%": { transform: "translateY(0) rotate(0deg)" },
          "50%": { transform: "translateY(-10px) rotate(1deg)" },
        },
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        sail: {
          "0%, 100%": { transform: "rotate(-2deg)" },
          "50%": { transform: "rotate(2deg)" },
        },
      },
    },
  },
  plugins: [],
};
