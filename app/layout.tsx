import type { Metadata, Viewport } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevDesk AI — Understand your codebase',
  description: 'A secure AI workspace for repository analysis, debugging, and developer workflows.',
  icons: {
    icon: [{ url: '/favicon.png', type: 'image/png' }],
    shortcut: ['/favicon.png'],
    apple: [{ url: '/favicon.png', type: 'image/png' }],
  },
};

// Android Chrome otherwise uses a desktop-width layout viewport for this
// mobile-first workspace, which prevents the <=650px responsive rules from
// activating on devices such as the Galaxy A21s.
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
