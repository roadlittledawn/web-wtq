import PublicLayout from "@/components/PublicLayout";
import Link from "next/link";

export default function Home() {
  const categories = [
    {
      title: "Words",
      href: "/words",
      description: "Delightful morsels of language that deserve more airtime",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
          />
        </svg>
      ),
    },
    {
      title: "Phrases",
      href: "/phrases",
      description: "Turns of phrase that tickle me or make me go oooh",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
          />
        </svg>
      ),
    },
    {
      title: "Quotes",
      href: "/quotes",
      description: "Things said way better than I could have",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
      ),
    },
    {
      title: "Hypotheticals",
      href: "/hypotheticals",
      description: "Superlatives, would you rather's and what if's",
      icon: (
        <svg
          className="w-12 h-12"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
  ];

  return (
    <PublicLayout>
      <div className="max-w-6xl mx-auto">
        {/* Hero Section */}
        <div className="text-center py-20">
          <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
            Clinton Lexicon
          </h1>
          <p className="text-xl md:text-2xl text-slate-600 max-w-2xl mx-auto leading-relaxed">
            I'm Clinton and I'm a logophile. These are a few of my favorite
            things.
          </p>
        </div>

        {/* Category Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pb-20">
          {categories.map((category) => (
            <Link
              key={category.href}
              href={category.href}
              className="group bg-white rounded-xl shadow-md hover:shadow-xl transition-all duration-300 p-8 border border-slate-200 hover:border-blue-400"
            >
              <div className="flex items-start space-x-4">
                <div className="flex-shrink-0 text-blue-600 group-hover:text-blue-700 transition-colors">
                  {category.icon}
                </div>
                <div className="flex-1">
                  <h2 className="text-2xl font-bold text-slate-800 mb-2 group-hover:text-blue-600 transition-colors">
                    {category.title}
                  </h2>
                  <p className="text-slate-600 leading-relaxed">
                    {category.description}
                  </p>
                </div>
                <div className="flex-shrink-0 text-slate-400 group-hover:text-blue-600 transition-colors">
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </PublicLayout>
  );
}
