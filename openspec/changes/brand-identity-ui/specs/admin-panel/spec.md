## ADDED Requirements

### Requirement: The panel is a workspace with the identity

The panel SHALL show an ink side navigation from 1024 px with the wordmark, every section numbered with a citation
mark, the current section marked with `aria-current="page"` and the lime mark, the language switch, the sign-out and
"Built by Katalis" with the flame at its foot; below 1024 px the same navigation SHALL become an ink top bar that
scrolls sideways; the sign-in SHALL be a split screen with the wordmark and the tagline on ink and the form on paper.

#### Scenario: The navigation at 1440 px

- **WHEN** `/admin/documents` is opened signed in at 1440 px
- **THEN** the link of Documents carries `aria-current="page"`, its mark reads 3, the navigation sits in an ink column
  on the left, and every text of the column reaches 4.5:1 over ink

#### Scenario: The navigation at 375 px

- **WHEN** the same page is opened at 375 px
- **THEN** the navigation is a top bar, every link is reachable by scrolling it sideways, and no horizontal scroll
  appears on the page itself

#### Scenario: The sign-in

- **WHEN** `/admin` is opened signed out in Spanish
- **THEN** the tagline `Cada respuesta enseña de dónde salió.` is visible with its last words highlighted, the form
  keeps its label, its button and its messages, and the page passes axe at level AA
