import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SecureRAG Studio",
  description: "A secure retrieval-augmented generation application.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
