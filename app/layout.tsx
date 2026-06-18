import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.scss";
import AuthGate from "../components/AuthGate";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { SocketProvider } from "../components/SocketProvider";
import NotificationToast from "../components/NotificationToast";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Kindness Connector - BookShare",
  description: "Mạng lưới trao đổi sách cũ 0đ",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="vi">
      <body className={inter.className}>
        <SocketProvider>
          <AuthGate>
            <Header />
            <main style={{ minHeight: 'calc(100vh - 64px - 300px)' }}>
              {children}
            </main>
            <Footer />
            <NotificationToast />
          </AuthGate>
        </SocketProvider>
      </body>
    </html>
  );
}
