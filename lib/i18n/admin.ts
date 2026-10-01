import type { AskFailureKind } from "../chat/client.ts";
import type { Lang } from "../settings/business.ts";

export type AdminStrings = {
  panelEyebrow: string;
  navAi: string;
  navConversations: string;
  navHome: string;
  navInformation: string;
  navTry: string;
  navPublish: string;
  navSettings: string;
  panelInstaller: string;
  stepTodo: string;
  stepProgress: string;
  stepVerified: string;
  stepAttention: string;
  stepAttentionBody: string;
  stepKeyBody: string;
  stepUnknownProviderBody: string;
  stepSearchBody: string;
  stepKeyAction: string;
  setupWelcomeTitle: string;
  setupWelcomeBody: string;
  setupMinutes: string;
  setupStart: string;
  setupSkip: string;
  setupOpen: string;
  setupSkippedNote: string;
  setupReopen: string;
  setupDoneTitle: string;
  setupDoneBody: string;
  setupStepsTitle: string;
  setupCountOf: string;
  uploadDrop: string;
  uploadOr: string;
  uploadReady: string;
  uploadScanTitle: string;
  uploadScanAdvice: string;
  uploadTooLargeTitle: string;
  uploadTooLargeAdvice: string;
  uploadTypeTitle: string;
  uploadTypeAdvice: string;
  uploadNoTextTitle: string;
  uploadNoTextAdvice: string;
  uploadSearchTitle: string;
  uploadSearchAdvice: string;
  uploadFailedTitle: string;
  uploadFailedAdvice: string;
  uploadWorking: string;
  uploadReading: string;
  uploadSplitting: string;
  sampleTry: string;
  sampleLoaded: string;
  sampleUndo: string;
  documentAdded: string;
  documentOpen: string;
  documentBack: string;
  documentRemove: string;
  /** The window of the undo of a removal: the document is still there and the owner can keep it. */
  documentRemoving: string;
  documentUndo: string;
  documentKept: string;
  documentUndone: string;
  documentNoPassages: string;
  noHeading: string;
  suggestedTitle: string;
  thisIsRight: string;
  thisIsNotRight: string;
  answerRightSaved: string;
  answerWrongSaved: string;
  tryNoDocuments: string;
  tryRefusalAdvice: string;
  tryAnswerTitle: string;
  tryPassageTitle: string;
  tryNoCitation: string;
  previewTitle: string;
  publishPreviewNote: string;
  publish: string;
  published: string;
  publicLink: string;
  copyLink: string;
  copied: string;
  openLink: string;
  widgetTitle: string;
  widgetSites: string;
  widgetNoSites: string;
  voiceTitle: string;
  voiceBody: string;
  homeTitle: string;
  homeIntro: string;
  homeMissing: string;
  homeLatest: string;
  homeNoConversations: string;
  homeOpenPanel: string;
  homeAllDone: string;
  settingsTitle: string;
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
  panelNotConfigured: string;
  panelPasswordTooShort: string;
  setupTitle: string;
  setupIntro: string;
  configured: string;
  missing: string;
  /** The summary of a folded Setup group: how many of its values are set. */
  setupCount: string;
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
  processingLabel: string;
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
  businessColorAdjusted: string;
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
  /** The ask box of Try it: the same three words the public chat uses. */
  question: { label: string; placeholder: string; submit: string };
  /** The header of the column of questions of the conversations table. */
  questionColumn: string;
  /** The question is being looked up in the documents. */
  loading: string;
  sources: string;
  /** The words of a citation mark, `{n}` for its number: a string, because this object travels to client components. */
  citationLabel: string;
  /** One sentence per kind of failure of a question: the panel never prints what the server wrote. */
  errors: Record<AskFailureKind, string>;
  status: string;
  citations: string;
  when: string;
  answered: string;
  refused: string;
  deleteAll: string;
  deletedAll: string;
  noConversations: string;
  /** Decision 28: the sentence that asks before a delete, `{name}` for a document; the two answers; no modal. */
  confirmDeleteDocument: string;
  confirmDeleteAll: string;
  confirmDelete: string;
  keep: string;
  /** Decision 29: what a provider test says, in the language of the panel, with the name of the provider. */
  providerChat: string;
  providerEmbeddings: string;
  testOk: string;
  testFailed: string;
  /** Decision 24: the title of the tab of every page of the panel, and of the sign-in and the unfinished installation. */
  pageTitle: {
    signIn: string;
    unconfigured: string;
    setup: string;
    ai: string;
    business: string;
    documents: string;
    conversations: string;
    home: string;
    information: string;
    try: string;
    publish: string;
    settings: string;
    privacy: string;
    document: string;
  };
};

export const ADMIN_STRINGS: Record<Lang, AdminStrings> = {
  en: {
    panelEyebrow: "Cited panel",
    navHome: "Home",
    navInformation: "Information",
    navTry: "Try it",
    navPublish: "Look and publish",
    navSettings: "Settings",
    panelInstaller: "For the installer",
    stepTodo: "To do",
    stepProgress: "In progress",
    stepVerified: "Verified",
    stepAttention: "Needs attention",
    stepAttentionBody:
      "The AI is set on the server and cannot answer yet. Whoever installs Cited has to finish it.",
    stepKeyBody: "The saved key can no longer be read. Connect your AI again.",
    stepUnknownProviderBody: "The saved AI provider is not one Cited knows. Connect your AI again.",
    stepSearchBody: "Your AI is connected. Choose how to search your documents: by meaning or by words.",
    stepKeyAction: "Connect your AI again",
    setupWelcomeTitle: "Your documents answer your customers",
    setupWelcomeBody:
      "Cited turns what you already wrote into answers with the passage they came from, and says when the documents do not say it. You need no server and no technical knowledge: everything happens here, in your panel.",
    setupMinutes: "4 steps, about 5 minutes",
    setupStart: "Start",
    setupSkip: "Skip for now",
    setupOpen: "Open the setup",
    setupSkippedNote: "The setup is hidden. You can open it again whenever you want.",
    setupReopen: "Open the setup again",
    setupDoneTitle: "Your assistant is ready",
    setupDoneBody: "The four steps are done. Share your link or add more documents whenever you want.",
    setupStepsTitle: "Your setup",
    setupCountOf: "{done} of {total} steps done",
    uploadDrop: "Drag your files here",
    uploadOr: "or",
    uploadReady: "Ready, {n} passages",
    uploadScanTitle: "This looks like a scan",
    uploadScanAdvice: "Scanned PDFs are not supported yet. Upload a version with text, or a Word or text file.",
    uploadTooLargeTitle: "This file is too large to read",
    uploadTooLargeAdvice: "A file of 20 MB at most. Split it or save it as a smaller one.",
    uploadTypeTitle: "This is not a type we can read",
    uploadTypeAdvice: "PDF, Word, Markdown or plain text. An image or a spreadsheet is not read yet.",
    uploadNoTextTitle: "This file has no text",
    uploadNoTextAdvice: "Check that the file is not empty and upload it again.",
    uploadSearchTitle: "The search is not connected yet",
    uploadSearchAdvice: "Finish step 1, or choose search by words in AI and keys.",
    uploadFailedTitle: "This file could not be read",
    uploadFailedAdvice: "Try again, or upload it in another format.",
    uploadWorking: "Uploading…",
    uploadReading: "Reading the file…",
    uploadSplitting: "Splitting into passages…",
    sampleTry: "Try it with a sample business (Café La Horquilla)",
    sampleLoaded: "{name} is loaded. You can remove its documents whenever you want.",
    sampleUndo: "Remove the sample documents",
    documentAdded: "Added {when}",
    documentOpen: "Open",
    documentBack: "All the documents",
    documentRemove: "Remove",
    documentRemoving: "Removing {name}. You can still keep it for a few seconds.",
    documentUndo: "Keep it",
    documentKept: "Kept. Nothing was removed.",
    documentUndone: "Removed. Upload it again whenever you want.",
    documentNoPassages: "This document has no passages yet.",
    noHeading: "Without a heading",
    suggestedTitle: "Ask about",
    thisIsRight: "This answer is right",
    thisIsNotRight: "This answer is not right",
    answerRightSaved: "Marked as right. Step 3 is verified.",
    answerWrongSaved: "Marked. Add or fix a document about this and try again.",
    tryNoDocuments: "There is nothing to ask yet. Add a document in step 2.",
    tryRefusalAdvice: "The documents do not say it. Add a document about this in step 2 and ask again.",
    tryAnswerTitle: "The answer",
    tryPassageTitle: "The passage it came from",
    tryNoCitation: "Choose a citation in the answer to read the passage it came from.",
    previewTitle: "The page as your visitors will see it",
    publishPreviewNote: "This is the real page. It saves when you press Save.",
    publish: "Publish",
    published: "Your page is published.",
    publicLink: "Your public link",
    copyLink: "Copy",
    copied: "Copied.",
    openLink: "Open the page",
    widgetTitle: "Put it on your own site",
    widgetSites: "The sites that may show it",
    widgetNoSites:
      "No site is allowed yet. Whoever installs Cited adds your site's address to the allowed sites of the server.",
    voiceTitle: "Talk to the documents",
    voiceBody: "A voice agent that answers with the same documents. It is the third way to publish, after the page and the widget.",
    homeTitle: "Home",
    homeIntro: "What is missing and what your visitors asked.",
    homeMissing: "What is missing",
    homeLatest: "The latest questions",
    homeNoConversations: "Nobody has asked anything yet.",
    homeOpenPanel: "Open the panel",
    homeAllDone: "Nothing is missing.",
    settingsTitle: "Settings",
    navAi: "AI and keys",
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
    panelNotConfigured:
      "Whoever installs Cited has to finish the installation on the server: the panel cannot answer yet.",
    panelPasswordTooShort:
      "The password of the panel is too short: whoever installs Cited has to set a longer one on the server.",
    setupTitle: "For the installer",
    setupIntro:
      "What this server sets above the panel. Everything else belongs to the owner and happens in AI and keys; no name of a variable appears anywhere else in the panel.",
    configured: "Set",
    missing: "Missing",
    setupCount: "Set: {set} of {total}",
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
    processingLabel: "Where it processes the data",
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
    businessColorAdjusted:
      "That color is too light or too dark to read over it, so the page uses lime instead. Pick a darker or a lighter one to see your own.",
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
    conversationsIntro: "The latest questions, whether each was answered or refused, and the numbers of the sources it cited.",
    question: { label: "Your question", placeholder: "Type your question", submit: "Ask" },
    questionColumn: "Question",
    loading: "Looking it up in your documents…",
    sources: "Sources",
    citationLabel: "Citation {n}",
    errors: {
      rate_limited: "Too many questions from here. Try again in a while.",
      unavailable: "The assistant cannot answer right now. Try again in a moment.",
      network: "The connection failed. Check yours and try again.",
    },
    status: "Status",
    citations: "Citations",
    when: "When",
    answered: "Answered",
    refused: "Refused",
    deleteAll: "Delete all",
    deletedAll: "Every conversation is deleted.",
    noConversations: "No conversation yet.",
    confirmDeleteDocument: "Delete {name}?",
    confirmDeleteAll: "Delete all conversations?",
    confirmDelete: "Delete",
    keep: "Keep",
    providerChat: "The chat provider",
    providerEmbeddings: "The embeddings provider",
    testOk: "{provider} answered.",
    testFailed: "{provider} did not answer. Check the key and try again.",
    pageTitle: {
      signIn: "Sign in · Cited",
      unconfigured: "The panel cannot start · Cited",
      setup: "Your setup · Cited",
      ai: "AI and keys · Cited",
      business: "Business · Cited",
      documents: "Documents · Cited",
      conversations: "Conversations · Cited",
      home: "Home · Cited",
      information: "Information · Cited",
      try: "Try it · Cited",
      publish: "Look and publish · Cited",
      settings: "Settings · Cited",
      privacy: "Privacy · Cited",
      document: "Document · Cited",
    },
  },
  es: {
    panelEyebrow: "Panel de Cited",
    navHome: "Inicio",
    navInformation: "Información",
    navTry: "Pruébalo",
    navPublish: "Apariencia y publicación",
    navSettings: "Ajustes",
    panelInstaller: "Para quien instala",
    stepTodo: "Pendiente",
    stepProgress: "En curso",
    stepVerified: "Verificado",
    stepAttention: "Necesita atención",
    stepAttentionBody:
      "La IA está fijada en el servidor y todavía no puede responder. Quien instala Cited tiene que terminarla.",
    stepKeyBody: "La llave guardada ya no se puede leer. Conecta tu IA otra vez.",
    stepUnknownProviderBody: "El proveedor de IA guardado no es uno que Cited conozca. Conecta tu IA otra vez.",
    stepSearchBody: "Tu IA está conectada. Elige cómo buscar en tus documentos: por significado o por palabras.",
    stepKeyAction: "Conectar tu IA otra vez",
    setupWelcomeTitle: "Tus documentos responden a tus clientes",
    setupWelcomeBody:
      "Cited convierte lo que ya escribiste en respuestas con el pasaje del que salieron, y dice cuando los documentos no lo dicen. No necesitas servidor ni conocimientos técnicos: todo ocurre aquí, en tu panel.",
    setupMinutes: "4 pasos, unos 5 minutos",
    setupStart: "Empezar",
    setupSkip: "Saltar por ahora",
    setupOpen: "Abrir la configuración guiada",
    setupSkippedNote: "La configuración guiada está oculta. Puedes abrirla otra vez cuando quieras.",
    setupReopen: "Abrir la configuración guiada otra vez",
    setupDoneTitle: "Tu asistente está listo",
    setupDoneBody: "Los cuatro pasos están hechos. Comparte tu enlace o agrega más documentos cuando quieras.",
    setupStepsTitle: "Tu configuración guiada",
    setupCountOf: "{done} de {total} pasos hechos",
    uploadDrop: "Arrastra tus archivos aquí",
    uploadOr: "o",
    uploadReady: "Listo, {n} pasajes",
    uploadScanTitle: "Esto parece un escaneo",
    uploadScanAdvice:
      "Los PDF escaneados todavía no se admiten. Sube una versión con texto, o un archivo de Word o de texto.",
    uploadTooLargeTitle: "Este archivo es demasiado grande para leerlo",
    uploadTooLargeAdvice: "Un archivo de 20 MB como máximo. Divídelo o guárdalo más pequeño.",
    uploadTypeTitle: "Este tipo de archivo no se puede leer",
    uploadTypeAdvice: "PDF, Word, Markdown o texto plano. Una imagen o una hoja de cálculo todavía no se leen.",
    uploadNoTextTitle: "Este archivo viene sin texto",
    uploadNoTextAdvice: "Revisa que el archivo no esté vacío y súbelo otra vez.",
    uploadSearchTitle: "La búsqueda todavía no está conectada",
    uploadSearchAdvice: "Termina el paso 1, o elige búsqueda por palabras en IA y llaves.",
    uploadFailedTitle: "Este archivo no se pudo leer",
    uploadFailedAdvice: "Inténtalo otra vez, o súbelo en otro formato.",
    uploadWorking: "Subiendo…",
    uploadReading: "Leyendo el archivo…",
    uploadSplitting: "Dividiendo en pasajes…",
    sampleTry: "Pruébalo con un negocio de ejemplo (Café La Horquilla)",
    sampleLoaded: "{name} está cargado. Puedes quitar sus documentos cuando quieras.",
    sampleUndo: "Quitar los documentos del ejemplo",
    documentAdded: "Agregado {when}",
    documentOpen: "Abrir",
    documentBack: "Todos los documentos",
    documentRemove: "Quitar",
    documentRemoving: "Quitando {name}. Todavía puedes conservarlo unos segundos.",
    documentUndo: "Conservarlo",
    documentKept: "Conservado. No se quitó nada.",
    documentUndone: "Quitado. Súbelo otra vez cuando quieras.",
    documentNoPassages: "Este documento todavía no tiene pasajes.",
    noHeading: "Sin apartado",
    suggestedTitle: "Pregunta por",
    thisIsRight: "Esta respuesta es correcta",
    thisIsNotRight: "Esta respuesta no es correcta",
    answerRightSaved: "Marcada como correcta. El paso 3 queda verificado.",
    answerWrongSaved: "Marcada. Agrega o corrige un documento sobre esto y vuelve a probar.",
    tryNoDocuments: "Todavía no hay nada que preguntar. Agrega un documento en el paso 2.",
    tryRefusalAdvice: "Los documentos no lo dicen. Agrega un documento sobre esto en el paso 2 y pregunta otra vez.",
    tryAnswerTitle: "La respuesta",
    tryPassageTitle: "El pasaje del que salió",
    tryNoCitation: "Elige una cita en la respuesta para leer el pasaje del que salió.",
    previewTitle: "La página tal como la verán quienes te visiten",
    publishPreviewNote: "Esta es la página real. Se guarda cuando pulsas Guardar.",
    publish: "Publicar",
    published: "Tu página está publicada.",
    publicLink: "Tu enlace público",
    copyLink: "Copiar",
    copied: "Copiado.",
    openLink: "Abrir la página",
    widgetTitle: "Ponlo en tu propia web",
    widgetSites: "Los sitios que pueden mostrarlo",
    widgetNoSites:
      "Todavía no hay ningún sitio permitido. Quien instala Cited agrega la dirección de tu web a los sitios permitidos del servidor.",
    voiceTitle: "Habla con los documentos",
    voiceBody:
      "Un agente de voz que responde con los mismos documentos. Es la tercera forma de publicar, después de la página y del widget.",
    homeTitle: "Inicio",
    homeIntro: "Lo que falta y lo que preguntaron quienes te visitan.",
    homeMissing: "Lo que falta",
    homeLatest: "Las últimas preguntas",
    homeNoConversations: "Todavía no ha preguntado nadie.",
    homeOpenPanel: "Abrir el panel",
    homeAllDone: "No falta nada.",
    settingsTitle: "Ajustes",
    navAi: "IA y llaves",
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
    panelNotConfigured:
      "Quien instala Cited tiene que terminar la instalación en el servidor: el panel todavía no puede responder.",
    panelPasswordTooShort:
      "La contraseña del panel es demasiado corta: quien instala Cited tiene que poner una más larga en el servidor.",
    setupTitle: "Para quien instala",
    setupIntro:
      "Lo que este servidor fija por encima del panel. Todo lo demás es del dueño y ocurre en IA y llaves; ningún nombre de variable aparece en el resto del panel.",
    configured: "Puesta",
    missing: "Falta",
    setupCount: "Puestas: {set} de {total}",
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
    processingLabel: "Dónde trata los datos",
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
    businessColorAdjusted:
      "Ese color es demasiado claro u oscuro para leer encima, así que la página usa la lima. Elige uno más oscuro o más claro para ver el tuyo.",
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
    conversationsIntro: "Las últimas preguntas, si se respondieron o se rechazaron, y los números de las fuentes que citaron.",
    question: { label: "Tu pregunta", placeholder: "Escribe tu pregunta", submit: "Preguntar" },
    questionColumn: "Pregunta",
    loading: "Buscando en tus documentos…",
    sources: "Fuentes",
    citationLabel: "Cita {n}",
    errors: {
      rate_limited: "Demasiadas preguntas desde aquí. Vuelve a intentarlo en un rato.",
      unavailable: "El asistente no puede responder ahora mismo. Inténtalo en un momento.",
      network: "La conexión falló. Revisa la tuya y vuelve a intentarlo.",
    },
    status: "Estado",
    citations: "Citas",
    when: "Cuándo",
    answered: "Respondida",
    refused: "Rechazada",
    deleteAll: "Borrar todas",
    deletedAll: "Todas las conversaciones están borradas.",
    noConversations: "Todavía no hay conversaciones.",
    confirmDeleteDocument: "¿Borrar {name}?",
    confirmDeleteAll: "¿Borrar todas las conversaciones?",
    confirmDelete: "Borrar",
    keep: "Conservar",
    providerChat: "El proveedor de chat",
    providerEmbeddings: "El proveedor de embeddings",
    testOk: "{provider} respondió.",
    testFailed: "{provider} no respondió. Revisa la llave y vuelve a probar.",
    pageTitle: {
      signIn: "Iniciar sesión · Cited",
      unconfigured: "El panel no puede arrancar · Cited",
      setup: "Tu configuración · Cited",
      ai: "IA y llaves · Cited",
      business: "Negocio · Cited",
      documents: "Documentos · Cited",
      conversations: "Conversaciones · Cited",
      home: "Inicio · Cited",
      information: "Información · Cited",
      try: "Pruébalo · Cited",
      publish: "Apariencia y publicación · Cited",
      settings: "Ajustes · Cited",
      privacy: "Privacidad · Cited",
      document: "Documento · Cited",
    },
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
