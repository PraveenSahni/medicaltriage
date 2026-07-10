# IST Skills Console - Design System & CSS Guide

This document contains the core CSS variables and Tailwind configuration needed to replicate the design system of the AI Skills Console across other applications.

## 1. Core Color Palette & Typography

The application uses Tailwind CSS. To replicate the exact look and feel, you need to configure your `tailwind.config.js` (or equivalent theme settings) with these specific colors and fonts:

### Tailwind Theme Configuration

\`\`\`javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'ist-blue': '#101B2E',
        'ist-gold': '#E6B431',
        'ist-cream': '#F9F9F7',
        'ist-dark': '#0f172a',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['"Playfair Display"', 'Georgia', 'serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
        display: ['"Space Grotesk"', 'sans-serif'],
      },
    },
  },
}
\`\`\`

## 2. Global CSS Variables and Resets

Add these to your global stylesheet (e.g., `index.css` or `global.css`) to handle the background gradients, custom scrollbars, and specific component resets used in the console.

\`\`\`css
/* Import required fonts */
@import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400;1,600;1,700&family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap');

/* Apply Tailwind directives */
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply font-sans antialiased text-ist-dark;
    background: radial-gradient(1200px 600px at 80% -10%, #F2EEE2 0%, transparent 60%), #F9F9F7;
    /* Optional dark mode background fallback if needed:
    @apply dark:bg-ist-dark dark:text-gray-100;
    */
  }
  
  h1, h2, h3, h4, h5, h6 {
    @apply font-display tracking-tight;
  }
}

@layer utilities {
  /* Animation used for the Welcome Screen and page transitions */
  .animate-fade-in-up {
    animation: fadeInUp 0.5s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  }
  .animate-fade-in {
    animation: fadeIn 0.4s ease-out both;
  }
  .animate-fade-in-left {
    animation: fadeInLeft 0.4s cubic-bezier(0.2, 0.7, 0.3, 1) both;
  }
}

/* Keyframes for the custom animations */
@keyframes fadeInUp {
  from {
    opacity: 0;
    transform: translateY(14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

@keyframes fadeInLeft {
  from {
    opacity: 0;
    transform: translateX(-14px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}

/* Custom Webkit Scrollbar Styling to match the console */
::-webkit-scrollbar {
  width: 10px;
  height: 10px;
}

::-webkit-scrollbar-thumb {
  background-color: #cbd5e1; /* Tailwind gray-300 */
  border-radius: 5px;
  border: 2px solid #F9F9F7; /* Matches ist-cream background */
}

::-webkit-scrollbar-thumb:hover {
  background-color: #94a3b8; /* Tailwind gray-400 */
}

::-webkit-scrollbar-track {
  background: #F9F9F7;
}

/* Hide default details/summary marker for custom accordions */
.custom-summary::-webkit-details-marker {
  display: none;
}
.custom-summary {
  list-style: none;
}
\`\`\`

## 3. Key Component Classes (Tailwind)

While the raw CSS is minimal due to Tailwind, here are the core class combinations used to achieve the specific looks in the console:

### Buttons & Tags
*   **Eyebrow Tags (e.g., "UAE AVAILABILITY")**: `text-[10px] font-bold uppercase tracking-widest text-gray-400`
*   **Primary Button (Blue)**: `px-6 py-2 bg-ist-blue text-white text-sm font-bold rounded-full hover:bg-ist-gold transition-colors`
*   **Active Nav Pill**: `px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-ist-blue text-white`
*   **Inactive Nav Pill**: `px-4 py-2 text-xs font-bold uppercase tracking-wider rounded-lg bg-gray-100 text-gray-600 hover:bg-gray-200`

### Cards & Layouts
*   **Interactive Card (Skills grid)**: `bg-white border border-gray-200 rounded-2xl p-5 text-left hover:shadow-md hover:border-ist-gold hover:-translate-y-1 transition-all`
*   **Rail/Sidebar Container**: `bg-white/50 p-4 rounded-xl border border-gray-200/60 shadow-sm`
*   **Section Headers (Drawer)**: `flex items-center gap-2 text-xs font-bold tracking-widest uppercase text-gray-400 mb-4 after:content-[''] after:flex-1 after:h-px after:bg-gray-100`

### Typography
*   **Main Headings (H1/H2)**: `text-3xl font-extrabold text-ist-blue leading-tight font-display`
*   **Numbers / Stats**: `text-3xl font-extrabold text-ist-blue font-display`
*   **Body Text**: `text-sm text-gray-500 leading-relaxed font-sans`
