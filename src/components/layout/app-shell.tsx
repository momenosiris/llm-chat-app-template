'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { ReactNode } from 'react';

const navItems = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/leads', label: 'Leads' },
  { href: '/templates', label: 'Templates' },
  { href: '/send', label: 'Send' },
  { href: '/activity', label: 'Activity' }
];

const adminItems = [
  { href: '/admin/users', label: 'Users' },
  { href: '/admin/clients', label: 'Clients' },
  { href: '/admin/usage', label: 'Usage' },
  { href: '/admin/system', label: 'System' }
];

export function AppShell({ children, isAdmin }: { children: ReactNode; isAdmin?: boolean }) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-6">
            <Link href="/dashboard" className="font-semibold">
              Lead Automation
            </Link>
            <nav className="flex items-center gap-4 text-sm font-medium text-muted-foreground">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={pathname.startsWith(item.href) ? 'text-primary' : ''}
                >
                  {item.label}
                </Link>
              ))}
              {isAdmin &&
                adminItems.map((item) => (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={pathname.startsWith(item.href) ? 'text-primary' : ''}
                  >
                    {item.label}
                  </Link>
                ))}
            </nav>
          </div>
          <button
            type="button"
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="text-sm text-muted-foreground hover:text-primary"
          >
            Sign out
          </button>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-6 py-8">{children}</main>
    </div>
  );
}
