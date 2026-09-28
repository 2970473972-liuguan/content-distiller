import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "内容蒸馏 · Content Distiller",
  description: "把一段小说或视频文案,蒸馏成摘要、情节卡片或读书笔记",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="font-sans">{children}</body>
    </html>
  );
}
