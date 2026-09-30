"use client";

import { useEffect, useId, useRef, useState, type KeyboardEvent } from "react";
import { Button } from "@/components/ui";

// Decision 28 of `openspec/changes/brand-identity-ui/design.md`: a delete is irreversible, so it asks first, in place. The
// button swaps for a group with a sentence ("Delete README.txt?"), a primary Delete and a secondary Keep; the focus moves to
// Keep, Escape keeps, and nothing is sent until the second press. No modal, no drawer: the question opens where the action is.

export type ConfirmedDeleteProps = {
  /** The visible words of the first button. */
  label: string;
  /** Its accessible name when it needs the subject ("Delete README.txt"); the visible words otherwise. */
  name?: string;
  /** The question of the group: "Delete README.txt?". */
  sentence: string;
  confirmLabel: string;
  keepLabel: string;
  onConfirm: () => void | Promise<void>;
  size?: "sm" | "md";
  className?: string;
};

export function ConfirmedDelete({
  label,
  name,
  sentence,
  confirmLabel,
  keepLabel,
  onConfirm,
  size = "sm",
  className = "",
}: ConfirmedDeleteProps) {
  const id = useId();
  const firstId = `${id}-first`;
  const keepId = `${id}-keep`;
  const [asking, setAsking] = useState(false);
  /** The question was closed by the reader: the focus goes back to the button that opened it. */
  const restore = useRef(false);

  useEffect(() => {
    if (asking) {
      document.getElementById(keepId)?.focus();
    } else if (restore.current) {
      restore.current = false;
      document.getElementById(firstId)?.focus();
    }
  }, [asking, firstId, keepId]);

  const keep = (): void => {
    restore.current = true;
    setAsking(false);
  };

  if (!asking) {
    return (
      <Button
        id={firstId}
        aria-label={name}
        className={`whitespace-nowrap ${className}`}
        onClick={() => {
          setAsking(true);
        }}
        size={size}
        variant="secondary"
      >
        {label}
      </Button>
    );
  }

  const onKeyDown = (event: KeyboardEvent<HTMLDivElement>): void => {
    if (event.key === "Escape") {
      event.preventDefault();
      keep();
    }
  };

  return (
    <div
      aria-label={sentence}
      className={`flex flex-wrap items-center gap-3 ${className}`}
      onKeyDown={onKeyDown}
      role="group"
    >
      <span className="text-sm font-semibold text-ink">{sentence}</span>
      <Button
        className="whitespace-nowrap"
        onClick={() => {
          // The focus goes back to the first button while the request runs; if the row leaves with the delete, it leaves too.
          restore.current = true;
          setAsking(false);
          void onConfirm();
        }}
        size={size}
        variant="primary"
      >
        {confirmLabel}
      </Button>
      <Button className="whitespace-nowrap" id={keepId} onClick={keep} size={size} variant="secondary">
        {keepLabel}
      </Button>
    </div>
  );
}
