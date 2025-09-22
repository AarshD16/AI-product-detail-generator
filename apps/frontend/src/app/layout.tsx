import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "AI Product Generator",
  description: "Create stunning product pages with AI",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;700&family=Roboto+Mono&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="font-sans antialiased bg-gray-900 text-gray-100">
        {/* --- Header --- */}
        <header className="sticky top-0 z-50 bg-gray-800/90 backdrop-blur-md border-b border-gray-700 shadow-sm">
          <div className="max-w-6xl mx-auto flex items-center justify-between px-6 py-4">
            <h1 className="text-xl font-bold text-indigo-400 tracking-tight">
              AI-based Product Generator
            </h1>
            <nav className="flex gap-6 text-sm font-medium text-gray-300">
              <a href="/" className="hover:text-indigo-400 transition-colors">
                Home
              </a>
            </nav>
          </div>
        </header>

        {/* --- Main Content --- */}
        <main className="max-w-6xl mx-auto px-6 py-12">
          <div className="rounded-2xl bg-gray-800 shadow-md p-8">{children}</div>
        </main>

        {/* --- Footer --- */}
        <footer className="mt-16 border-t border-gray-700 bg-gray-900/80 backdrop-blur-sm">
          <div className="max-w-6xl mx-auto px-6 py-6 text-sm text-gray-400 flex justify-between">
            <span>© {new Date().getFullYear()} AI-based Product Generator</span>
            <div className="flex gap-4">
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Terms
              </a>
              <a href="#" className="hover:text-indigo-400 transition-colors">
                Privacy
              </a>
            </div>
          </div>
        </footer>
      </body>
    </html>
  );
}
