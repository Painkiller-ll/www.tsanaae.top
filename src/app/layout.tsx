import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import Footer from '@/components/Footer';
import FloatingBall from '@/components/FloatingBall';
import MusicPlayer from '@/components/MusicPlayer';
import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'Tsanaae Game - 游戏资源导航',
    template: '%s | Tsanaae Game',
  },
  description: '精选优质游戏资源导航，发现你的下一款游戏',
  keywords: [
    '游戏',
    '游戏资源',
    '游戏导航',
    'PC游戏',
    '手机游戏',
    '独立游戏',
    '游戏推荐',
  ],
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const isDev = process.env.COZE_PROJECT_ENV === 'DEV';

  return (
    <html lang="zh-CN" className="dark">
      <body className={`antialiased min-h-screen bg-background flex flex-col`}>
        <ThemeProvider>
          {isDev && <Inspector />}
          <div className="flex-1">{children}</div>
          <Footer />
          <FloatingBall />
          <MusicPlayer />
        </ThemeProvider>
      </body>
    </html>
  );
}
