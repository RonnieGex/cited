import type { HTMLAttributes, ReactNode } from "react";

const sizes = {
  h1: "text-4xl",
  h2: "text-2xl",
  h3: "text-lg",
} as const;

export type SectionTitleProps = HTMLAttributes<HTMLHeadingElement> & {
  level?: keyof typeof sizes;
  eyebrow?: string;
  children: ReactNode;
};

export function SectionTitle({
  level = "h2",
  eyebrow,
  className = "",
  children,
  ...rest
}: SectionTitleProps) {
  const Heading = level;

  return (
    <div {...rest} className={className}>
      {eyebrow === undefined ? null : (
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-ink-2">{eyebrow}</p>
      )}
      <Heading className={`font-bold tracking-[-0.02em] text-ink ${sizes[level]}`}>
        {children}
      </Heading>
    </div>
  );
}
