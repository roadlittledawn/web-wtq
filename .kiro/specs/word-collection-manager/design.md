# Design Document

## Overview

The Clinton Lexicon is a full-stack web application built with Next.js (React framework) for the frontend and Netlify Functions for the serverless backend. The application provides a dual interface: an authenticated admin panel for content management and a public-facing interface for browsing and searching entries. MongoDB serves as the database, storing four types of entries (words, phrases, quotes, and hypotheticals), each with a type-specific schema. Authentication is handled via JWT tokens with bcrypt password hashing, ensuring secure access to administrative functions.

The architecture follows a serverless pattern, leveraging Netlify's infrastructure for deployment and function execution. The frontend uses Next.js for server-side rendering and static generation capabilities, providing optimal performance for the public interface while maintaining a responsive admin experience.

## Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js Frontend                      │
│  ┌──────────────────┐           ┌──────────────────┐       │
│  │  Public Pages    │           │   Admin Pages    │       │
│  │  - Browse        │           │   - Login        │       │
│  │  - Search        │           │   - Create Entry │       │
│  │  - Filter        │           │   - Edit Entry   │       │
│  └──────────────────┘           └──────────────────┘       │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                    Netlify Functions (API)                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ Auth         │  │ Public API   │  │ Protected    │     │
│  │ - login      │  │ - getEntries │  │ API          │     │
│  │              │  │ - search     │  │ - create     │     │
│  │              │  │ - getTags    │  │ - update     │     │
│  │              │  │              │  │ - delete     │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ MongoDB Driver
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                      MongoDB Database                        │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐     │
│  │ entries      │  │ tags         │  │ users        │     │
│  │ collection   │  │ collection   │  │ collection   │     │
│  └──────────────┘  └──────────────┘  └──────────────┘     │
└─────────────────────────────────────────────────────────────┘
```

### Technology Stack

- **Frontend Framework**: Next.js 14+ (React 18+)
- **Styling**: Tailwind CSS
- **UI Components**: Headless UI or Radix UI for accessible components
- **Tag Management**: react-select for multi-select tag input
- **Backend**: Netlify Functions (Node.js serverless functions)
- **Database**: MongoDB Atlas
- **Authentication**: JWT with bcrypt
- **Deployment**: Netlify
- **External API**: Wikipedia API or similar for author images

### Deployment Architecture

The application will be deployed on Netlify with the following structure:

- Static assets and Next.js pages served via Netlify CDN
- Netlify Functions deployed as serverless endpoints under `/.netlify/functions/`
- Environment variables stored in Netlify dashboard for secure credential management
- MongoDB connection pooling handled within Netlify Functions

## Components and Interfaces

### Frontend Components

#### Public Interface Components

1. **Layout Components**

   - `PublicLayout`: Main layout wrapper with navigation
   - `Header`: Site header with navigation links
   - `Footer`: Site footer

2. **Browse Components**

   - `WordBrowser`: Alphabetical word listing with letter grouping
   - `PhraseBrowser`: Alphabetical phrase listing with tag filters
   - `QuoteBrowser`: Quote listing sorted by author with tag filters
   - `HypotheticalBrowser`: Hypothetical listing with tag filters
   - `AlphabetNav`: Letter navigation component for alphabetical browsing
   - `EntryCard`: Reusable card component for displaying entries
   - `TagFilter`: Tag selection and filtering component

3. **Search Components**

   - `SearchBar`: Search input with type and tag filters
   - `SearchResults`: Display search results with pagination
   - `FilterPanel`: Entry type and tag filter controls

4. **Progressive Loading Components**

   - `InfiniteScroll`: Wrapper component for lazy loading
   - `LoadingSpinner`: Loading indicator
   - `EndOfList`: Indicator when all entries are loaded

5. **Quote-Specific Components**
   - `AuthorImage`: Component to fetch and display author images
   - `QuoteCard`: Specialized card for quote display with author image

#### Admin Interface Components

1. **Authentication Components**

   - `LoginForm`: Login form with credential inputs
   - `AuthGuard`: HOC for protecting admin routes

2. **Entry Management Components**

   - `EntryForm`: Dynamic form that adapts to entry type
   - `WordForm`: Specific form for word entries
   - `PhraseForm`: Specific form for phrase entries
   - `QuoteForm`: Specific form for quote entries
   - `HypotheticalForm`: Specific form for hypothetical entries
   - `TagInput`: Multi-select tag input with auto-suggestions
   - `SlugInput`: Slug input with auto-generation
   - `EditButton`: Icon button for quick access to edit page

3. **Admin Layout Components**
   - `AdminLayout`: Admin-specific layout with authentication
   - `AdminNav`: Admin navigation menu
   - `EntryList`: List view of entries with edit/delete actions

### Backend API Endpoints

#### Public Endpoints (No Authentication Required)

1. **GET /api/entries**

   - Query params: `type`, `limit`, `offset`, `sortBy`, `letter`
   - Returns: Paginated list of entries

2. **GET /api/entries/:slug**

   - Returns: Single entry by slug

3. **GET /api/search**

   - Query params: `q`, `type`, `tags`, `limit`, `offset`
   - Returns: Search results with pagination

4. **GET /api/tags**
   - Returns: List of all tags with usage counts

#### Protected Endpoints (JWT Authentication Required)

1. **POST /api/auth/login**

   - Body: `{ username, password }`
   - Returns: `{ token, expiresAt }`

2. **POST /api/entries**

   - Headers: `Authorization: Bearer <token>`
   - Body: Entry data matching type schema
   - Returns: Created entry with ID

3. **PUT /api/entries/:id**

   - Headers: `Authorization: Bearer <token>`
   - Body: Updated entry data
   - Returns: Updated entry

4. **DELETE /api/entries/:id**

   - Headers: `Authorization: Bearer <token>`
   - Returns: Deletion confirmation

5. **POST /api/validate-slug**
   - Headers: `Authorization: Bearer <token>`
   - Body: `{ slug, excludeId }`
   - Returns: `{ isUnique: boolean }`

### Middleware

1. **Authentication Middleware**

   - Validates JWT tokens
   - Extracts user information
   - Handles token expiration

2. **Error Handling Middleware**

   - Standardizes error responses
   - Logs errors for debugging

3. **CORS Middleware**
   - Configures cross-origin requests
   - Sets appropriate headers

## Data Models

### MongoDB Collections

#### 1. Users Collection

```typescript
interface User {
  _id: ObjectId;
  username: string;
  passwordHash: string;
  createdAt: Date;
  updatedAt: Date;
}
```

#### 2. Entries Collection

All entry types are stored in a single collection with a discriminator field for type.

**Base Entry Interface**

```typescript
interface BaseEntry {
  _id: ObjectId;
  type: "word" | "phrase" | "quote" | "hypothetical";
  slug: string; // Unique across all entries
  tags: string[];
  createdAt: Date;
  updatedAt: Date;
}
```

**Word Entry**

```typescript
interface WordEntry extends BaseEntry {
  type: "word";
  name: string; // Required
  definition: string; // Required
  partOfSpeech?: string;
  etymology?: string;
  notes?: string;
}
```

**Phrase Entry**

```typescript
interface PhraseEntry extends BaseEntry {
  type: "phrase";
  name: string; // Required
  definition: string; // Required
  source?: string;
  notes?: string;
}
```

**Quote Entry**

```typescript
interface QuoteEntry extends BaseEntry {
  type: "quote";
  name: string; // Required (title/identifier)
  body: string; // Required (the actual quote text)
  author: string; // Required
  source?: string;
  notes?: string;
}
```

**Hypothetical Entry**

```typescript
interface HypotheticalEntry extends BaseEntry {
  type: "hypothetical";
  body: string; // Required
  source?: string;
  notes?: string;
}
```

#### 3. Tags Collection

```typescript
interface Tag {
  _id: ObjectId;
  name: string; // Unique
  usageCount: number; // Number of entries using this tag
  createdAt: Date;
}
```

### Database Indexes

1. **Entries Collection**

   - `{ slug: 1 }` - Unique index for slug lookups
   - `{ type: 1, name: 1 }` - Compound index for type-specific alphabetical sorting
   - `{ type: 1, 'author': 1 }` - Compound index for quote sorting by author
   - `{ tags: 1 }` - Multi-key index for tag filtering
   - `{ name: 'text', body: 'text', definition: 'text' }` - Text index for search

2. **Tags Collection**

   - `{ name: 1 }` - Unique index for tag names

3. **Users Collection**
   - `{ username: 1 }` - Unique index for username lookups

## Correctness Properties

_A property is a characteristic or behavior that should hold true across all valid executions of a system—essentially, a formal statement about what the system should do. Properties serve as the bridge between human-readable specifications and machine-verifiable correctness guarantees._

### Authentication and Security Properties

**Property 1: Password verification correctness** _For any_ password string, hashing the password and then verifying it with bcrypt should return true for the original password and false for any different password. **Validates: Requirements 1.1**

**Property 2: JWT expiration time** _For any_ generated JWT token, the expiration claim should be set to exactly 24 hours from the token creation time. **Validates: Requirements 1.2**

**Property 3: Invalid credentials rejection** _For any_ login attempt with incorrect credentials, the authentication system should reject the attempt and return an error. **Validates: Requirements 1.4**

**Property 4: Expired token rejection** _For any_ JWT token with an expiration time in the past, authentication middleware should reject requests using that token. **Validates: Requirements 1.5**

**Property 5: Protected endpoint authentication** _For any_ request to a protected API endpoint without a valid JWT token, the system should reject the request with an authentication error. **Validates: Requirements 11.1, 11.4**

### Entry Management Properties

**Property 6: Schema validation enforcement** _For any_ entry submission, if the entry data does not conform to its type-specific schema, the system should reject it with specific validation errors. **Validates: Requirements 2.1, 2.9**

**Property 7: Unique ID generation** _For any_ two entries created in the system, their generated IDs should be unique. **Validates: Requirements 2.6**

**Property 8: Unauthenticated request rejection** _For any_ create, update, or delete request without valid authentication, the system should reject the request. **Validates: Requirements 2.8**

**Property 9: Update persistence** _For any_ valid entry update, retrieving the entry after the update should return the modified data. **Validates: Requirements 3.2**

**Property 10: Deletion removes entry** _For any_ entry that is deleted, subsequent attempts to retrieve that entry should fail with a not-found error. **Validates: Requirements 4.1**

### Data Retrieval and Organization Properties

**Property 11: Entry grouping by type** _For any_ set of entries retrieved from the public API, entries should be organized by their type field. **Validates: Requirements 5.3**

**Property 12: Complete metadata inclusion** _For any_ entry retrieved from the API, all fields including tags should be present in the response. **Validates: Requirements 5.4**

**Property 13: Alphabetical sorting correctness** _For any_ list of word entries sorted alphabetically by name, each entry should come before or equal to the next entry in lexicographic order. **Validates: Requirements 6.1**

**Property 14: First letter grouping** _For any_ alphabetically grouped word list, all words in a letter group should start with that letter. **Validates: Requirements 6.2**

**Property 15: Letter filter correctness** _For any_ letter filter applied to words, all returned entries should have names starting with that letter. **Validates: Requirements 6.3**

**Property 16: Author sorting for quotes** _For any_ list of quote entries sorted by author, each entry's author should come before or equal to the next entry's author in lexicographic order. **Validates: Requirements 6.5**

### Search and Filter Properties

**Property 17: Search field targeting** _For any_ search query, word entries should be matched against the name field, while phrase, quote, and hypothetical entries should be matched against the body field. **Validates: Requirements 7.1**

**Property 18: Type filter correctness** _For any_ search with a type filter applied, all returned entries should match the specified type. **Validates: Requirements 7.2**

**Property 19: Tag filter correctness** _For any_ search with tag filters applied, all returned entries should contain all specified tags. **Validates: Requirements 7.3**

**Property 20: Single tag filter** _For any_ tag filter applied to entries, all returned entries should contain that tag in their tags array. **Validates: Requirements 8.1**

**Property 21: Multiple tag filter (AND logic)** _For any_ set of multiple tag filters applied, all returned entries should contain every one of the specified tags. **Validates: Requirements 8.2**

### Tag Management Properties

**Property 22: Tag autocomplete matching** _For any_ partial tag name typed in the tag input, all suggested tags should contain the typed text as a substring (case-insensitive). **Validates: Requirements 9.1**

**Property 23: New tag creation** _For any_ new tag name that doesn't exist in the system, creating and adding it to an entry should result in the tag being stored and associated with that entry. **Validates: Requirements 9.3**

**Property 24: Tag removal** _For any_ tag removed from an entry, retrieving that entry should show the tag is no longer in the tags array. **Validates: Requirements 9.4**

### Slug Management Properties

**Property 25: Slug generation format** _For any_ name or body text, the auto-generated slug should be lowercase with spaces replaced by hyphens. **Validates: Requirements 10.1**

**Property 26: Slug special character removal** _For any_ generated slug, all special characters except hyphens should be removed. **Validates: Requirements 10.2**

**Property 27: Slug uniqueness validation** _For any_ attempt to save an entry with a slug that already exists in the database, the system should reject the save operation with an error. **Validates: Requirements 10.4**

### External Integration Properties

**Property 28: Author image API request** _For any_ quote entry with an author displayed, the system should make a request to the external image API for that author. **Validates: Requirements 12.1**

**Property 29: Image caching** _For any_ author image fetched from the external API, subsequent requests for the same author should use the cached image without making additional API calls. **Validates: Requirements 12.4**

### Performance Properties

**Property 30: Progressive loading threshold** _For any_ entry collection that exceeds the defined threshold, the initial API response should return only the page size limit of entries, not the entire collection. **Validates: Requirements 13.1, 13.2**

## Error Handling

### Error Categories

1. **Authentication Errors**

   - Invalid credentials (401 Unauthorized)
   - Missing JWT token (401 Unauthorized)
   - Expired JWT token (401 Unauthorized)
   - Invalid JWT token (401 Unauthorized)

2. **Validation Errors**

   - Schema validation failures (400 Bad Request)
   - Duplicate slug (409 Conflict)
   - Missing required fields (400 Bad Request)
   - Invalid field formats (400 Bad Request)

3. **Not Found Errors**

   - Entry not found (404 Not Found)
   - Tag not found (404 Not Found)

4. **Database Errors**

   - Connection failures (503 Service Unavailable)
   - Query failures (500 Internal Server Error)
   - Transaction failures (500 Internal Server Error)

5. **External API Errors**
   - Author image API failures (handled gracefully with fallback)
   - Network timeouts (handled with retry logic)

### Error Response Format

All API errors will follow a consistent format:

```typescript
interface ErrorResponse {
  error: {
    code: string; // Machine-readable error code
    message: string; // Human-readable error message
    details?: any; // Optional additional error details
  };
}
```

### Error Handling Strategies

1. **Client-Side Validation**

   - Validate form inputs before submission
   - Provide immediate feedback for invalid inputs
   - Display clear error messages near relevant fields

2. **Server-Side Validation**

   - Always validate on the server regardless of client validation
   - Use schema validation libraries (e.g., Zod, Joi)
   - Return specific validation errors for each field

3. **Database Error Handling**

   - Implement connection retry logic with exponential backoff
   - Use connection pooling to manage database connections
   - Log database errors for debugging
   - Return generic error messages to clients (don't expose internal details)

4. **External API Error Handling**

   - Implement timeout limits for external API calls
   - Use fallback images when author images can't be fetched
   - Cache successful responses to reduce API dependency
   - Log external API failures for monitoring

5. **Authentication Error Handling**
   - Clear expired tokens from client storage
   - Redirect to login page on authentication failures
   - Provide clear feedback for invalid credentials
   - Implement rate limiting to prevent brute force attacks

## Testing Strategy

### Unit Testing

The application will use **Vitest** as the testing framework for unit tests. Unit tests will focus on:

1. **Utility Functions**

   - Slug generation and sanitization
   - Password hashing and verification
   - JWT token generation and validation
   - Date/time formatting

2. **Validation Logic**

   - Schema validation for each entry type
   - Slug uniqueness checking
   - Tag validation

3. **API Route Handlers**

   - Request parsing and validation
   - Response formatting
   - Error handling

4. **React Components**
   - Component rendering with various props
   - User interaction handling
   - Form submission logic

### Property-Based Testing

The application will use **fast-check** for property-based testing in JavaScript/TypeScript. Property-based tests will:

- Run a minimum of 100 iterations per property
- Generate random test data to verify properties hold across all inputs
- Each property-based test will include a comment tag referencing the specific correctness property from this design document
- Tag format: `// Feature: word-collection-manager, Property {number}: {property_text}`

Property-based tests will cover:

1. **Authentication Properties**

   - Password hashing and verification (Property 1)
   - JWT expiration times (Property 2)
   - Token validation (Properties 4, 5)

2. **Data Validation Properties**

   - Schema validation (Property 6)
   - Unique ID generation (Property 7)
   - Update persistence (Property 9)

3. **Sorting and Filtering Properties**

   - Alphabetical sorting (Properties 13, 16)
   - Tag filtering (Properties 20, 21)
   - Search field targeting (Property 17)

4. **Slug Management Properties**
   - Slug generation format (Property 25)
   - Special character removal (Property 26)
   - Uniqueness validation (Property 27)

### Integration Testing

Integration tests will verify:

1. **API Endpoint Integration**

   - Full request/response cycles
   - Authentication flow
   - Database operations

2. **Database Integration**

   - CRUD operations
   - Index usage
   - Query performance

3. **External API Integration**
   - Author image fetching
   - Caching behavior
   - Fallback handling

### End-to-End Testing

E2E tests will use **Playwright** to verify:

1. **Public Interface Flows**

   - Browsing entries by type
   - Searching and filtering
   - Progressive loading

2. **Admin Interface Flows**
   - Login/logout
   - Creating entries
   - Editing entries
   - Deleting entries
   - Tag management

### Test Coverage Goals

- Unit test coverage: 80%+ for utility functions and business logic
- Property-based tests: All 30 correctness properties implemented
- Integration tests: All API endpoints covered
- E2E tests: All critical user flows covered

## Security Considerations

### Authentication Security

1. **Password Storage**

   - Use bcrypt with a work factor of 12 for password hashing
   - Never store plain-text passwords
   - Implement password strength requirements

2. **JWT Security**

   - Use strong secret keys (minimum 256 bits)
   - Store JWT secret in environment variables
   - Implement token expiration (24 hours)
   - Use HTTPS only for token transmission

3. **Session Management**
   - Clear tokens on logout
   - Implement token refresh mechanism if needed
   - Validate tokens on every protected request

### API Security

1. **Input Validation**

   - Validate all user inputs on the server
   - Sanitize inputs to prevent injection attacks
   - Use parameterized queries for database operations

2. **Rate Limiting**

   - Implement rate limiting on authentication endpoints
   - Limit API requests per IP address
   - Use exponential backoff for failed login attempts

3. **CORS Configuration**
   - Configure CORS to allow only trusted origins
   - Set appropriate CORS headers
   - Validate origin on sensitive operations

### Database Security

1. **Connection Security**

   - Use MongoDB connection strings with authentication
   - Enable SSL/TLS for database connections
   - Store connection strings in environment variables

2. **Access Control**
   - Use principle of least privilege for database users
   - Separate read and write permissions where possible
   - Implement database-level access controls

### Deployment Security

1. **Environment Variables**

   - Store all secrets in Netlify environment variables
   - Never commit secrets to version control
   - Use different secrets for development and production

2. **HTTPS**
   - Enforce HTTPS for all connections
   - Use Netlify's automatic SSL certificates
   - Implement HSTS headers

## Performance Optimization

### Frontend Performance

1. **Code Splitting**

   - Use Next.js automatic code splitting
   - Lazy load admin components
   - Split vendor bundles

2. **Image Optimization**

   - Use Next.js Image component for author images
   - Implement lazy loading for images
   - Cache author images in browser

3. **Progressive Loading**

   - Implement infinite scroll for large lists
   - Load initial batch of 20-30 entries
   - Prefetch next batch on scroll

4. **Caching Strategy**
   - Cache static assets with long TTL
   - Use SWR or React Query for data fetching
   - Implement stale-while-revalidate pattern

### Backend Performance

1. **Database Optimization**

   - Use appropriate indexes for common queries
   - Implement connection pooling
   - Use projection to limit returned fields

2. **API Response Optimization**

   - Implement pagination for all list endpoints
   - Use compression for API responses
   - Cache frequently accessed data

3. **Netlify Functions Optimization**
   - Minimize cold start times
   - Reuse database connections
   - Implement function-level caching

### Monitoring and Metrics

1. **Performance Metrics**

   - Track API response times
   - Monitor database query performance
   - Measure page load times

2. **Error Tracking**
   - Implement error logging
   - Track error rates
   - Monitor external API failures

## Deployment Strategy

### Environment Configuration

1. **Development Environment**

   - Local MongoDB instance or MongoDB Atlas free tier
   - Local Netlify CLI for function testing
   - Environment variables in `.env.local`

2. **Production Environment**
   - MongoDB Atlas production cluster
   - Netlify production deployment
   - Environment variables in Netlify dashboard

### Required Environment Variables

```
MONGODB_URI=mongodb+srv://...
JWT_SECRET=<strong-random-secret>
JWT_EXPIRATION=24h
AUTHOR_IMAGE_API_URL=<external-api-url>
AUTHOR_IMAGE_API_KEY=<api-key-if-needed>
```

### Deployment Process

1. **Build Process**

   - Next.js builds static and server-rendered pages
   - Netlify Functions are bundled automatically
   - Environment variables injected at build time

2. **Deployment Steps**

   - Push code to Git repository
   - Netlify automatically triggers build
   - Run tests before deployment
   - Deploy to production on successful build

3. **Post-Deployment**
   - Verify database connectivity
   - Test authentication flow
   - Verify external API integration
   - Monitor error logs

### Rollback Strategy

1. **Instant Rollback**

   - Use Netlify's instant rollback feature
   - Revert to previous deployment with one click

2. **Database Migrations**
   - Keep migrations backward compatible
   - Test migrations in staging environment
   - Have rollback scripts ready

## Future Enhancements

1. **Rich Text Editor**

   - Add WYSIWYG editor for notes fields
   - Support markdown formatting

2. **Export Functionality**

   - Export entries to JSON/CSV
   - Backup and restore capabilities

3. **Advanced Search**

   - Full-text search with relevance ranking
   - Search suggestions and autocomplete

4. **Analytics**

   - Track popular entries
   - Monitor search queries
   - User engagement metrics

5. **Multi-User Support**

   - Multiple admin accounts
   - Role-based access control
   - Activity logging

6. **API Rate Limiting**
   - Implement per-user rate limits
   - Throttle excessive requests
   - API usage analytics
