import React from 'react';
import type { Metadata, Viewport } from 'next';
import '../styles/tailwind.css';
import { Toaster } from 'sonner';
import DemoAppProvider from '@/components/DemoAppProvider';
import DemoSessionProvider from '@/components/DemoSessionProvider';
import DemoWorkspaceProvider from '@/components/DemoWorkspaceProvider';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export const metadata: Metadata = {
  title: 'DormFlow — Dormitory Management Made Simple',
  description: 'DormFlow helps dormitory operators manage rooms, tenants, invoices, payments, and maintenance from a single role-specific dashboard.',
  icons: {
    icon: [{ url: '/dormflow-mark.svg', type: 'image/svg+xml' }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <DemoAppProvider>
          <DemoSessionProvider>
            <DemoWorkspaceProvider>
              {children}
              <Toaster position="bottom-right" richColors closeButton />
            </DemoWorkspaceProvider>
          </DemoSessionProvider>
        </DemoAppProvider>
      </body>
    </html>
  );
}
