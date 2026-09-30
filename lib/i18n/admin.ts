import type { Lang } from "../settings/business.ts";

export type AdminStrings = {
  panelEyebrow: string;
  navSetup: string;
  navBusiness: string;
  navDocuments: string;
  navConversations: string;
  signOut: string;
  tagline: string;
  builtBy: string;
  signInTitle: string;
  passwordLabel: string;
  signIn: string;
  wrongPassword: string;
  locked: string;
  unconfiguredTitle: string;
  unconfigured: string;
  setupTitle: string;
  setupIntro: string;
  configured: string;
  missing: string;
  testChat: string;
  testEmbeddings: string;
  businessTitle: string;
  businessIntro: string;
  businessName: string;
  businessColor: string;
  businessTone: string;
  businessLanguage: string;
  businessTopics: string;
  businessTopicsHint: string;
  welcomeEn: string;
  welcomeEs: string;
  logoLabel: string;
  logoHint: string;
  logoSet: string;
  logoMissing: string;
  uploadLogo: string;
  chooseLogo: string;
  saveBusiness: string;
  saved: string;
  saveFailed: string;
  logoSaved: string;
  logoFailed: string;
  englishLabel: string;
  spanishLabel: string;
  documentsTitle: string;
  documentsIntro: string;
  uploadDocument: string;
  upload: string;
  documentName: string;
  passages: string;
  actions: string;
  deleteDocument: string;
  reingestDocument: string;
  reingested: string;
  noDocuments: string;
  conversationsTitle: string;
  conversationsIntro: string;
  question: string;
  status: string;
  citations: string;
  when: string;
  answered: string;
  refused: string;
  deleteAll: string;
  deletedAll: string;
  noConversations: string;
};

export const ADMIN_STRINGS: Record<Lang, AdminStrings> = {
  en: {
    panelEyebrow: "Cited panel",
    navSetup: "Setup",
    navBusiness: "Business",
    navDocuments: "Documents",
    navConversations: "Conversations",
    signOut: "Sign out",
    tagline: "Every answer shows where it came from.",
    builtBy: "Built by Katalis",
    signInTitle: "Sign in to your panel",
    passwordLabel: "Password",
    signIn: "Sign in",
    wrongPassword: "That is not the password of the panel.",
    locked: "Too many failed attempts from this address. Try again in fifteen minutes.",
    unconfiguredTitle: "The panel cannot start",
    unconfigured: "The server needs {variables}. Fill the variable in the environment and start it again.",
    setupTitle: "Setup",
    setupIntro:
      "Every variable of the environment template, grouped by purpose. The panel shows whether each one is set and never its value.",
    configured: "Set",
    missing: "Missing",
    testChat: "Test the chat model",
    testEmbeddings: "Test the embeddings",
    businessTitle: "Business",
    businessIntro:
      "The name, the logo, the color, the tone and the words the assistant uses with the visitors.",
    businessName: "Business name",
    businessColor: "Primary color",
    businessTone: "Tone",
    businessLanguage: "Language",
    businessTopics: "Forbidden topics",
    businessTopicsHint: "One topic per line. A question about one of them is refused.",
    welcomeEn: "Welcome message in English",
    welcomeEs: "Welcome message in Spanish",
    logoLabel: "Logo",
    logoHint: "PNG, JPEG or WebP, 512 KB at most. An SVG is refused.",
    logoSet: "A logo is stored.",
    logoMissing: "No logo yet.",
    uploadLogo: "Upload the logo",
    chooseLogo: "Choose a logo file first.",
    saveBusiness: "Save the business",
    saved: "Saved.",
    saveFailed: "The business could not be saved.",
    logoSaved: "Logo saved.",
    logoFailed: "The logo could not be saved.",
    englishLabel: "English",
    spanishLabel: "Español",
    documentsTitle: "Documents",
    documentsIntro:
      "The files the assistant answers from. The ingestion is the same one the command line runs.",
    uploadDocument: "Document file",
    upload: "Upload",
    documentName: "Document",
    passages: "Passages",
    actions: "Actions",
    deleteDocument: "Delete",
    reingestDocument: "Re-ingest",
    reingested: "Re-ingested.",
    noDocuments: "No document yet. Upload the first one.",
    conversationsTitle: "Conversations",
    conversationsIntro: "The latest questions with their status and the passages they cited.",
    question: "Question",
    status: "Status",
    citations: "Citations",
    when: "When",
    answered: "Answered",
    refused: "Refused",
    deleteAll: "Delete all",
    deletedAll: "Every conversation is deleted.",
    noConversations: "No conversation yet.",
  },
  es: {
    panelEyebrow: "Panel de Cited",
    navSetup: "Configuración",
    navBusiness: "Negocio",
    navDocuments: "Documentos",
    navConversations: "Conversaciones",
    signOut: "Salir",
    tagline: "Cada respuesta enseña de dónde salió.",
    builtBy: "Hecho por Katalis",
    signInTitle: "Entra a tu panel",
    passwordLabel: "Contraseña",
    signIn: "Entrar",
    wrongPassword: "Esa no es la contraseña del panel.",
    locked: "Demasiados intentos fallidos desde esta dirección. Vuelve a intentarlo en quince minutos.",
    unconfiguredTitle: "El panel no puede arrancar",
    unconfigured: "El servidor necesita {variables}. Rellena la variable en el entorno y vuelve a arrancarlo.",
    setupTitle: "Configuración",
    setupIntro:
      "Todas las variables de la plantilla del entorno, agrupadas por propósito. El panel dice si cada una está puesta y nunca su valor.",
    configured: "Puesta",
    missing: "Falta",
    testChat: "Probar el modelo de chat",
    testEmbeddings: "Probar los embeddings",
    businessTitle: "Negocio",
    businessIntro:
      "El nombre, el logo, el color, el tono y las palabras que el asistente usa con quien pregunta.",
    businessName: "Nombre del negocio",
    businessColor: "Color principal",
    businessTone: "Tono",
    businessLanguage: "Idioma",
    businessTopics: "Temas prohibidos",
    businessTopicsHint: "Un tema por línea. Una pregunta sobre uno de ellos se rechaza.",
    welcomeEn: "Mensaje de bienvenida en inglés",
    welcomeEs: "Mensaje de bienvenida en español",
    logoLabel: "Logo",
    logoHint: "PNG, JPEG o WebP, 512 KB como máximo. Un SVG se rechaza.",
    logoSet: "Hay un logo guardado.",
    logoMissing: "Todavía no hay logo.",
    uploadLogo: "Subir el logo",
    chooseLogo: "Elige antes un archivo de logo.",
    saveBusiness: "Guardar el negocio",
    saved: "Guardado.",
    saveFailed: "No se pudo guardar el negocio.",
    logoSaved: "Logo guardado.",
    logoFailed: "No se pudo guardar el logo.",
    englishLabel: "English",
    spanishLabel: "Español",
    documentsTitle: "Documentos",
    documentsIntro:
      "Los archivos con los que responde el asistente. La ingesta es la misma que ejecuta la línea de comandos.",
    uploadDocument: "Archivo del documento",
    upload: "Subir",
    documentName: "Documento",
    passages: "Pasajes",
    actions: "Acciones",
    deleteDocument: "Borrar",
    reingestDocument: "Reingesta",
    reingested: "Reingestado.",
    noDocuments: "Todavía no hay documentos. Sube el primero.",
    conversationsTitle: "Conversaciones",
    conversationsIntro: "Las últimas preguntas con su estado y los pasajes que citaron.",
    question: "Pregunta",
    status: "Estado",
    citations: "Citas",
    when: "Cuándo",
    answered: "Respondida",
    refused: "Rechazada",
    deleteAll: "Borrar todas",
    deletedAll: "Todas las conversaciones están borradas.",
    noConversations: "Todavía no hay conversaciones.",
  },
};

export function adminStrings(lang: Lang): AdminStrings {
  return ADMIN_STRINGS[lang];
}

/**
 * A stored ISO date as an owner reads it (decision 19 of `openspec/changes/brand-identity-ui/design.md`): the medium date
 * and the short hour in the language of the panel. Without a zone it prints in the zone of the runtime: in the browser, the
 * zone of the reader. The server passes its own zone so the text it sends and the text of the hydration are the same.
 */
export function formatWhen(iso: string, lang: Lang, timeZone?: string): string {
  const date = new Date(iso);

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat(lang, { dateStyle: "medium", timeStyle: "short", timeZone }).format(date);
}
