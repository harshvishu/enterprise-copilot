/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,jsx}"
    ],

    theme: {
        extend: {
            colors: {
                ink: "#0b0f19",
                panel: "#131a2a",
                panel2: "#1b2436",
                edge: "#26314a",
                accent: "#4f8cff",
                ok: "#38d39f",
                warn: "#f2b544",
                danger: "#ff5c72"
            }
        }
    },

    plugins: []
};