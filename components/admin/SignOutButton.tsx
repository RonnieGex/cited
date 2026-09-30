"use client";

import { Button } from "@/components/ui";
import type { AdminStrings } from "@/lib/i18n/admin";

export type SignOutButtonProps = {
  strings: AdminStrings;
};

export function SignOutButton({ strings }: SignOutButtonProps) {
  async function signOut(): Promise<void> {
    await fetch("/api/admin/logout", { method: "POST" });
    window.location.reload();
  }

  return (
    <Button variant="ghost" size="sm" onClick={signOut}>
      {strings.signOut}
    </Button>
  );
}
