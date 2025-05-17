// frontend/tailwind.config.cjs
module.exports = {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}'
  ],
  theme: {
    extend: {
      colors: {
        primary: '#2563eb',    // Bleu principal
        secondary: '#f59e0b',  // Orange secondaire
        light: '#f9fafb',      // Couleur de fond clair
        dark: '#1f2937',       // Couleur sombre
        textMain: '#111827',   // Texte principal
        textSub: '#6b7280'     // Texte secondaire
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
