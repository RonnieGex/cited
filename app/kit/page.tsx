import type { Metadata } from "next";
import { CitationMark, Highlight, HighlightedTail, Wordmark } from "@/components/brand";
import { LanguageSwitch } from "@/components/i18n/LanguageSwitch";
import { Button, Chip, Input, Panel, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Kit de Cited",
  description: "Los componentes y la identidad de Cited: el logotipo, la marca de cita y el marcatextos, con los tokens y la tipografía de la marca.",
};

export default function Kit() {
  return (
    <main lang="es" className="min-h-screen bg-paper px-6 py-16 text-ink">
      <div className="mx-auto flex max-w-[960px] flex-col gap-12">
        <header className="flex flex-col gap-3">
          <SectionTitle data-kit="section-title" level="h1" eyebrow="Sistema de diseño">
            El kit de Cited
          </SectionTitle>
          <p className="max-w-[65ch] text-lg text-ink-2">
            Los cinco componentes con los que se construyen las pantallas del producto y los dos recursos que las hacen
            reconocibles: la marca de cita y el marcatextos. Todo es cuadrado, usa los tokens de la marca y lleva el foco
            de la casa: un contorno de lima de 2 px separado del borde.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Identidad">
            Logotipo
          </SectionTitle>
          <p className="max-w-[65ch] text-ink-2">
            La palabra Cited con una marca de cita en lima. Es el único logotipo del producto además de la llama real de
            Katalis, y nunca es un encabezado: el título de cada página es propio.
          </p>
          <div data-kit="wordmark" className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-4 border border-ink/10 bg-paper p-6">
              <Wordmark size="sm" />
              <Wordmark size="md" />
              <Wordmark size="lg" />
            </div>
            <div className="flex items-center bg-ink p-6">
              <Wordmark tone="ink" size="md" />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Identidad">
            Marca de cita
          </SectionTitle>
          <p className="max-w-[65ch] text-ink-2">
            Un cuadrado de lima con el número de la fuente de una respuesta. También numera los lugares del panel. Abierta
            se pinta de tinta con el número en lima.
          </p>
          <div data-kit="citation-mark" className="flex max-w-[65ch] flex-col gap-3 border border-ink/10 bg-paper p-6">
            <p className="text-lg leading-[1.6]">
              La afinación pide cita previa <CitationMark n={1} /> y el taller cierra los lunes <CitationMark n={2} />.
            </p>
            <p className="flex flex-wrap items-center gap-3 text-lg">
              <span className="text-sm text-ink-2">En reposo</span>
              <CitationMark n={3} />
              <span className="text-sm text-ink-2">Abierta</span>
              <CitationMark n={3} state="open" />
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Identidad">
            Marcatextos
          </SectionTitle>
          <p className="max-w-[65ch] text-ink-2">
            Lima pintada detrás de las palabras que importan: el cierre de un titular y el pasaje del que salió una
            respuesta. Se dibuja una sola vez al aparecer. Con movimiento reducido en el sistema nada se anima y el
            marcatextos aparece ya pintado.
          </p>
          <div data-kit="highlighter" className="flex max-w-[65ch] flex-col gap-4 border border-ink/10 bg-paper p-6">
            <p className="text-[28px] font-semibold leading-[1.15] tracking-[-0.02em]">
              <HighlightedTail text="Cada respuesta enseña de dónde salió." sweep />
            </p>
            <p className="text-lg leading-[1.6]">
              <Highlight sweep>Abrimos de martes a domingo.</Highlight>
            </p>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Acciones">
            Botones
          </SectionTitle>
          <p className="max-w-[65ch] text-ink-2">
            El botón principal es la única acción principal de una vista. El secundario acompaña sin competir. El
            fantasma es para los controles sobre tinta y el tamaño pequeño para los que van dentro de una franja.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button data-kit="button-primary">Buscar</Button>
            <Button data-kit="button-secondary" variant="secondary">
              Ver los documentos
            </Button>
            <Button size="sm" variant="secondary">
              Cerrar
            </Button>
          </div>
          <div className="flex flex-wrap items-center gap-4 bg-ink p-6">
            <Button data-kit="button-ghost" variant="ghost" size="sm">
              Cerrar sesión
            </Button>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Idioma">
            Selector de idioma
          </SectionTitle>
          <p className="max-w-[65ch] text-ink-2">
            Inglés primero y español completo. Sobre papel se ve como siempre; sobre tinta el idioma elegido va en lima.
            Sobre la franja del negocio toma el color de su fondo.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <div className="border border-ink/10 bg-paper p-4">
              <LanguageSwitch current="es" />
            </div>
            <div className="bg-ink p-4">
              <LanguageSwitch current="es" tone="ink" />
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Entrada">
            Campo de texto
          </SectionTitle>
          <div className="flex max-w-[520px] flex-col gap-2">
            <label className="text-sm font-semibold text-ink" htmlFor="pregunta">
              Tu pregunta
            </label>
            <Input
              data-kit="input"
              id="pregunta"
              name="pregunta"
              placeholder="Escribe tu pregunta"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Estado">
            Etiquetas
          </SectionTitle>
          <p className="max-w-[65ch] text-ink-2">
            Una etiqueta nombra el estado de una capacidad. La palabra sale del estado, nunca del deseo.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Chip data-kit="chip">Disponible</Chip>
            <Chip>Next · ElevenLabs</Chip>
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Superficie">
            Panel
          </SectionTitle>
          <Panel data-kit="panel" className="max-w-[640px]">
            <p className="text-ink-2">
              El panel agrupa una idea sobre el papel cálido de la marca, con un borde de un pixel y sin sombra en
              reposo. Es el mismo papel que usan las gráficas del README.
            </p>
          </Panel>
        </section>
      </div>
    </main>
  );
}
