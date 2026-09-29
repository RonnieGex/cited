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
  "public-page-and-widget",
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
    capability: "Local libSQL or Turso, and embeddings by API or Ollama",
    state: "Available",
    reference: "openspec/specs/knowledge-search/spec.md",
  },
  {
    capability: "Answers with citations from any model provider, spend limits",
    state: "Available",
    reference: "openspec/specs/answering/spec.md",
  },
  {
    capability: "The keys of the AI in the panel, encrypted and tested before saving",
    state: "Available",
    reference: "openspec/specs/provider-settings/spec.md",
  },
  {
    capability: "The panel: the setup, the business, the documents and the conversations",
    state: "Available",
    reference: "openspec/specs/admin-panel/spec.md",
  },
  {
    capability: "Public chat of the business, with the widget any site can embed",
    state: "Available",
    reference: "openspec/specs/public-chat/spec.md",
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
    capability: "Deployed in one click, with a Docker image and bilingual docs",
    state: "Planned",
    reference: "docs-deploy-and-launch",
  },
];

export const roadmap = statusRows.map((row) => ({
  capability: row.capability,
  state: row.state,
  reference: row.reference,
}));
