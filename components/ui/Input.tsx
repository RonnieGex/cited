import type { InputHTMLAttributes } from "react";
import { focusRing } from "./focus";

export type InputProps = InputHTMLAttributes<HTMLInputElement>;

// A text field is a block of `px-5 py-4`. A file field has the native button of the picker inside it: the button is
// dressed as the primary button of the kit (ink, paper text, square, uppercase) and the field keeps 44 px of height.
const box = "px-5 py-4";
const fileBox =
  "min-h-11 p-2 text-sm file:mr-4 file:cursor-pointer file:rounded-none file:border-0 file:bg-ink file:px-4 file:py-2 file:text-sm file:font-bold file:uppercase file:tracking-[0.05em] file:text-paper hover:file:bg-surface-dark";

export function Input({ className = "", type, ...rest }: InputProps) {
  return (
    <input
      {...rest}
      type={type}
      className={`w-full rounded-none border border-border bg-paper ${type === "file" ? fileBox : box} text-ink placeholder:text-ink/60 ${focusRing} ${className}`}
    />
  );
}
