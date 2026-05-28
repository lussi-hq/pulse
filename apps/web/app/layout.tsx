import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Pulse - Dashboard de Performance",
  description: "Suivi opérationnel et analytique des campagnes et publications de Pulse.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr" className="h-full">
      <body className="min-h-full font-sans antialiased bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}
