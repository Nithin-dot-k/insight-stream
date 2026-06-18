import { ClerkProvider } from '@clerk/nextjs';
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

// Using modern fonts to make the "Enterprise" UI look sharp
const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata = {
  title: "InsightStream | Enterprise AI Knowledge Base",
  description: "Secure, multi-tenant RAG platform for organizational intelligence.",
};

export default function RootLayout({ children }) {
  return (
    // ClerkProvider is the "Radio Tower" that broadcasts 
    // the user's login and organization data to the whole app.
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}