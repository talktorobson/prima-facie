import WebsiteThemeProvider from './website-theme-provider'
import WebsiteTopbarSection from './website-topbar'
import WebsiteHeaderSection from './website-header'
import WebsiteFooterSection from './website-footer'
import type { WebsiteContent } from './types'

interface Props {
  content: WebsiteContent
  slug: string
  children: React.ReactNode
  headerVariant?: 'transparent' | 'solid'
}

export default function WebsitePageShell({ content, slug, children, headerVariant = 'solid' }: Props) {
  return (
    <WebsiteThemeProvider theme={content.theme}>
      <WebsiteTopbarSection data={content.topbar} />
      <WebsiteHeaderSection data={content.header} slug={slug} variant={headerVariant} />
      {children}
      <WebsiteFooterSection data={content.footer} slug={slug} />
    </WebsiteThemeProvider>
  )
}
