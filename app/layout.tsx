import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import {Provider} from "@/components/Provider";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BEEPA Reform Tracker",
  description: "Performance monitoring dashboard for MDA reforms and initiatives",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        suppressHydrationWarning
      >
          <Provider>
          {children}
        </Provider>
      </body>
    </html>
  );
}
