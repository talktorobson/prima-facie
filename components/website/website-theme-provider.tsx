import type { WebsiteTheme } from './types'

interface WebsiteThemeProviderProps {
  theme: WebsiteTheme
  children: React.ReactNode
}

export const GRADIENT_PRESETS: Record<string, string> = {
  'ocean': 'linear-gradient(135deg, #0c4a6e, #0369a1, #0ea5e9)',
  'sunset': 'linear-gradient(135deg, #7c2d12, #c2410c, #f97316)',
  'forest': 'linear-gradient(135deg, #14532d, #15803d, #22c55e)',
  'royal': 'linear-gradient(135deg, #312e81, #4338ca, #6366f1)',
  'rose': 'linear-gradient(135deg, #881337, #be123c, #f43f5e)',
  'slate': 'linear-gradient(135deg, #1e293b, #334155, #64748b)',
}

const SECTION_PY: Record<string, string> = {
  compact: '64px',
  normal: '96px',
  spacious: '128px',
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

  const sectionPy = SECTION_PY[t.sectionSpacing || 'normal'] || SECTION_PY.normal
  const grainOpacity = t.enableGrainTexture ? '0.03' : '0'
  const gradient = (t.gradientPreset && GRADIENT_PRESETS[t.gradientPreset]) || GRADIENT_PRESETS.royal

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
    '--ws-font-serif': t.fontSerif || 'Cormorant Garamond, serif',
    '--ws-font-sans': t.fontSans || 'Inter, sans-serif',
    '--ws-font-display': t.fontDisplay || 'Outfit, sans-serif',
    '--ws-section-py': sectionPy,
    '--ws-anim-duration': '0.6s',
    '--ws-grain-opacity': grainOpacity,
    '--ws-gradient': gradient,
  } as React.CSSProperties

  return (
    <div style={style} className="min-h-screen bg-website-bg text-website-ink">
      {children}
    </div>
  )
}
