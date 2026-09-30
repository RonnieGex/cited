"use client";

import { useCallback, useEffect, useRef, useState, type RefObject } from "react";

// Decision 33 of `openspec/changes/brand-identity-ui/design.md` (findings 10 and 61): a box that scrolls sideways has to be a
// tab stop, and a box that does not scroll must not be one, or the keyboard meets an empty stop on every visit. The box is
// measured after each render (its content changes its width) and whenever its own size changes.

export function useOverflowing<T extends HTMLElement>(): readonly [RefObject<T | null>, boolean] {
  const ref = useRef<T | null>(null);
  const [overflowing, setOverflowing] = useState(false);
  const measure = useCallback((): void => {
    const node = ref.current;

    if (node !== null) {
      setOverflowing(node.scrollWidth > node.clientWidth);
    }
  }, []);

  useEffect(() => {
    measure();
  });

  useEffect(() => {
    const node = ref.current;
    const observer = typeof ResizeObserver === "undefined" || node === null ? null : new ResizeObserver(measure);

    if (node !== null) {
      observer?.observe(node);
    }

    window.addEventListener("resize", measure);

    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, [measure]);

  return [ref, overflowing] as const;
}
