/**
 * The words of the voice panel, in the two languages of Cited. English comes first, as on every other page of the
 * product: the panel is opened with the language of the business, the same one the chat uses.
 */

import type { Lang } from "../settings/business.ts";

export type VoiceStrings = {
  launcher: string;
  title: string;
  intro: string;
  idle: string;
  connecting: string;
  listening: string;
  thinking: string;
  talking: string;
  ready: string;
  disconnecting: string;
  error: string;
  start: string;
  end: string;
  questionLabel: string;
  placeholder: string;
  send: string;
  transcriptEmpty: string;
  you: string;
  assistant: string;
  sources: string;
  privacy: string;
  close: string;
  micError: string;
  limitError: string;
  genericError: string;
  notConfigured: string;
  agentTitle: string;
  agentIntro: string;
  agentCreate: string;
  agentUpdate: string;
  agentCreated: string;
  agentUpdated: string;
  agentFailed: string;
  agentMissing: string;
  agentId: string;
};

export const VOICE_STRINGS: Record<Lang, VoiceStrings> = {
  en: {
    launcher: "Talk to it",
    title: "Talk to the documents",
    intro: "Ask out loud and it answers with what the documents say. You can type your question too.",
    idle: "Tap to talk",
    connecting: "Connecting…",
    listening: "I'm listening…",
    thinking: "Searching the documents…",
    talking: "Answering…",
    ready: "Type your question",
    disconnecting: "Finishing…",
    error: "The conversation dropped",
    start: "Start talking",
    end: "Finish",
    questionLabel: "Your written question",
    placeholder: "Type your question…",
    send: "Send",
    transcriptEmpty: "Here you will see what you say and what the documents answer.",
    you: "You: ",
    assistant: "The documents: ",
    sources: "Sources",
    privacy:
      "ElevenLabs, the provider of the agent, processes your voice. Do not say personal data. The answers come from the documents, and the sources above are documents of this site.",
    close: "Close the voice panel",
    micError:
      "We could not use your microphone. Check the permission of the browser or type your question below: it works the same.",
    limitError: "The agent reached its daily limit. Type your question below and we answer in writing.",
    genericError: "We could not connect to the voice agent. Type your question below and we answer in writing.",
    notConfigured: "The voice is not configured on this site yet. Meanwhile, type your question below.",
    agentTitle: "Voice agent",
    agentIntro:
      "One button creates the agent of this business in ElevenLabs: the secret of the tool, the two tools and the agent itself, with the name, the language and the allowed origins of this installation. A second press updates the same agent.",
    agentCreate: "Create my voice agent",
    agentUpdate: "Update my voice agent",
    agentCreated: "The agent is created.",
    agentUpdated: "The agent is updated.",
    agentFailed: "The agent could not be created.",
    agentMissing: "The server needs {variables} to create the agent.",
    agentId: "Agent",
  },
  es: {
    launcher: "Hablar con él",
    title: "Habla con los documentos",
    intro: "Pregunta en voz alta y te contesta con lo que dicen los documentos. También puedes escribirle.",
    idle: "Toca para hablar",
    connecting: "Conectando…",
    listening: "Te escucho…",
    thinking: "Buscando en los documentos…",
    talking: "Respondiendo…",
    ready: "Escribe tu pregunta",
    disconnecting: "Terminando…",
    error: "Se cortó la conversación",
    start: "Empezar a hablar",
    end: "Terminar",
    questionLabel: "Tu pregunta escrita",
    placeholder: "Escribe tu pregunta…",
    send: "Enviar",
    transcriptEmpty: "Aquí verás lo que dices y lo que responden los documentos.",
    you: "Tú: ",
    assistant: "Los documentos: ",
    sources: "Fuentes consultadas",
    privacy:
      "Tu voz la procesa ElevenLabs, el proveedor del agente. No digas datos personales. Las respuestas salen de los documentos, y las fuentes de arriba son documentos de este sitio.",
    close: "Cerrar el panel de voz",
    micError:
      "No pudimos usar tu micrófono. Revisa el permiso del navegador o escribe tu pregunta aquí abajo: funciona igual.",
    limitError:
      "El agente alcanzó su límite diario. Escribe tu pregunta aquí abajo y te contestamos por escrito.",
    genericError:
      "No pudimos conectar con el agente de voz. Escribe tu pregunta aquí abajo y te contestamos por escrito.",
    notConfigured: "La voz todavía no está configurada en este sitio. Mientras tanto, escribe tu pregunta aquí abajo.",
    agentTitle: "Agente de voz",
    agentIntro:
      "Un botón crea el agente de este negocio en ElevenLabs: el secreto de la herramienta, las dos herramientas y el agente mismo, con el nombre, el idioma y los orígenes permitidos de esta instalación. Una segunda pulsación actualiza el mismo agente.",
    agentCreate: "Crear mi agente de voz",
    agentUpdate: "Actualizar mi agente de voz",
    agentCreated: "El agente está creado.",
    agentUpdated: "El agente está actualizado.",
    agentFailed: "No se pudo crear el agente.",
    agentMissing: "El servidor necesita {variables} para crear el agente.",
    agentId: "Agente",
  },
};

export function voiceStrings(lang: Lang): VoiceStrings {
  return VOICE_STRINGS[lang];
}
