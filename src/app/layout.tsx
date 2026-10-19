// src/app/layout.tsx
import type { Metadata } from 'next';
import './globals.css';
import QueryProvider from '@/components/providers/query-provider';
import { ToastProvider } from '@/lib/context/toast-context';
import { AuthProvider } from '@/lib/context/auth-context';

export const metadata: Metadata = {
  title: 'Refrigerator Pictures — Super Admin Panel',
  description: 'Enterprise administration, moderation, analytics, and messaging for Refrigerator Pictures.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="icon" href="/icon.svg" type="image/svg+xml" />
      </head>
      <body
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-[#FAF7F5] text-[#231817] antialiased"
      >
        <QueryProvider>
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
