import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import Auth from '@/components/auth/Auth';
import Link from 'next/link';
import Button from '@/components/ui/Button';
import ProfileCompletionObserver from '@/components/auth/ProfileCompletionObserver';
import { Analytics } from '@vercel/analytics/next';

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
      {/* body should always take the entire viewport height */}
      <body className='m-0 flex min-h-[100dvh] flex-col'>
        {/* Application State */}
        <AuthProvider>
          <ProfileCompletionObserver />
          <header className='pt-4 pr-4 lg:pr-12'>
            <nav className='flex items-center justify-end gap-4 lg:gap-6'>
              <Link href={'/events/new'}>
                <Button
                  content={
                    <div className='flex items-center gap-2'>
                      <svg
                        className='h-4 w-4'
                        fill='none'
                        stroke='currentColor'
                        viewBox='0 0 24 24'
                      >
                        <path
                          strokeLinecap='round'
                          strokeLinejoin='round'
                          strokeWidth={2.5}
                          d='M12 4v16m8-8H4'
                        />
                      </svg>
                      Create
                    </div>
                  }
                />
              </Link>
              <Auth />
            </nav>
          </header>
          <main className='flex flex-1 flex-col items-center px-4 pt-12 lg:pt-18'>{children}</main>
          <footer className='flex flex-col p-2 text-xs'>
            <p className='mt-8 ml-4 opacity-70'>&copy; 2026 Listhold</p>
          </footer>
        </AuthProvider>

        {/* Analytics */}
        <Analytics />
      </body>
    </html>
  );
};

export default RootLayout;
