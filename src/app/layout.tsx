import type { Metadata } from 'next';
import { SessionProvider } from '@/components/providers/session-provider';
import './globals.css';

export const metadata: Metadata = {
  title: 'Lead Automation Platform',
  description: 'Manage leads, templates, and send automations.'
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <SessionProvider>{children}</SessionProvider>
      </body>
    </html>
  );
}
