import type { Metadata } from "next";
// import { Geist, Geist_Mono } from "next/font/google";
import "../assets/styles/globals.css";

export const metadata: Metadata = {
  title: 'Panificadora Paraíba',
  description: 'Panificadora em R',
  icons: {
    icon: '/images/favicon.svg',
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>
        {children}
      </body>
    </html>
  );
}
