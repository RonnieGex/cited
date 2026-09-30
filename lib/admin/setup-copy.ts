import type { Lang } from "../settings/business.ts";

// The words of the four steps of the guided setup, in both languages (decision 1: English first and Spanish complete,
// in the owner's words and never a name of a variable of the environment). They live with the checklist and not in
// `lib/i18n/admin.ts` because the checklist is the only reader: the page sends the titles to the component of the lane
// already chosen for the language of the panel.

export type SetupCopy = Record<Lang, string>;

export type SetupStepId = "ai" | "information" | "try" | "publish";

export type SetupStepWords = {
  title: SetupCopy;
  detail: SetupCopy;
};

export const SETUP_STEP_WORDS: Record<SetupStepId, SetupStepWords> = {
  ai: {
    title: { en: "Connect your AI", es: "Conecta tu IA" },
    detail: {
      en: "Paste the key of the provider that will write the answers. Cited tests it before saving it.",
      es: "Pega la llave del proveedor que escribirá las respuestas. Cited la prueba antes de guardarla.",
    },
  },
  information: {
    title: { en: "Add your information", es: "Agrega tu información" },
    detail: {
      en: "Bring the documents your customers ask about: prices, hours, policies. Or start with a sample business.",
      es: "Trae los documentos por los que preguntan tus clientes: precios, horarios, políticas. O empieza con un negocio de ejemplo.",
    },
  },
  try: {
    title: { en: "Try it", es: "Pruébalo" },
    detail: {
      en: "Ask your own documents and read the passage each answer came from. Mark a right answer to finish this step.",
      es: "Pregunta a tus propios documentos y lee el pasaje del que salió cada respuesta. Marca una respuesta correcta para terminar este paso.",
    },
  },
  publish: {
    title: { en: "Publish it", es: "Publícalo" },
    detail: {
      en: "Your name, your color and your welcome, with the page as your visitors will see it. Then share the link.",
      es: "Tu nombre, tu color y tu bienvenida, con la página tal como la verán quienes te visiten. Después comparte el enlace.",
    },
  },
};

export const SETUP_STEP_ORDER: readonly SetupStepId[] = ["ai", "information", "try", "publish"];
