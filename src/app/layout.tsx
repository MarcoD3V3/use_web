import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-portal-sans",
  display: "swap",
});

const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-portal-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CraftLauncher — Player Portal",
  description: "Panel web del jugador: recompensas, misiones, notificaciones y más.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" className={`${dmSans.variable} ${jetbrainsMono.variable}`}>
      <body className="min-h-screen bg-portal-bg text-portal-text font-sans antialiased">
        {children}
      </body>
    </html>
  );
}
