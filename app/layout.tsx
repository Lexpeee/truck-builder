import type { Metadata } from "next";
import { Archivo, Geist_Mono, Space_Grotesk } from "next/font/google";
import "./globals.css";
import axios from "axios";

const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
  variable: "--font-space-grotesk",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Showroom | NWT Truck Builder",
  description: "A 3D truck builder for newworktrucks.com",
};

axios.defaults.baseURL = process.env.WEBHOOK_ROOT_URL;

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${archivo.variable} ${geistMono.variable} ${spaceGrotesk.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
