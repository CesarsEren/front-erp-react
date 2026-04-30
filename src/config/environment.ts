// DEBUG: Ver qué variables está cargando Vite
console.log('VITE MODE:', import.meta.env.MODE)
console.log('VITE_THEME_ACCENT:', import.meta.env.VITE_THEME_ACCENT)

export const environment = {
  production: import.meta.env.VITE_PRODUCTION === 'true',
  apiUrl: import.meta.env.VITE_API_URL,
  companyName: import.meta.env.VITE_COMPANY_NAME,
  logo: import.meta.env.VITE_LOGO_PATH,
  theme: {
    primary: import.meta.env.VITE_THEME_PRIMARY || '#1a1f3a',
    accent: import.meta.env.VITE_THEME_ACCENT || '#54b581',
    background: import.meta.env.VITE_THEME_BACKGROUND || '#ebf6f0',
    primaryForeground: import.meta.env.VITE_THEME_PRIMARY_FOREGROUND || '#ffffff',
    accentForeground: import.meta.env.VITE_THEME_ACCENT_FOREGROUND || '#000000',
  },
}
