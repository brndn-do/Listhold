import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import AuthWrapper from '@/components/AuthWrapper';
import { AuthProvider } from '@/context/AuthProvider';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Rosterize',
  description: 'Built with Next.js, Typescript, and Firebase',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <body>
        <AuthProvider>
          <header className='pt-5 pr-8'>
            <nav className='flex justify-end'>
              <div>
                <AuthWrapper />
              </div>
            </nav>
          </header>
          <main>{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
