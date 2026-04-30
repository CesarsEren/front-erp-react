import { useEffect } from 'react'
import { environment } from '@/config/environment'

// Función para convertir hex a HSL
function hexToHSL(hex: string): { h: number; s: number; l: number } {
  // Remover el # si existe
  hex = hex.replace(/^#/, '')

  // Parsear los valores RGB
  const r = parseInt(hex.substring(0, 2), 16) / 255
  const g = parseInt(hex.substring(2, 4), 16) / 255
  const b = parseInt(hex.substring(4, 6), 16) / 255

  const max = Math.max(r, g, b)
  const min = Math.min(r, g, b)
  let h = 0
  let s = 0
  const l = (max + min) / 2

  if (max !== min) {
    const d = max - min
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min)

    switch (max) {
      case r:
        h = ((g - b) / d + (g < b ? 6 : 0)) / 6
        break
      case g:
        h = ((b - r) / d + 2) / 6
        break
      case b:
        h = ((r - g) / d + 4) / 6
        break
    }
  }

  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  }
}

// Función para formatear HSL como string para CSS
function formatHSL(hsl: { h: number; s: number; l: number }): string {
  return `${hsl.h} ${hsl.s}% ${hsl.l}%`
}

export function useTheme() {
  useEffect(() => {
    const root = document.documentElement
    const { theme } = environment

    // Convertir colores hex a HSL
    const primaryHSL = hexToHSL(theme.primary)
    const accentHSL = hexToHSL(theme.accent)
    const backgroundHSL = hexToHSL(theme.background)
    const primaryFgHSL = hexToHSL(theme.primaryForeground)
    const accentFgHSL = hexToHSL(theme.accentForeground)

    // Aplicar variables CSS
    root.style.setProperty('--primary', formatHSL(primaryHSL))
    root.style.setProperty('--primary-foreground', formatHSL(primaryFgHSL))
    root.style.setProperty('--accent', formatHSL(accentHSL))
    root.style.setProperty('--accent-foreground', formatHSL(accentFgHSL))
    root.style.setProperty('--secondary', formatHSL(accentHSL))
    root.style.setProperty('--secondary-foreground', formatHSL(accentFgHSL))
    root.style.setProperty('--ring', formatHSL(primaryHSL))
    
    // Background con tinte del tema
    root.style.setProperty('--background', formatHSL(backgroundHSL))
    
    // Sidebar con color primario
    root.style.setProperty('--sidebar-background', formatHSL(primaryHSL))
    root.style.setProperty('--sidebar-foreground', formatHSL(primaryFgHSL))
    root.style.setProperty('--sidebar-accent', formatHSL(accentHSL))
    root.style.setProperty('--sidebar-accent-foreground', formatHSL(accentFgHSL))

  }, [])
}

export function applyTheme() {
  const root = document.documentElement
  const { theme } = environment

  const primaryHSL = hexToHSL(theme.primary)
  const accentHSL = hexToHSL(theme.accent)
  const backgroundHSL = hexToHSL(theme.background)
  const primaryFgHSL = hexToHSL(theme.primaryForeground)
  const accentFgHSL = hexToHSL(theme.accentForeground)

  root.style.setProperty('--primary', formatHSL(primaryHSL))
  root.style.setProperty('--primary-foreground', formatHSL(primaryFgHSL))
  root.style.setProperty('--accent', formatHSL(accentHSL))
  root.style.setProperty('--accent-foreground', formatHSL(accentFgHSL))
  root.style.setProperty('--secondary', formatHSL(accentHSL))
  root.style.setProperty('--secondary-foreground', formatHSL(accentFgHSL))
  root.style.setProperty('--ring', formatHSL(primaryHSL))
  root.style.setProperty('--background', formatHSL(backgroundHSL))
  root.style.setProperty('--sidebar-background', formatHSL(primaryHSL))
  root.style.setProperty('--sidebar-foreground', formatHSL(primaryFgHSL))
  root.style.setProperty('--sidebar-accent', formatHSL(accentHSL))
  root.style.setProperty('--sidebar-accent-foreground', formatHSL(accentFgHSL))
}
