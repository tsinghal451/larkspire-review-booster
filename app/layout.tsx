import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Larkspire Review Booster – Smart QR & Feedback System",
  description:
    "Turn happy customers into 5-star Google reviews and capture private feedback before it goes public.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased font-sans bg-slate-50 text-slate-900">
        {children}
      </body>
    </html>
  );
}

