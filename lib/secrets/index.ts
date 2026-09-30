import { createCipheriv, createDecipheriv, randomBytes } from "node:crypto";

// Decision 1 of `openspec/changes/provider-keys-in-panel/design.md`: a key of the owner is encrypted with AES-256-GCM
// under `ENCRYPTION_KEY` (32 bytes in base64), with a fresh 12-byte nonce for every value, and the stored value is
// `v1:<nonce>:<ciphertext>:<tag>`. Without a valid key nothing is stored and nothing falls back to plaintext.

export const ENCRYPTION_KEY_VARIABLE = "ENCRYPTION_KEY";
export const SECRET_VERSION = "v1";

const keyBytes = 32;
const nonceBytes = 12;
const tagBytes = 16;

export type SecretEnvironment = Record<string, string | undefined>;
export type SecretReason = "no_key" | "bad_key" | "corrupt";
export type SealResult = { ok: true; value: string } | { ok: false; reason: SecretReason };
export type OpenResult = { ok: true; value: string } | { ok: false; reason: SecretReason };

type KeyResult = { ok: true; key: Buffer } | { ok: false; reason: "no_key" | "bad_key" };

function encryptionKey(environment: SecretEnvironment): KeyResult {
  const declared = environment[ENCRYPTION_KEY_VARIABLE]?.trim() ?? "";

  if (declared.length === 0) {
    return { ok: false, reason: "no_key" };
  }

  const key = Buffer.from(declared, "base64");

  return key.length === keyBytes ? { ok: true, key } : { ok: false, reason: "bad_key" };
}

export function encryptionAvailable(environment: SecretEnvironment = process.env): boolean {
  return encryptionKey(environment).ok;
}

export function sealSecret(
  plain: string,
  environment: SecretEnvironment = process.env,
): SealResult {
  const found = encryptionKey(environment);

  if (found.ok === false) {
    return found;
  }

  const nonce = randomBytes(nonceBytes);
  const cipher = createCipheriv("aes-256-gcm", found.key, nonce);
  const ciphertext = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  return {
    ok: true,
    value: [
      SECRET_VERSION,
      nonce.toString("base64"),
      ciphertext.toString("base64"),
      tag.toString("base64"),
    ].join(":"),
  };
}

export function openSecret(
  sealed: string,
  environment: SecretEnvironment = process.env,
): OpenResult {
  const found = encryptionKey(environment);

  if (found.ok === false) {
    return found;
  }

  const parts = sealed.split(":");

  if (parts.length !== 4 || parts[0] !== SECRET_VERSION) {
    return { ok: false, reason: "corrupt" };
  }

  const nonce = Buffer.from(parts[1] ?? "", "base64");
  const ciphertext = Buffer.from(parts[2] ?? "", "base64");
  const tag = Buffer.from(parts[3] ?? "", "base64");

  if (nonce.length !== nonceBytes || tag.length !== tagBytes) {
    return { ok: false, reason: "corrupt" };
  }

  try {
    const decipher = createDecipheriv("aes-256-gcm", found.key, nonce);

    decipher.setAuthTag(tag);

    return {
      ok: true,
      value: Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString("utf8"),
    };
  } catch {
    return { ok: false, reason: "corrupt" };
  }
}

export function lastFour(value: string): string {
  return value.trim().slice(-4);
}
