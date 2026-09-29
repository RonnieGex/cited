## MODIFIED Requirements

### Requirement: Home page

The application SHALL render one page that shows the product name `Cited` and nothing else.
The page SHALL live in `app/page.tsx` and SHALL carry no design system: that arrives in change 1.

#### Scenario: The page names the product

- **WHEN** the application serves `GET /`
- **THEN** the response is 200 and its HTML carries the text `Cited`

#### Scenario: The page carries nothing else

- **WHEN** `app/page.tsx` is read
- **THEN** it renders one `main` element with one `h1` heading and no other content
