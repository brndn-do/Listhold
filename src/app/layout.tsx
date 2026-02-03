import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '@/context/AuthProvider';
import Auth from '@/components/auth/Auth';
import Link from 'next/link';
import Button from '@/components/ui/Button';
// import ProfileCompletionObserver from '@/components/auth/ProfileCompletionObserver';

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
      <body className='min-h-[100dvh] m-0 flex flex-col'>
        <AuthProvider>
          {/* <ProfileCompletionObserver /> */}
          <header className='pt-4 pr-6 lg:pr-12'>
            <nav className='flex justify-end items-center gap-4'>
              <Link href={'/events/new'}>
                <Button
                  content={
                    <div className='flex items-center gap-2'>
                      <svg
                        className='w-4 h-4'
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
          <main className='flex-1 flex flex-col pt-12 lg:pt-18 px-4'>{children}</main>
          <footer className='p-2 flex flex-col text-xs'>
            <p className='opacity-70 mt-8 ml-4'>&copy; 2026 Listhold</p>
          </footer>
        </AuthProvider>
      </body>
    </html>
  );
};

export default RootLayout;
