import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "智享论坛 - 专业知识与生活服务社区",
  description: "一个以手机号+密码登录的专业论坛，涵盖专业知识和生活服务两大领域，支持发帖、点赞、评论、收藏和热点榜功能",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className={inter.className}>{children}</body>
    </html>
  );
}
