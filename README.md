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

3. Copy `.env.example` to `.env.local` and fill in your environment variables:

   ```bash
   cp .env.example .env.local
   ```

4. Update the environment variables in `.env.local`:
   - `MONGODB_URI`: Your MongoDB connection string
   - `JWT_SECRET`: A strong secret key for JWT tokens
   - `AUTHOR_IMAGE_API_URL`: External API URL for author images
   - `AUTHOR_IMAGE_API_KEY`: API key if required

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to view the application.

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
