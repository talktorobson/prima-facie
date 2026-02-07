import type { WebsiteTheme } from './types'

interface WebsiteThemeProviderProps {
  theme: WebsiteTheme
  children: React.ReactNode
}

const defaults: WebsiteTheme = {
  color_bg: '#FAF8F5',
  color_ink: '#1A1A2E',
  color_accent: '#B8860B',
  color_accent_light: '#D4A843',
  color_mist: '#E8E4DF',
  color_stone: '#6B6B7B',
  color_charcoal: '#2D2D3F',
  font_serif: 'Georgia',
  font_sans: 'system-ui',
}

export default function WebsiteThemeProvider({ theme, children }: WebsiteThemeProviderProps) {
  const t = { ...defaults, ...theme }

  const style = {
    '--ws-bg': t.color_bg,
    '--ws-ink': t.color_ink,
    '--ws-accent': t.color_accent,
    '--ws-accent-light': t.color_accent_light,
    '--ws-mist': t.color_mist,
    '--ws-stone': t.color_stone,
    '--ws-charcoal': t.color_charcoal,
    '--font-serif': t.font_serif,
    '--font-sans': t.font_sans,
  } as React.CSSProperties

  return (
    <div style={style} className="min-h-screen bg-website-bg text-website-ink">
      {children}
    </div>
  )
}
