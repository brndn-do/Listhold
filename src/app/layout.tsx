import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import Auth from '@/components/auth/Auth';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Listhold',
  description: 'Automate your event lists.',
};

const RootLayout = ({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) => {
  return (
    <html lang='en' className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
      <AuthProvider>
        {/* body should always take the entire viewport height */}
        <body className='min-h-[100dvh] m-0 flex flex-col'>
          <header className='pt-4 pr-4'>
            <nav className='flex justify-end'>
              <Auth />
            </nav>
          </header>
          <main className='flex-1 flex flex-col items-center pt-6 px-4'>{children}</main>
          <footer className='p-2 flex flex-col text-xs'>
            <p className='opacity-70 ml-4'>&copy; 2026 Listhold</p>
          </footer>
        </body>
      </AuthProvider>
    </html>
  );
};

export default RootLayout;
