import { request as httpRequest, type ClientRequest, type IncomingMessage } from "node:http";
import { request as httpsRequest } from "node:https";
import { isIP } from "node:net";
import { providerAddress, type AddressResolver, type ProviderAddressResult } from "./address.ts";
import type { CatalogueKind } from "./catalog.ts";

// Requirement "The address that was validated is the address that is connected to" of
// `specs/provider-settings/spec.md`, and the Major M-2 of `katalis-dev/tasks/revision-community-12b.md`: the guard of
// `lib/providers/address.ts` resolved a name and judged the answer, and then `fetch` resolved the same name again, so
// a DNS that answered a public address to the guard and `127.0.0.1` to the connection took the customer key to a
// service of the machine. The reproduction of the review reached a local TLS double with the key in the header.
//
// This module is the transport that closes it, without a dependency: `node:http` and `node:https` with a `lookup`
// that returns the address the guard classified, so the socket never asks the DNS anything. The URL, the `Host`
// header and `servername` keep the name of the host, which is what the certificate has to match; a redirect is never
// followed, because an address nobody classified is exactly what the guard exists for.

type Target = { address: string; family: number };

function familyOf(address: string): number {
  const family = isIP(address);

  return family === 0 ? 4 : family;
}

function targetsOf(addresses: string[]): Target[] {
  return addresses.map((address) => ({ address, family: familyOf(address) }));
}

function urlOf(input: RequestInfo | URL): URL {
  return new URL(typeof input === "string" ? input : input instanceof URL ? input.href : input.url);
}

function headersOf(init: RequestInit): Record<string, string> {
  const headers: Record<string, string> = {};

  new Headers(init.headers).forEach((value, name) => {
    headers[name] = value;
  });

  return headers;
}

async function bodyOf(init: RequestInit): Promise<Buffer | null> {
  const body = init.body;

  if (body === undefined || body === null) {
    return null;
  }

  if (typeof body === "string") {
    return Buffer.from(body, "utf8");
  }

  if (body instanceof Uint8Array) {
    return Buffer.from(body);
  }

  if (body instanceof ArrayBuffer) {
    return Buffer.from(body);
  }

  if (body instanceof URLSearchParams) {
    return Buffer.from(body.toString(), "utf8");
  }

  return Buffer.from(await new Response(body).arrayBuffer());
}

function answerOf(incoming: IncomingMessage, chunks: Buffer[]): Response {
  const status = incoming.statusCode ?? 502;

  // A response without a body is the only one `Response` accepts without one: 204 and 304 are the statuses a
  // provider may answer with an empty body.
  const empty = status === 204 || status === 304 || status < 200;
  const headers = new Headers();

  for (let index = 0; index + 1 < incoming.rawHeaders.length; index += 2) {
    headers.append(incoming.rawHeaders[index] as string, incoming.rawHeaders[index + 1] as string);
  }

  return new Response(empty ? null : Buffer.concat(chunks), {
    status,
    statusText: incoming.statusMessage ?? "",
    headers,
  });
}

// One request to one classified address. The `lookup` never asks the DNS: it answers the address of the target, which
// is the whole point of the module, so the socket makes one attempt at one address and the retry over the other
// answers of the same resolution lives in `pinnedFetch()`.
function attempt(url: URL, init: RequestInit, target: Target, body: Buffer | null): Promise<Response> {
  return new Promise<Response>((resolve, reject) => {
    const secure = url.protocol === "https:";
    const ask = secure ? httpsRequest : httpRequest;
    const host = url.hostname.startsWith("[") ? url.hostname.slice(1, -1) : url.hostname;
    const headers = headersOf(init);
    const signal = init.signal ?? undefined;

    // The name of the host travels in the header, whatever the address of the connection: a virtual host or a
    // certificate check reads it.
    headers["host"] = url.host;

    let request: ClientRequest;

    try {
      request = ask({
        protocol: url.protocol,
        hostname: host,
        port: url.port.length === 0 ? (secure ? 443 : 80) : Number(url.port),
        path: `${url.pathname}${url.search}`,
        method: (init.method ?? "GET").toUpperCase(),
        headers,
        // The socket asks this function for the address and never the DNS: it answers the target of this attempt and,
        // when Node asks for every answer of the name (Happy Eyeballs), the same single address.
        lookup: (_name, options, callback) => {
          if (typeof options === "object" && options !== null && options.all === true) {
            callback(null, [{ address: target.address, family: target.family }]);

            return;
          }

          callback(null, target.address, target.family);
        },
        // The TLS name is the name of the host and never the address: SNI and the certificate of the provider are
        // about the name the owner wrote, which is also what `fetch` would have used.
        ...(secure && isIP(host) === 0 ? { servername: host } : {}),
      });
    } catch (error) {
      reject(error);

      return;
    }

    const chunks: Buffer[] = [];

    const abort = (): void => {
      const reason = signal?.reason;

      request.destroy(reason instanceof Error ? reason : new Error("the request was aborted"));
    };

    if (signal !== undefined) {
      if (signal.aborted) {
        abort();

        return;
      }

      signal.addEventListener("abort", abort, { once: true });
    }

    request.on("response", (incoming) => {
      incoming.on("data", (chunk: Buffer) => chunks.push(chunk));
      incoming.on("end", () => resolve(answerOf(incoming, chunks)));
      incoming.on("error", reject);
    });

    request.on("error", reject);
    request.on("close", () => signal?.removeEventListener("abort", abort));

    if (body !== null) {
      request.write(body);
    }

    request.end();
  });
}

// A `fetch` that opens the connection to one of the addresses it is given and to no other one. They are the answers
// of the single resolution the guard made, so a second answer of the same name can never be reached; when the first
// address does not answer, the next one of that same set is tried and the DNS is not asked again.
export function pinnedFetch(addresses: string[]): typeof fetch {
  const targets = targetsOf(addresses);

  return async (input, init = {}) => {
    const url = urlOf(input);
    const body = await bodyOf(init);
    let last: unknown = new Error("the address of the provider is not allowed");

    for (const target of targets) {
      try {
        return await attempt(url, init, target, body);
      } catch (error) {
        last = error;

        if (init.signal?.aborted === true) {
          break;
        }
      }
    }

    throw last;
  };
}

export type PanelTransportInput = {
  baseUrl: string;
  provider: string;
  kind: CatalogueKind;
  environment?: Record<string, string | undefined>;
  resolve?: AddressResolver;
};

// The transport of an address the owner wrote in the panel: every request resolves the name once, classifies every
// answer with the rules of `lib/providers/address.ts` — the same rules the test and save routes apply, so a name that
// changed its answer since it was saved is refused here — and connects to one of the classified addresses. This is
// what the chat and embeddings clients of the panel receive as their `fetch`.
export function providerFetch(input: PanelTransportInput): typeof fetch {
  const validate = (url: URL): Promise<ProviderAddressResult> =>
    providerAddress({
      baseUrl: url.toString(),
      provider: input.provider,
      kind: input.kind,
      environment: input.environment ?? process.env,
      ...(input.resolve === undefined ? {} : { resolve: input.resolve }),
    });

  return async (request, init) => {
    const allowed = await validate(urlOf(request));

    if (allowed.ok === false) {
      throw new Error("the address of the provider is not allowed");
    }

    return pinnedFetch(allowed.addresses)(request, init);
  };
}
