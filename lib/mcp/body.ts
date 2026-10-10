const MAX_BODY_BYTES = 1024 * 1024;
const READ_TIMEOUT_MS = 10_000;

export class BodyLimitError extends Error {
  readonly status: 408 | 413;

  constructor(status: 408 | 413) {
    super(status === 413 ? "request body too large" : "request body read timed out");
    this.status = status;
  }
}

export async function readMcpBody(request: Request): Promise<unknown> {
  const declaredLength = request.headers.get("content-length");

  if (declaredLength !== null && Number(declaredLength) > MAX_BODY_BYTES) {
    throw new BodyLimitError(413);
  }

  if (request.body === null) {
    throw new SyntaxError("empty body");
  }

  const reader = request.body.getReader();
  const deadline = performance.now() + READ_TIMEOUT_MS;
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new BodyLimitError(408)), READ_TIMEOUT_MS);
  });
  const chunks: Uint8Array[] = [];
  let bytes = 0;

  try {
    while (true) {
      if (performance.now() >= deadline) {
        throw new BodyLimitError(408);
      }

      const chunk = await Promise.race([reader.read(), timeout]);

      if (performance.now() >= deadline) {
        throw new BodyLimitError(408);
      }

      if (chunk.done) {
        break;
      }

      bytes += chunk.value.byteLength;

      if (bytes > MAX_BODY_BYTES) {
        throw new BodyLimitError(413);
      }

      chunks.push(chunk.value);
    }

    return JSON.parse(new TextDecoder().decode(Buffer.concat(chunks, bytes))) as unknown;
  } catch (error) {
    void reader.cancel().catch(() => {});
    throw error;
  } finally {
    clearTimeout(timer);
    reader.releaseLock();
  }
}
