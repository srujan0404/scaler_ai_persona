import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  weight: ["300", "400", "500"],
});

const jetbrainsMono = JetBrains_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

export const metadata: Metadata = {
  title: "Srujan Reddy Dharma — AI Persona",
  description:
    "Chat with Srujan's AI representative. Ask about his background, skills, projects, and book a meeting.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrainsMono.variable} h-full`}>
      <body className="min-h-full flex flex-col bg-[var(--bg)] text-[var(--ink)] font-[var(--font-inter)] antialiased">
        <div className="dot-grain" />
        {children}
      </body>
    </html>
  );
}
