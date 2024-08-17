/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'media',
  content: [
    './index.html',
    './src/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Shared colors
        primary: {
          light: '#1F2937', // Dark gray for primary text in light mode
          dark: '#D1D5DB', // Light gray for primary text in dark mode
        },
        secondary: {
          light: '#4B5563', // Lighter gray for secondary text in light mode
          dark: '#9CA3AF', // Darker gray for secondary text in dark mode
        },
        background: {
          light: '#F3F4F6', // Soft gray background in light mode
          dark: '#1A1A2E', // Deep blue-gray background in dark mode
        },
        card: {
          light: '#FFFFFF', // White card backgrounds in light mode
          dark: '#2D2D44', // Darker gray for card backgrounds in dark mode
        },
        border: {
          light: '#D1D5DB', // Light gray borders in light mode
          dark: '#4B5563', // Darker gray borders in dark mode
        },
        accent: {
          light: '#2563EB', // Blue accent for buttons/links in light mode
          dark: '#3B82F6', // Slightly lighter blue accent for dark mode
        },
        positive: {
          light: '#10B981', // Green for positive trends in light mode
          dark: '#34D399', // Lighter green for positive trends in dark mode
        },
        negative: {
          light: '#EF4444', // Red for negative trends in light mode
          dark: '#F87171', // Slightly lighter red for negative trends in dark mode
        },
      },
    },
  },
  plugins: [],
};

