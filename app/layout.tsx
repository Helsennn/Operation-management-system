import type { Metadata, Viewport } from "next";
import PwaRegister from "./pwa-register";
import "./globals.css";

export const metadata: Metadata = {
  title: "Whatnot Daily Ops",
  description: "Scheduling, livestream records, and daily show reports for Whatnot operations.",
  manifest: "/manifest.json",
  icons: {
    icon: "/brand-logo.jpeg",
    apple: "/brand-logo.jpeg"
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Daily Ops"
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: "#f5f5f7"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>
        {children}
        <PwaRegister />
      </body>
    </html>
  );
}
