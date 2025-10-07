import type { Config } from 'tailwindcss'

export default {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Paleta de colores basada en el logo de CSG
        'csg-red': '#E4502E',
        'csg-orange': '#EB8424',
        'csg-green-dark': '#37682C',
        'csg-green-light': '#6E9447',

        // Colores de la UI adaptados a la nueva paleta
        'primary-bg': '#F9F9F9', // Fondo principal claro
        'secondary-bg': '#EFEFEF', // Fondo de tarjetas/contenedores
        'text-dark': '#1F2937',    // Texto principal oscuro
        'text-muted': '#6B7280',   // Texto secundario gris
        'accent-red': '#E4502E',   // Color de acento para botones, etc.
        'accent-orange': '#EB8424',// Color de acento secundario
      },
      boxShadow: {
        'light': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
      },
      fontFamily: {
        sans: ['Inter', 'sans-serif'],
      },
    },
  },
  plugins: [],
} as Config