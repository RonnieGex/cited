import type { Lang } from "../settings/business.ts";

export type AdminStrings = {
  panelEyebrow: string;
  navSetup: string;
  navAi: string;
  navBusiness: string;
  navDocuments: string;
  navConversations: string;
  signOut: string;
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
  aiTitle: string;
  aiIntro: string;
  answersSection: string;
  answersIntro: string;
  meaningSection: string;
  meaningIntro: string;
  connected: string;
  setByServer: string;
  serverExplanation: string;
  notConnected: string;
  providerLabel: string;
  keyLabel: string;
  keyHint: string;
  showKey: string;
  hideKey: string;
  testKey: string;
  saveKey: string;
  removeKey: string;
  testing: string;
  tested: string;
  savedKey: string;
  removedKey: string;
  providerFailed: string;
  reasonRejectedKey: string;
  reasonNoCredit: string;
  reasonRateLimited: string;
  reasonModelNotFound: string;
  reasonUnreachable: string;
  reasonTimeout: string;
  reasonAddressNotAllowed: string;
  reasonAddressNotAllowedLink: string;
  noEncryptionKey: string;
  getKey: string;
  paidLink: string;
  lastTest: string;
  meansYes: string;
  meansNo: string;
  modelLabel: string;
  keywordActive: string;
  testProvider: string;
  keywordLine: string;
  keywordChoose: string;
  keywordSaved: string;
  reindexNeeded: string;
  reindexBody: string;
  reindexNow: string;
  reindexed: string;
  hostedOffer: string;
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
    navSetup: "For the installer",
    navAi: "AI and keys",
    navBusiness: "Business",
    navDocuments: "Documents",
    navConversations: "Conversations",
    signOut: "Sign out",
    signInTitle: "The panel of Cited",
    passwordLabel: "Password",
    signIn: "Sign in",
    wrongPassword: "That is not the password of the panel.",
    locked: "Too many failed attempts from this address. Try again in fifteen minutes.",
    unconfiguredTitle: "The panel cannot start",
    unconfigured: "The server needs {variables}. Fill the variable in the environment and start it again.",
    setupTitle: "For the installer",
    setupIntro:
      "What this server sets above the panel. Everything else belongs to the owner and happens in AI and keys; no name of a variable appears anywhere else in the panel.",
    configured: "Set",
    missing: "Missing",
    testChat: "Test the chat model",
    testEmbeddings: "Test the embeddings",
    aiTitle: "AI and keys",
    aiIntro:
      "Where your AI lives. Cited tests a key before saving it, stores it encrypted and never shows it again: only its last four characters stay in the panel.",
    answersSection: "Answers",
    answersIntro: "The provider that writes the answers from your documents.",
    meaningSection: "Meaning search",
    meaningIntro:
      "How the search finds the passage when the words of the question are not the words of the document.",
    connected: "Connected",
    setByServer: "Set by the server",
    serverExplanation: "Whoever installed Cited set this on the server, so it is read only here.",
    notConnected: "Not connected yet",
    providerLabel: "Provider",
    keyLabel: "API key",
    keyHint: "Paste the key you created in the provider's site. Cited tests it before saving it.",
    showKey: "Show",
    hideKey: "Hide",
    testKey: "Test",
    saveKey: "Save",
    removeKey: "Remove",
    testing: "Testing…",
    tested: "The provider answered with {model} in {ms} ms. You can save it now.",
    savedKey: "Saved. From now on the panel shows only the last four characters.",
    removedKey: "Removed. The panel no longer holds this key.",
    providerFailed: "The key could not be saved. Try again.",
    reasonRejectedKey: "The provider rejected the key: check that it is complete and paste it again.",
    reasonNoCredit: "The provider answered that the account has no credit.",
    reasonRateLimited: "The provider is limiting the requests right now: try again in a minute.",
    reasonModelNotFound: "The provider does not serve that model.",
    reasonUnreachable: "The provider could not be reached.",
    reasonTimeout: "The provider took too long to answer.",
    reasonAddressNotAllowed:
      "That address cannot be used: a provider of the list answers on its own address, and a local one needs whoever installs Cited to allow local providers.",
    reasonAddressNotAllowedLink: "For the installer",
    noEncryptionKey:
      "The server has no encryption key yet, so Cited cannot store keys. Whoever installed Cited sets it once.",
    getKey: "Get a key",
    paidLink: "(paid link)",
    lastTest: "Last test {when} in {ms} ms",
    meansYes: "Meaning search: yes",
    meansNo: "Meaning search: no",
    modelLabel: "Model",
    keywordActive: "Search by words",
    testProvider: "Test provider, no network",
    keywordLine: "Works without a key: it finds passages by the words they share, not by meaning.",
    keywordChoose: "Use search by words",
    keywordSaved: "Saved. The search ranks by words and the documents store no vectors.",
    reindexNeeded: "{passages} passages need re-indexing",
    reindexBody: "The search provider changed. Re-index so the search finds passages by meaning again.",
    reindexNow: "Re-index now",
    reindexed: "Re-indexed {passages} passages.",
    hostedOffer: "Prefer not to manage keys? Katalis runs it for you",
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
    navSetup: "Para quien instala",
    navAi: "IA y llaves",
    navBusiness: "Negocio",
    navDocuments: "Documentos",
    navConversations: "Conversaciones",
    signOut: "Salir",
    signInTitle: "El panel de Cited",
    passwordLabel: "Contraseña",
    signIn: "Entrar",
    wrongPassword: "Esa no es la contraseña del panel.",
    locked: "Demasiados intentos fallidos desde esta dirección. Vuelve a intentarlo en quince minutos.",
    unconfiguredTitle: "El panel no puede arrancar",
    unconfigured: "El servidor necesita {variables}. Rellena la variable en el entorno y vuelve a arrancarlo.",
    setupTitle: "Para quien instala",
    setupIntro:
      "Lo que este servidor fija por encima del panel. Todo lo demás es del dueño y ocurre en IA y llaves; ningún nombre de variable aparece en el resto del panel.",
    configured: "Puesta",
    missing: "Falta",
    testChat: "Probar el modelo de chat",
    testEmbeddings: "Probar los embeddings",
    aiTitle: "IA y llaves",
    aiIntro:
      "Donde vive tu IA. Cited prueba la llave antes de guardarla, la guarda cifrada y no la vuelve a mostrar: en el panel solo quedan sus últimos cuatro caracteres.",
    answersSection: "Respuestas",
    answersIntro: "El proveedor que escribe las respuestas a partir de tus documentos.",
    meaningSection: "Búsqueda por significado",
    meaningIntro:
      "Cómo encuentra la búsqueda el pasaje cuando las palabras de la pregunta no son las del documento.",
    connected: "Conectado",
    setByServer: "Fijado por el servidor",
    serverExplanation: "Quien instaló Cited lo fijó en el servidor, así que aquí solo se lee.",
    notConnected: "Todavía sin conectar",
    providerLabel: "Proveedor",
    keyLabel: "Llave de API",
    keyHint: "Pega la llave que creaste en la web del proveedor. Cited la prueba antes de guardarla.",
    showKey: "Mostrar",
    hideKey: "Ocultar",
    testKey: "Probar",
    saveKey: "Guardar",
    removeKey: "Quitar",
    testing: "Probando…",
    tested: "El proveedor respondió con {model} en {ms} ms. Ya puedes guardarla.",
    savedKey: "Guardada. Desde ahora el panel solo muestra los últimos cuatro caracteres.",
    removedKey: "Quitada. El panel ya no guarda esta llave.",
    providerFailed: "No se pudo guardar la llave. Inténtalo de nuevo.",
    reasonRejectedKey: "El proveedor rechazó la llave: revisa que esté completa y pégala otra vez.",
    reasonNoCredit: "El proveedor respondió que la cuenta no tiene saldo.",
    reasonRateLimited: "El proveedor está limitando las peticiones ahora mismo: inténtalo en un minuto.",
    reasonModelNotFound: "El proveedor no ofrece ese modelo.",
    reasonUnreachable: "No se pudo llegar al proveedor.",
    reasonTimeout: "El proveedor tardó demasiado en responder.",
    reasonAddressNotAllowed:
      "Esa dirección no se puede usar: un proveedor de la lista responde en su propia dirección, y uno local necesita que quien instaló Cited permita proveedores locales.",
    reasonAddressNotAllowedLink: "Para quien instala",
    noEncryptionKey:
      "El servidor todavía no tiene una llave de cifrado, así que Cited no puede guardar llaves. Quien instaló Cited la pone una vez.",
    getKey: "Consigue una llave",
    paidLink: "(enlace pagado)",
    lastTest: "Última prueba {when} en {ms} ms",
    meansYes: "Búsqueda por significado: sí",
    meansNo: "Búsqueda por significado: no",
    modelLabel: "Modelo",
    keywordActive: "Búsqueda por palabras",
    testProvider: "Proveedor de prueba, sin red",
    keywordLine: "Funciona sin llave: encuentra pasajes por las palabras que comparten, no por su significado.",
    keywordChoose: "Usar búsqueda por palabras",
    keywordSaved: "Guardado. La búsqueda ordena por palabras y los documentos no guardan vectores.",
    reindexNeeded: "{passages} pasajes necesitan reindexarse",
    reindexBody:
      "El proveedor de búsqueda cambió. Reindexa para que la búsqueda vuelva a encontrar pasajes por significado.",
    reindexNow: "Reindexar ahora",
    reindexed: "Reindexados {passages} pasajes.",
    hostedOffer: "¿No quieres manejar llaves? Katalis lo opera por ti",
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
