// Metadata
import type { Metadata } from "next";

// Theme provider
import { ThemeProvider } from "next-themes";

// Clerk provider
import { ClerkProvider } from "@clerk/nextjs";

// Font
import { Geist, Geist_Mono, Barlow } from "next/font/google";

// Toast
import { Toaster } from "@/components/ui/sonner";

// Global css
import "./globals.css";
import ModalProvider from "@/providers/modal-provider";

// Note *1
const barlow = Barlow({
  variable: "--font-barlow",
  subsets: ["latin"],
  weight: ["500", "700"],
});
// Note *1 end

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "GoShop | Your best online shopping choice!",
  description: "This is a demo web app developed based on NextJS TypeScript and MySQL",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" className="light" style={{ colorScheme: 'light' }}>
        <body
          // Note *1
          className={`${geistSans.variable} ${geistMono.variable} ${barlow.variable} antialiased`}
        >
          <ThemeProvider
            attribute="class"
            defaultTheme="system"
            enableSystem
            disableTransitionOnChange
          >
            <ModalProvider>{children}</ModalProvider>

            <Toaster position="bottom-left"/>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
