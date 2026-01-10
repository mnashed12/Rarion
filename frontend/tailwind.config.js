/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      // Custom colors for Pokemon theme
      colors: {
        pokemon: {
          red: '#ff1c1c',
          blue: '#1c5cff',
          yellow: '#ffcc00',
          green: '#4caf50',
          purple: '#9c27b0',
        },
        // Rarity colors
        rarity: {
          common: '#9e9e9e',
          uncommon: '#4caf50',
          rare: '#2196f3',
          holo: '#9c27b0',
          ultra: '#ff9800',
          secret: '#e91e63',
        },
        // Condition colors
        condition: {
          mint: '#4caf50',
          'near-mint': '#8bc34a',
          'lightly-played': '#cddc39',
          'moderately-played': '#ffeb3b',
          'heavily-played': '#ff9800',
          damaged: '#f44336',
        },
      },
      // Custom font family
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      // Animation extensions
      animation: {
        'spin-slow': 'spin 3s linear infinite',
        'bounce-slow': 'bounce 2s infinite',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
      // Spacing extensions
      spacing: {
        '18': '4.5rem',
        '88': '22rem',
        '128': '32rem',
      },
      // Border radius extensions
      borderRadius: {
        '4xl': '2rem',
      },
      // Box shadow extensions
      boxShadow: {
        'card': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card-hover': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'inner-lg': 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.1)',
      },
      // Z-index extensions
      zIndex: {
        '60': '60',
        '70': '70',
        '80': '80',
        '90': '90',
        '100': '100',
      },
    },
  },
  plugins: [
    // Add plugins here as needed
    // require('@tailwindcss/forms'),
    // require('@tailwindcss/typography'),
  ],
}
