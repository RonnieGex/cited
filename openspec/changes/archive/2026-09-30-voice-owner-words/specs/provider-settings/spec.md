## MODIFIED Requirements

### Requirement: The owner never reads a variable name in an answer of the panel

The routes of the panel SHALL answer failures with a reason code and no text that names a variable of the environment;
the page SHALL map each code to a sentence in the owner's words, and for a setting that only the installer can change it
SHALL point to the page "For the installer", the only place where the variable may be named.

#### Scenario: Local providers turned off

- **WHEN** the owner tests Ollama at `127.0.0.1` and the server does not allow local providers
- **THEN** the response carries the code `address_not_allowed` and no variable name, and the page says in words that the
  installer must allow local providers and links "For the installer"

#### Scenario: An installation that is not finished

- **WHEN** `ADMIN_SESSION_SECRET` is missing, or `ADMIN_PASSWORD` has fewer than 16 characters, and any route of
  `/api/admin/*` or any page of `/admin` is requested
- **THEN** the route answers `503` with the code `panel_not_configured` or `admin_password_too_short` and no variable
  name, the page says in the owner's words that the person who installs Cited has to finish the installation, and the
  names of the missing variables reach only the server log and the page "For the installer"

#### Scenario: Voice that is not set up

- **WHEN** the owner presses the button of the voice screen and the key of ElevenLabs or the tool secret is missing
- **THEN** `POST /api/admin/voice` answers `503` with the code `voice_not_configured` and no variable name, the screen
  says in the owner's words that the installer turns voice on and links "For the installer", and the names reach only
  the server log

#### Scenario: A business without a name

- **WHEN** the owner presses the button of the voice screen, voice is set up, and the business has no name yet
- **THEN** `POST /api/admin/voice` answers `409` with the code `business_unnamed`, no request reaches ElevenLabs, and the
  screen says in the owner's words to give the business a name first and links the page "Business", never that
  ElevenLabs failed
