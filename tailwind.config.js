/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
            colors: {
                brand: {
                    bg: '#020617',
                    card: '#0F172A',
                    border: '#1E293B',
                    cyan: '#22D3EE',
                    blue: '#3B82F6',
                    text: '#F8FAFC',
                    muted: '#94A3B8',
                }
            },
            boxShadow: {
                'cyan': '0 4px 20px rgba(34, 211, 238, 0.1)',
                'cyan-lg': '0 8px 30px rgba(34, 211, 238, 0.15)',
                'cyan-xl': '0 12px 40px rgba(34, 211, 238, 0.2)',
            },
            animation: {
                'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
            }
        },
    },
    plugins: [],
}
