import type { Metadata } from 'next';
import { Black_Han_Sans, Bowlby_One } from 'next/font/google';
import './globals.css';
import { EvalProvider } from '@/store/eval-context';

const blackHanSans = Black_Han_Sans({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
});

const bowlbyOne = Bowlby_One({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-numeric',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'SKKU 프롬프트 평가 대시보드',
  description: '성균관대 영상학과 프롬프트 중간고사 라이브 평가 대시보드',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ko"
      className={`${blackHanSans.variable} ${bowlbyOne.variable} h-full antialiased`}
    >
      <head>
        <link rel="preconnect" href="https://cdn.jsdelivr.net" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <EvalProvider>{children}</EvalProvider>
      </body>
    </html>
  );
}
