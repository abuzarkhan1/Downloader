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
  title: "Seal Downloader — MD3 Universal Media Extractor",
  description: "Fast, sleek, high-quality video and audio downloader inspired by Seal Material Design 3.",
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
      <body className="min-h-full bg-[#13140E] text-[#E3E3DC] flex flex-col font-sans selection:bg-[#B4EB12] selection:text-[#13140E]">
        <ErrorBoundary>
          {children}
          <DisclaimerModal />
        </ErrorBoundary>
      </body>
    </html>
  );
}
