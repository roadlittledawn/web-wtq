import Link from "next/link";

interface PublicLayoutProps {
  children: React.ReactNode;
}

export default function PublicLayout({ children }: PublicLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-slate-800 text-white shadow-md">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/" className="text-2xl font-bold hover:text-slate-200">
              Clinton Lexicon
            </Link>
            <nav>
              <ul className="flex space-x-6">
                <li>
                  <Link
                    href="/words"
                    className="hover:text-slate-200 transition-colors"
                  >
                    Words
                  </Link>
                </li>
                <li>
                  <Link
                    href="/phrases"
                    className="hover:text-slate-200 transition-colors"
                  >
                    Phrases
                  </Link>
                </li>
                <li>
                  <Link
                    href="/quotes"
                    className="hover:text-slate-200 transition-colors"
                  >
                    Quotes
                  </Link>
                </li>
                <li>
                  <Link
                    href="/hypotheticals"
                    className="hover:text-slate-200 transition-colors"
                  >
                    Hypotheticals
                  </Link>
                </li>
                <li>
                  <Link
                    href="/search"
                    className="hover:text-slate-200 transition-colors"
                  >
                    Search
                  </Link>
                </li>
              </ul>
            </nav>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-8">{children}</main>

      <footer className="bg-slate-100 border-t border-slate-200">
        <div className="container mx-auto px-4 py-6">
          <div className="text-center text-slate-600">
            <p>
              &copy; {new Date().getFullYear()} Clinton Lexicon. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
