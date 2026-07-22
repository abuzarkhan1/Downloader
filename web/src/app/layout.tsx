import type { Metadata } from "next";
import { Inter, Geist, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { DisclaimerModal, ErrorBoundary } from "@/components";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-jetbrains-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Universal Video Downloader",
  description: "Fast, sleek, high-quality video and audio downloader for YouTube, TikTok, Instagram, and Facebook.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistSans.variable} ${jetbrainsMono.variable} dark h-full antialiased`}
    >
      <body className="min-h-full bg-[#09090B] text-[#FAFAFA] flex flex-col font-sans selection:bg-[#0B4DDE] selection:text-white">
        <ErrorBoundary>
          {children}
          <DisclaimerModal />
        </ErrorBoundary>
      </body>
    </html>
  );
}
