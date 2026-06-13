import type { Metadata } from 'next';
import { Inspector } from 'react-dev-inspector';
import './globals.css';
import Footer from '@/components/Footer';
import RightSidebar from '@/components/RightSidebar';

import ThemeProvider from '@/components/ThemeProvider';

export const metadata: Metadata = {
  title: {
    default: 'Tsanaae - 全品类资源库',
    template: '%s | Tsanaae',
  },
  description: '学习资料 · 影视剧 · 音乐 · 游戏 · 小说 · 实用软件 — 一站式资源库',
  keywords: [
    '资源库',
    '学习资料',
    '影视剧',
    '音乐',
    '游戏',
    '小说',
    '软件',
    '资源导航',
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
          <RightSidebar />
        </ThemeProvider>
      </body>
    </html>
  );
}
