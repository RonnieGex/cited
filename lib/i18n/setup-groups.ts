import type { Lang } from "../settings/business.ts";

// Decision 29 of `openspec/changes/brand-identity-ui/design.md`: the groups of the page "For the installer" take their title
// and their detail from this table, keyed by the group id of the template (`groupId` in `lib/admin/setup.ts`, the slug of the
// first sentence of the comment in `.env.example`), and never from the English text of the template. A group of the template
// that has no entry here fails `tests/brand-round-14c-panel.test.tsx`, so a new group cannot reach the Spanish panel in English.
// A name of a variable in a detail is the diagnostic of whoever installs: this page is the one place that may name it.

export type SetupGroupText = { title: string; detail: string };

export const SETUP_GROUPS: Record<Lang, Record<string, SetupGroupText>> = {
  en: {
    required: {
      title: "Required",
      detail:
        "The three secrets the server needs before the panel and the voice agent work: the password of the panel (at least 16 characters), the secret that signs the session and the secret of the voice tool.",
    },
    "the-keys-the-owner-saves-in-the-panel": {
      title: "The keys the owner saves in the panel",
      detail:
        "ENCRYPTION_KEY encrypts the keys saved in the panel: 32 bytes in base64. Without it the panel stores no key and says why. Changing it leaves the saved keys unreadable, and the panel asks for them again. PROVIDER_TEST_TIMEOUT_MS is how long the test of a provider waits (10000 ms by default).",
    },
    "model-providers": {
      title: "Model providers",
      detail: "Fill the one you use; the rest can stay empty.",
    },
    "the-address-of-a-provider": {
      title: "The address of a provider",
      detail:
        "Optional. Point a provider at a compatible endpoint of your own (a gateway, a proxy, a server on the same machine). An empty value keeps the address the provider publishes.",
    },
    "the-address-of-a-provider-that-runs-on-this-machine": {
      title: "The address of a provider that runs on this machine",
      detail:
        "Ollama, LM Studio or a custom endpoint. Only over https and never inside the private network, unless ALLOW_LOCAL_PROVIDERS=1 lifts that last rule.",
    },
    "the-chat-provider-of-the-answers": {
      title: "The chat provider of the answers",
      detail:
        "CHAT_PROVIDER picks the model that writes the answers. Each provider needs the key above with its name, except Ollama and LM Studio (local) and fake (offline, for tests).",
    },
    "model-and-embedding-selection": {
      title: "Model and embedding selection",
      detail: "CHAT_MODEL is optional: without it the provider uses its own default model.",
    },
    "embeddings-of-the-knowledge-search": {
      title: "Embeddings of the knowledge search",
      detail:
        "EMBEDDINGS_PROVIDER is one of openai, ollama or fake. openai is any OpenAI-compatible embeddings API and needs a base URL, a model and a key.",
    },
    database: {
      title: "Database",
      detail: "A local file, or Turso in the cloud with the same code. TURSO_AUTH_TOKEN is required when the address is remote.",
    },
    "elevenlabs-voice-agent": {
      title: "ElevenLabs voice agent",
      detail:
        "Optional; the app works without it. The key needs the permissions ElevenAgents (write), Voices (read) and User (access).",
    },
    "spending-limits-and-abuse-protection": {
      title: "Spending limits and abuse protection",
      detail:
        "Limits per question, per address and per day. An empty, zero, negative or non-integer value keeps its default.",
    },
    privacy: {
      title: "Privacy",
      detail: "CONVERSATION_RETENTION_DAYS is 30 by default: the turns older than that are purged.",
    },
    "the-links-and-the-offer-of-the-panel": {
      title: "The links and the offer of the panel",
      detail:
        "AFFILIATE_LINKS=off turns every affiliate link into its plain link. HOSTED_OFFER_URL is the address of the hosted version of Katalis that the panel offers.",
    },
    "the-address-of-the-visitor": {
      title: "The address of the visitor",
      detail:
        "TRUST_PROXY is the number of proxies in front of the application. Without it the forwarding headers are ignored and every direct visitor shares one bucket. The address is stored only as a salted hash.",
    },
    "allowed-origins-for-the-embeddable-widget-comma-separated": {
      title: "Allowed origins for the embeddable widget",
      detail: "The sites that may embed the widget, comma separated.",
    },
  },
  es: {
    required: {
      title: "Obligatorios",
      detail:
        "Los tres secretos que el servidor necesita para que funcionen el panel y el agente de voz: la contraseña del panel (al menos 16 caracteres), el secreto que firma la sesión y el de la herramienta de voz.",
    },
    "the-keys-the-owner-saves-in-the-panel": {
      title: "Las llaves que se guardan en el panel",
      detail:
        "ENCRYPTION_KEY cifra las llaves guardadas en el panel: 32 bytes en base64. Sin ella el panel no guarda ninguna llave y dice por qué. Si la cambias, las llaves ya guardadas dejan de poder leerse y el panel las pide de nuevo. PROVIDER_TEST_TIMEOUT_MS es lo que espera la prueba de un proveedor (10000 ms por defecto).",
    },
    "model-providers": {
      title: "Proveedores de modelos",
      detail: "Rellena el que uses; los demás pueden quedar vacíos.",
    },
    "the-address-of-a-provider": {
      title: "La dirección de un proveedor",
      detail:
        "Opcional. Apunta un proveedor a un servicio compatible tuyo (una pasarela, un proxy, un servidor de la misma máquina). Un valor vacío conserva la dirección que publica el proveedor.",
    },
    "the-address-of-a-provider-that-runs-on-this-machine": {
      title: "La dirección de un proveedor que corre en esta máquina",
      detail:
        "Ollama, LM Studio o un servicio propio. Solo por https y nunca dentro de la red privada, salvo que ALLOW_LOCAL_PROVIDERS=1 levante esa última regla.",
    },
    "the-chat-provider-of-the-answers": {
      title: "El proveedor de chat de las respuestas",
      detail:
        "CHAT_PROVIDER elige el modelo que escribe las respuestas. Cada proveedor necesita la llave de arriba con su nombre, salvo Ollama y LM Studio (locales) y fake (sin conexión, para pruebas).",
    },
    "model-and-embedding-selection": {
      title: "Elección de modelo y de embeddings",
      detail: "CHAT_MODEL es opcional: sin él, el proveedor usa su modelo por defecto.",
    },
    "embeddings-of-the-knowledge-search": {
      title: "Embeddings de la búsqueda de conocimiento",
      detail:
        "EMBEDDINGS_PROVIDER es openai, ollama o fake. openai es cualquier API de embeddings compatible con OpenAI y necesita dirección, modelo y llave.",
    },
    database: {
      title: "Base de datos",
      detail:
        "Un archivo local, o Turso en la nube con el mismo código. TURSO_AUTH_TOKEN es obligatorio cuando la dirección es remota.",
    },
    "elevenlabs-voice-agent": {
      title: "Agente de voz de ElevenLabs",
      detail:
        "Opcional; la aplicación funciona sin él. La llave necesita los permisos ElevenAgents (escritura), Voices (lectura) y User (acceso).",
    },
    "spending-limits-and-abuse-protection": {
      title: "Límites de gasto y protección contra abuso",
      detail:
        "Límites por pregunta, por dirección y por día. Un valor vacío, cero, negativo o no entero conserva su valor por defecto.",
    },
    privacy: {
      title: "Privacidad",
      detail: "CONVERSATION_RETENTION_DAYS es 30 por defecto: las conversaciones más viejas se borran.",
    },
    "the-links-and-the-offer-of-the-panel": {
      title: "Los enlaces y la oferta del panel",
      detail:
        "AFFILIATE_LINKS=off convierte todo enlace de afiliado en su enlace normal. HOSTED_OFFER_URL es la dirección de la versión alojada de Katalis que ofrece el panel.",
    },
    "the-address-of-the-visitor": {
      title: "La dirección del visitante",
      detail:
        "TRUST_PROXY es el número de proxies delante de la aplicación. Sin él se ignoran las cabeceras de reenvío y todo visitante directo comparte un mismo cubo. La dirección solo se guarda como hash con sal.",
    },
    "allowed-origins-for-the-embeddable-widget-comma-separated": {
      title: "Orígenes permitidos para el widget incrustable",
      detail: "Los sitios que pueden incrustar el widget, separados por comas.",
    },
  },
};
