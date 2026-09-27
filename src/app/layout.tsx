import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sanvada",
  description:
    "Una IA conversacional que te conoce poco a poco — y te ayuda a convertirte en quien estás llegando a ser.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#070b14",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
