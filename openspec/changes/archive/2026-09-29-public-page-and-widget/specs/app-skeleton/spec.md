## MODIFIED Requirements

### Requirement: Home page

The application SHALL render at `/` the public chat of the business, with the name `Cited` shown when the business has
no name set yet. The page SHALL live in `app/page.tsx` and SHALL use the design system.

#### Scenario: The page names the product or the business

- **WHEN** the application serves `GET /` before any business setting exists
- **THEN** the response is 200 and its HTML carries the text `Cited`

#### Scenario: The page is the chat

- **WHEN** `app/page.tsx` is rendered
- **THEN** it renders one `main` element with one `h1` heading and the question box of the chat
