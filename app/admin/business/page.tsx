import { redirect } from "next/navigation";

// Decision 11: the old page "Business" is "Look and publish" now (`/admin/publish`), which is the fourth step of the
// guided setup as a page. The address of the old page keeps working so a link somebody saved still lands where the
// business is edited.

export default function AdminBusinessMoved(): never {
  redirect("/admin/publish");
}
