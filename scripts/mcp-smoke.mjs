/**
 * The manual verification of the MCP endpoint against a live server: initialize, tools/list, cited_search and the
 * refusal of cited_ask, printed as they arrive. It is the script the delivery shows.
 *
 * Usage:
 *   node scripts/mcp-smoke.mjs --url http://127.0.0.1:3230/api/mcp --token <token> [--query "<query>"]
 *
 * The URL and the token may also come from CITED_MCP_URL and CITED_MCP_TOKEN.
 */

const args = process.argv.slice(2);
const options = { url: process.env.CITED_MCP_URL ?? "", token: process.env.CITED_MCP_TOKEN ?? "", query: "" };

for (let index = 0; index < args.length; index += 1) {
  const name = args[index];
  const value = args[index + 1] ?? "";

  if (name === "--url") options.url = value;
  if (name === "--token") options.token = value;
  if (name === "--query") options.query = value;
  if (name.startsWith("--")) index += 1;
}

if (options.url.length === 0) {
  options.url = "http://127.0.0.1:3230/api/mcp";
}

if (options.query.length === 0) {
  options.query = "afinación de bicicleta";
}

let nextId = 1;

async function call(method, params) {
  const response = await fetch(options.url, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      ...(options.token.length === 0 ? {} : { authorization: `Bearer ${options.token}` }),
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: nextId, method, ...(params === undefined ? {} : { params }) }),
  });
  nextId += 1;

  const text = await response.text();

  return { status: response.status, body: text.length === 0 ? null : JSON.parse(text) };
}

function print(label, value) {
  console.log(`\n== ${label} ==`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
}

const failures = [];

const initialized = await call("initialize", {
  protocolVersion: "2025-06-18",
  capabilities: {},
  clientInfo: { name: "cited-smoke", version: "0.1.0" },
});

print("initialize", initialized.body ?? initialized.status);

if (initialized.status !== 200 || initialized.body?.result?.serverInfo?.name !== "cited") {
  failures.push("initialize did not answer the server information of cited");
}

const listed = await call("tools/list");

print("tools/list", listed.body?.result?.tools?.map((tool) => tool.name) ?? listed.status);

if (JSON.stringify(listed.body?.result?.tools?.map((tool) => tool.name)) !== '["cited_search","cited_ask"]') {
  failures.push("tools/list did not answer exactly cited_search and cited_ask");
}

const searched = await call("tools/call", { name: "cited_search", arguments: { query: options.query } });
const passages = searched.body?.result?.structuredContent?.passages ?? [];

print("cited_search", passages.map((passage) => `${passage.n}. ${passage.document} — ${passage.excerpt.slice(0, 80)}`));

if (searched.body?.result?.isError === true || passages.length === 0) {
  failures.push("cited_search answered no passage");
}

const asked = await call("tools/call", { name: "cited_ask", arguments: { question: options.query } });
const askedText = asked.body?.result?.content?.[0]?.text ?? "";

print("cited_ask", asked.body?.result?.structuredContent ?? askedText);

if (asked.body?.result?.isError !== true && asked.body?.result?.structuredContent === undefined) {
  failures.push("cited_ask answered neither an answer nor a refusal");
}

if (failures.length > 0) {
  console.error(`\nSMOKE: RED\n- ${failures.join("\n- ")}`);
  process.exit(1);
}

console.log("\nSMOKE: GREEN");
