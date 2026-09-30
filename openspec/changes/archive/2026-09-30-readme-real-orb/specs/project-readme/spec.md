## ADDED Requirements

### Requirement: The voice teaser shows the real Orb

The teaser of the voice agent SHALL show the Orb of the panel as the panel draws it (`components/ui/orb.tsx`, the Orb of
ElevenLabs UI ported in this repository, in the colours of `ORB_COLORS`), captured from the running application with the
test SDK, and never a drawing of an orb.

#### Scenario: The teaser is rendered from a capture

- **WHEN** `scripts/render-readme-orb.mjs` captures the Orb and `node scripts/render-readme-graphics.mjs voice-teaser`
  renders the teaser
- **THEN** both `docs/images/voice-teaser-dark.png` and `docs/images/voice-teaser-light.png` lay
  `docs/images/voice/orb.png` on their ground, and `docs/images/voice/orb.json` records the component, the colours, the
  state of the agent and how the alpha was recovered

#### Scenario: A frame that still moves is refused

- **WHEN** the Orb has not stopped between the two shots of a frame
- **THEN** the capture stops with an error instead of combining two different frames into one image
