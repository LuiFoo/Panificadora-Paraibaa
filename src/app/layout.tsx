import type { Metadata } from "next";
import "../assets/styles/globals.css";
import { UserProvider } from "@/context/UserContext";
import { CartProvider } from "@/context/CartContext";
import { ToastProvider } from "@/context/ToastContext";
import SessionProvider from "@/components/SessionProvider";
import { PermissionSync } from "@/components/PermissionSync";
import AuthSync from "@/components/AuthSync";

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
        <SessionProvider>
          <ToastProvider>
            <UserProvider>
              <AuthSync />
              <PermissionSync />
              <CartProvider>
                {children}
              </CartProvider>
            </UserProvider>
          </ToastProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
