import type { Metadata } from "next";
import "./globals.css";
import QueryProvider from "@/lib/providers/QueryProvider";

export const metadata: Metadata = {
  title: "HackathonHub - The World's Leading Data Science Platform",
  description: "Join thousands of data scientists in competing for prizes, learning from the best, and showcasing your skills in real-world data modeling challenges.",
  keywords: ["data science", "machine learning", "hackathon", "competitions", "AI", "kaggle"],
  authors: [{ name: "HackathonHub Team" }],
  openGraph: {
    title: "HackathonHub - Data Science Competitions",
    description: "Compete, learn, and grow as a data scientist",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <QueryProvider>
          {children}
        </QueryProvider>
      </body>
    </html>
  );
}
