# Clinton Lexicon

A web application for curating and organizing a personal collection of words, phrases, quotes, and hypotheticals.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **Backend**: Netlify Functions (serverless)
- **Database**: MongoDB
- **Authentication**: [clang-auth](https://auth.clintonlangosch.com) shared sign-in (ES256 JWT in an HttpOnly cookie, verified with `jose`)
- **Testing**: Vitest with fast-check for property-based testing

## Project Structure

```
├── app/                    # Next.js app directory
├── components/             # React components
├── lib/                    # Utility functions and shared logic
├── netlify/functions/      # Netlify serverless functions
├── types/                  # TypeScript type definitions
├── .env.example           # Environment variables template
└── netlify.toml           # Netlify configuration
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- MongoDB Atlas account (or local MongoDB instance)

### Installation

1. Clone the repository
2. Install dependencies:

   ```bash
   npm install
   ```

3. Copy `.env.example` to `.env` and fill in your environment variables:

   ```bash
   cp .env.example .env
   ```

4. Update the environment variables in `.env`:

   - `MONGODB_URI`: Your MongoDB connection string
   - `AUTH_BASE_URL` / `NEXT_PUBLIC_AUTH_BASE_URL`: the clang-auth service (local: `http://auth.localtest.me:4000`)
   - `AUTH_APP_SLUG`: `lexicon`
   - `APP_ORIGIN`: this app's own origin (local: `http://lexicon.localtest.me:8888`)
   - `AUTHOR_IMAGE_API_URL`: External API URL for author images (optional)
   - `AUTHOR_IMAGE_API_KEY`: API key if required (optional)

   Admin sign-in needs a local clang-auth; see [SETUP.md](SETUP.md).

5. Set up database indexes:

   ```bash
   npx tsx scripts/setup-db.ts
   ```

### Development

Run the development server with Netlify Functions:

```bash
netlify dev --command "npx next dev -p 3002" --target-port 3002
```

Or run Next.js directly (without serverless functions, so no data or sign-in):

```bash
npm run dev
```

Open [http://lexicon.localtest.me:8888](http://lexicon.localtest.me:8888) (netlify dev). Use that hostname rather than `localhost` so the sign-in cookie works. `/admin` redirects you to clang-auth to sign in.

### Testing

Run tests:

```bash
npm test
```

Run tests in watch mode:

```bash
npm run test:watch
```

### Building for Production

```bash
npm run build
```

### Deployment

The application is configured for deployment on Netlify:

1. Connect your repository to Netlify
2. Set environment variables in Netlify dashboard
3. Deploy!

## Environment Variables

See `.env.example` for required environment variables.

## License

Private project - All rights reserved.
