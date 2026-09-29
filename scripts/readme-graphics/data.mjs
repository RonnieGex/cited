export const ink = "#171717";
export const lime = "#DDF469";
export const offWhite = "#F7F6F2";

export const tokens = {
  ink,
  lime,
  offWhite,
};

export const states = {
  Available: "Available",
  Planned: "Next",
};

export const plannedChanges = [
  "design-system-shared",
  "pluggable-models-and-ask",
  "admin-and-public-ui",
  "elevenlabs-voice-agent",
  "security-hardening",
  "docs-deploy-and-launch",
];

export const statusRows = [
  {
    capability: "Ingestion of PDF, DOCX, Markdown and text with limits",
    state: "Available",
    reference: "openspec/specs/knowledge-search/spec.md",
  },
  {
    capability: "Hybrid search: full text and vectors, fused with Reciprocal Rank Fusion",
    state: "Available",
    reference: "openspec/specs/knowledge-search/spec.md",
  },
  {
    capability: "Embeddings through an OpenAI-compatible API or Ollama",
    state: "Available",
    reference: "openspec/specs/knowledge-search/spec.md",
  },
  {
    capability: "Local libSQL file or Turso",
    state: "Available",
    reference: "openspec/specs/knowledge-search/spec.md",
  },
  {
    capability: "Answers with citations from any model provider, spend limits",
    state: "Planned",
    reference: "pluggable-models-and-ask",
  },
  {
    capability: "Admin panel, public page and widget in Spanish and English",
    state: "Planned",
    reference: "admin-and-public-ui",
  },
  {
    capability: "Voice agent with ElevenLabs, created in one click",
    state: "Planned",
    reference: "elevenlabs-voice-agent",
  },
  {
    capability: "Shared design system",
    state: "Planned",
    reference: "design-system-shared",
  },
  {
    capability: "Security hardening and abuse tests",
    state: "Planned",
    reference: "security-hardening",
  },
  {
    capability: "One-click deploys, Docker image and bilingual docs",
    state: "Planned",
    reference: "docs-deploy-and-launch",
  },
];

export const roadmap = statusRows.map((row) => ({
  capability: row.capability,
  state: row.state,
  reference: row.reference,
}));
