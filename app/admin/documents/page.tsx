import { redirect } from "next/navigation";

// Decision 11 of `openspec/changes/guided-setup-and-knowledge/design.md`: the old page "Documents" is "Information"
// now (`/admin/information`), where the documents of the business are listed and each one opens as a page of its own.
// The address of the old page keeps working so a link somebody saved still lands where the documents are.

export default function AdminDocumentsMoved(): never {
  redirect("/admin/information");
}
