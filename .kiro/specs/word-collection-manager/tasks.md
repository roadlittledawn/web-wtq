# Implementation Plan

- [x] 1. Set up project structure and dependencies

  - Initialize Next.js 14+ project with TypeScript
  - Install and configure Tailwind CSS
  - Install dependencies: mongodb, bcrypt, jsonwebtoken, zod, react-select
  - Install dev dependencies: vitest, fast-check, @testing-library/react
  - Create directory structure: `/app`, `/components`, `/lib`, `/netlify/functions`, `/types`
  - Configure Netlify Functions in `netlify.toml`
  - Set up environment variables template (`.env.example`)
  - _Requirements: 14.4_

- [x] 2. Implement database models and connection

  - [x] 2.1 Create MongoDB connection utility with connection pooling

    - Write connection manager for Netlify Functions
    - Implement connection reuse and error handling
    - _Requirements: 14.1, 14.2, 14.3_

  - [x] 2.2 Define TypeScript interfaces for all data models

    - Create User, BaseEntry, WordEntry, PhraseEntry, QuoteEntry, HypotheticalEntry interfaces
    - Create Tag interface
    - _Requirements: 2.2, 2.3, 2.4, 2.5_

  - [x] 2.3 Create database indexes
    - Implement index creation script for entries, tags, and users collections
    - _Requirements: 5.1, 6.1, 7.1_

- [x] 3. Implement authentication utilities

  - [x] 3.1 Create password hashing and verification utilities

    - Implement bcrypt hashing with work factor 12
    - Implement password verification function
    - _Requirements: 1.1_

  - [x] 3.3 Create JWT token generation and validation utilities

    - Implement token generation with 24-hour expiration
    - Implement token verification function
    - _Requirements: 1.2, 1.3, 1.5_

- [x] 4. Implement validation schemas

  - [x] 4.1 Create Zod schemas for each entry type

    - Define validation schemas for Word, Phrase, Quote, and Hypothetical entries
    - Include required and optional field validation
    - _Requirements: 2.1, 2.2, 2.3, 2.4, 2.5_

- [x] 5. Implement slug utilities

  - [x] 5.1 Create slug generation function

    - Convert text to lowercase and replace spaces with hyphens
    - Remove special characters except hyphens
    - _Requirements: 10.1, 10.2_

  - [x] 5.2 Create slug uniqueness validation function

    - Query database to check for existing slugs
    - _Requirements: 10.4_

- [x] 6. Implement authentication API endpoint

  - [x] 6.1 Create login Netlify Function

    - Implement POST /api/auth/login endpoint
    - Validate credentials against database
    - Generate and return JWT token
    - _Requirements: 1.1, 1.2, 1.3, 1.4_

- [x] 7. Implement authentication middleware

  - [x] 7.1 Create JWT verification middleware

    - Extract and validate JWT from Authorization header
    - Handle missing, invalid, and expired tokens
    - _Requirements: 11.1, 11.2, 11.3, 11.4_

- [x] 8. Implement public API endpoints

  - [x] 8.1 Create GET /api/entries endpoint

    - Implement pagination with limit and offset
    - Support filtering by type and letter
    - Support sorting options
    - _Requirements: 5.1, 5.2, 6.1, 6.2, 6.3_

  - [x] 8.2 Create GET /api/entries/:slug endpoint

    - Retrieve single entry by slug
    - Return 404 if not found
    - _Requirements: 5.1_

  - [x] 8.3 Create GET /api/tags endpoint
    - Return all tags with usage counts
    - _Requirements: 9.1_

- [x] 9. Implement search API endpoint

  - [x] 9.1 Create GET /api/search endpoint

    - Implement text search across name and body fields
    - Support filtering by entry type
    - Support filtering by tags
    - Implement pagination
    - _Requirements: 7.1, 7.2, 7.3, 7.4_

- [x] 10. Implement tag filtering functionality

  - [x] 10.1 Add tag filtering to entries endpoint

    - Support single and multiple tag filters
    - Implement AND logic for multiple tags
    - _Requirements: 8.1, 8.2_

- [x] 11. Implement protected entry management endpoints

  - [x] 11.1 Create POST /api/entries endpoint

    - Validate authentication
    - Validate entry data against schema
    - Generate unique ID and slug
    - Store entry in database
    - _Requirements: 2.1, 2.6, 2.7, 2.8_

  - [x] 11.2 Create PUT /api/entries/:id endpoint

    - Validate authentication
    - Validate updated data against schema
    - Update entry in database
    - _Requirements: 3.1, 3.2, 3.3, 3.4, 3.5_

  - [x] 11.3 Create DELETE /api/entries/:id endpoint

    - Validate authentication
    - Delete entry from database
    - Return confirmation
    - _Requirements: 4.1, 4.2, 4.3, 4.4_

  - [x] 11.4 Create POST /api/validate-slug endpoint
    - Check slug uniqueness in database
    - Support excluding specific entry ID
    - _Requirements: 10.4_

- [ ] 12. Backend checkpoint

  - Verify all backend endpoints are working correctly

- [x] 13. Implement tag management functionality

  - [x] 13.1 Create tag autocomplete API logic

    - Query tags collection for partial matches
    - Return matching tags sorted by usage count
    - _Requirements: 9.1_

  - [x] 13.2 Implement tag creation and association logic

    - Create new tags when they don't exist
    - Update tag usage counts
    - Associate tags with entries
    - _Requirements: 9.2, 9.3_

  - [x] 13.3 Implement tag removal logic

    - Remove tag associations from entries
    - Update tag usage counts
    - _Requirements: 9.4_

- [x] 14. Implement public layout and components

  - [x] 14.1 Create PublicLayout component

    - Implement header with navigation
    - Implement footer
    - _Requirements: 5.2_

  - [x] 14.2 Create EntryCard component

    - Display entry data based on type
    - Show tags
    - _Requirements: 5.4_

  - [x] 14.3 Create TagFilter component

    - Display available tags
    - Handle tag selection
    - Show active filters
    - _Requirements: 8.1, 8.4_

  - [x] 14.4 Create LoadingSpinner and EndOfList components
    - Loading indicator for progressive loading
    - End of list indicator
    - _Requirements: 13.4, 13.5_

- [x] 15. Implement word browsing interface

  - [x] 15.1 Create WordBrowser component

    - Fetch and display words alphabetically
    - Implement letter grouping
    - _Requirements: 6.1, 6.2_

  - [x] 15.2 Create AlphabetNav component

    - Display letter navigation
    - Handle letter selection
    - _Requirements: 6.3_

  - [x] 15.3 Implement infinite scroll for words
    - Integrate InfiniteScroll wrapper
    - Load additional words on scroll
    - _Requirements: 13.1, 13.2, 13.3_

- [x] 16. Implement phrase browsing interface

  - [x] 16.1 Create PhraseBrowser component
    - Fetch and display phrases alphabetically
    - Integrate tag filtering
    - Implement infinite scroll
    - _Requirements: 6.4, 13.1, 13.2, 13.3_

- [x] 17. Implement quote browsing interface

  - [x] 17.1 Create AuthorImage component

    - Fetch author images from external API
    - Implement caching logic
    - Display fallback image on error
    - _Requirements: 12.1, 12.2, 12.3, 12.4_

  - [x] 17.2 Create QuoteCard component

    - Display quote with author image
    - Show author name and source
    - _Requirements: 12.2_

  - [x] 17.3 Create QuoteBrowser component
    - Fetch and display quotes sorted by author
    - Integrate tag filtering
    - Implement infinite scroll
    - _Requirements: 6.5, 13.1, 13.2, 13.3_

- [x] 18. Implement hypothetical browsing interface

  - [x] 18.1 Create HypotheticalBrowser component
    - Fetch and display hypotheticals
    - Integrate tag filtering
    - Implement infinite scroll
    - _Requirements: 6.6, 13.1, 13.2, 13.3_

- [ ] 19. Implement search interface

  - [x] 19.1 Create SearchBar component

    - Implement search input
    - Add entry type filter dropdown
    - Add tag filter selection
    - _Requirements: 7.1, 7.2, 7.3_

  - [x] 19.2 Create SearchResults component

    - Display search results
    - Show relevance indicators
    - Handle empty results
    - Implement infinite scroll
    - _Requirements: 7.4, 7.5, 7.6_

  - [x] 19.3 Create FilterPanel component
    - Display active filters
    - Allow filter clearing
    - _Requirements: 8.4_

- [x] 20. Implement admin authentication

  - [x] 20.1 Create LoginForm component

    - Implement credential inputs
    - Handle form submission
    - Display error messages
    - Store JWT token in localStorage
    - _Requirements: 1.1, 1.3, 1.4_

  - [x] 20.2 Create AuthGuard HOC

    - Check for valid JWT token
    - Redirect to login if not authenticated
    - Handle token expiration
    - _Requirements: 1.5, 11.1_

  - [x] 20.3 Create admin login page
    - Integrate LoginForm component
    - Handle successful login redirect
    - _Requirements: 1.1_

- [x] 21. Implement admin layout and navigation

  - [x] 21.1 Create AdminLayout component

    - Wrap with AuthGuard
    - Implement admin header with logout
    - _Requirements: 2.8_

  - [x] 21.2 Create AdminNav component

    - Navigation links to create/list entries
    - _Requirements: 2.10_

  - [x] 21.3 Create EntryList component
    - Display entries with edit/delete buttons
    - Implement EditButton component
    - _Requirements: 2.10, 4.1_

- [ ] 22. Implement entry form components

  - [x] 22.1 Create SlugInput component

    - Auto-generate slug from name/body
    - Allow manual editing
    - Validate uniqueness on blur
    - _Requirements: 10.1, 10.2, 10.3, 10.4, 10.5, 10.6_

  - [x] 22.2 Create TagInput component using react-select

    - Implement autocomplete with existing tags
    - Allow creating new tags
    - Display selected tags with remove option
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

  - [x] 22.3 Create WordForm component

    - Implement fields: name, slug, definition, partOfSpeech, etymology, notes, tags
    - Integrate SlugInput and TagInput
    - Handle form validation
    - _Requirements: 2.2_

  - [x] 22.4 Create PhraseForm component

    - Implement fields: name, slug, definition, source, notes, tags
    - Integrate SlugInput and TagInput
    - Handle form validation
    - _Requirements: 2.3_

  - [x] 22.5 Create QuoteForm component

    - Implement fields: name, slug, body, author, source, notes, tags
    - Integrate SlugInput and TagInput
    - Handle form validation
    - _Requirements: 2.4_

  - [x] 22.6 Create HypotheticalForm component

    - Implement fields: slug, body, source, notes, tags
    - Integrate SlugInput and TagInput
    - Handle form validation
    - _Requirements: 2.5_

  - [x] 22.7 Create EntryForm wrapper component
    - Dynamically render appropriate form based on entry type
    - Handle form submission to API
    - Display validation errors
    - _Requirements: 2.1, 2.7, 2.9_

- [x] 23. Implement admin create entry page

  - [x] 23.1 Create entry type selection page

    - Display buttons for each entry type
    - Navigate to appropriate form
    - _Requirements: 2.1_

  - [x] 23.2 Create entry creation pages for each type
    - Integrate EntryForm component
    - Handle successful creation redirect
    - _Requirements: 2.6, 2.7_

- [x] 24. Implement admin edit entry page

  - [x] 24.1 Create edit entry page
    - Fetch existing entry data
    - Pre-populate EntryForm
    - Handle update submission
    - Display success/error messages
    - _Requirements: 3.1, 3.2, 3.3, 3.5_

- [x] 25. Implement admin delete functionality

  - [x] 25.1 Add delete confirmation modal
    - Confirm before deletion
    - Call delete API endpoint
    - Handle success/error
    - Redirect after deletion
    - _Requirements: 4.1, 4.2, 4.3_

- [x] 26. Frontend checkpoint

  - Verify all frontend components are working correctly

- [ ] 27. Configure deployment

  - [ ] 27.1 Create netlify.toml configuration

    - Configure build settings
    - Configure function directory
    - Configure redirects
    - _Requirements: 14.4_

  - [ ] 27.2 Set up environment variables in Netlify

    - Add MONGODB_URI
    - Add JWT_SECRET
    - Add AUTHOR_IMAGE_API_URL
    - _Requirements: 14.4_

  - [ ] 27.3 Create deployment documentation
    - Document environment variable setup
    - Document deployment process
    - _Requirements: 14.4_

- [ ] 28. Final testing and polish

  - [ ] 28.1 Perform manual testing

    - Test all user flows in public interface
    - Test all admin flows
    - Test error handling
    - Test on different browsers

  - [ ] 28.2 Performance optimization
    - Verify progressive loading works correctly
    - Check image caching
    - Optimize bundle sizes
    - _Requirements: 13.1, 13.2, 13.3_
