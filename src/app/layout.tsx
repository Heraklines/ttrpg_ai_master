import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Arcane Gamemaster - D&D 5e AI Companion",
  description: "AI-Powered D&D 5e Companion Application with mechanical dice rolling and state management",
  icons: {
    icon: "/favicon.ico",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="min-h-screen antialiased">
        {children}
      </body>
    </html>
  );
}
