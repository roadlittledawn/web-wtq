# Clinton Lexicon

A web application for curating and organizing a personal collection of words, phrases, quotes, and hypotheticals.

## Tech Stack

- **Frontend**: Next.js 14+ with TypeScript and Tailwind CSS
- **Backend**: Netlify Functions (serverless)
- **Database**: MongoDB
- **Authentication**: JWT with bcrypt
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

4. Generate a password hash for your admin user:

   ```bash
   npx tsx scripts/generate-password-hash.ts yourPassword123
   ```

   Copy the output and add it to your `.env` file.

5. Update the environment variables in `.env`:

   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key for JWT tokens (generate with `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`)
   - `ADMIN_USERNAME`: Your admin username (default: admin)
   - `ADMIN_PASSWORD_HASH`: The bcrypt hash from step 4
   - `AUTHOR_IMAGE_API_URL`: External API URL for author images (optional)
   - `AUTHOR_IMAGE_API_KEY`: API key if required (optional)

6. Set up database indexes:

   ```bash
   npx tsx scripts/setup-db.ts
   ```

### Development

Run the development server with Netlify Functions:

```bash
netlify dev
```

Or run Next.js directly (without serverless functions):

```bash
npm run dev
```

Open [http://localhost:8888](http://localhost:8888) (netlify dev) or [http://localhost:3000](http://localhost:3000) (npm run dev) to view the application.

Login at `/admin/login` with your configured username and password.

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
