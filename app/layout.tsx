import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'DevDesk AI — Understand your codebase',
  description: 'A secure AI workspace for repository analysis, debugging, and developer workflows.',
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
