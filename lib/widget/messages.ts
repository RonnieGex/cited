// The protocol between `/embed` and the widget that frames it: design decision 4 of
// `openspec/changes/public-page-and-widget/design.md` and the requirement "The brand color is seen and the widget
// closes from inside" of `specs/public-chat/spec.md`.
//
// A key event that reaches the document of the iframe never reaches the document of the page that carries the widget,
// so `Escape` inside `/embed` travels as this message. The widget closes only when the message comes from its own
// origin and carries this shape, and `lib/widget/script.ts` inlines the same object because the built file has no
// imports.

export const EMBED_SOURCE = "cited-embed";
export const CLOSE_TYPE = "close";

export type EmbedMessage = {
  source: typeof EMBED_SOURCE;
  type: typeof CLOSE_TYPE;
};

export const CLOSE_MESSAGE: EmbedMessage = { source: EMBED_SOURCE, type: CLOSE_TYPE };
