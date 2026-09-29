// Decision 10 of `openspec/changes/brand-identity-ui/design.md`: a refusal and a failure carry a square of the shape of a
// citation mark instead of a side stripe. The ink square with an en dash says "no source here"; the coral one marks a
// request that failed. Both are decoration, the words beside them carry the meaning.

const shape =
  "inline-grid h-[1.3em] min-w-[1.5em] place-items-center rounded-none px-[0.3em] text-[0.72em] font-bold leading-none";

const tones = {
  ink: "bg-ink text-lime",
  coral: "bg-coral text-ink",
} as const;

export type MarkerProps = {
  tone: keyof typeof tones;
  glyph: string;
};

export function Marker({ tone, glyph }: MarkerProps) {
  return (
    <span aria-hidden="true" className="mt-[0.35em] flex shrink-0 text-[18px] leading-none">
      <span data-marker={tone} className={`${shape} ${tones[tone]}`}>
        {glyph}
      </span>
    </span>
  );
}
