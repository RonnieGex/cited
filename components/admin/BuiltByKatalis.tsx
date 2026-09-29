import Image from "next/image";

// The foot of the ink surfaces of the panel (decision 7 of `openspec/changes/brand-identity-ui/design.md`): the silver
// flame, the original made for dark grounds, beside who built the product. The flame is decorative here (the words next to
// it say the same), and the text is `text-paper/70`, 9:1 over ink.

export type BuiltByKatalisProps = {
  label: string;
  className?: string;
};

export function BuiltByKatalis({ label, className = "" }: BuiltByKatalisProps) {
  return (
    <p className={`flex items-center gap-2 text-xs text-paper/70 ${className}`}>
      <Image src="/brand/katalis-flame-64.png" alt="" width={64} height={64} unoptimized className="h-5 w-auto" />
      <span>{label}</span>
    </p>
  );
}
