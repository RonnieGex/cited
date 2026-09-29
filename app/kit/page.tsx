import type { Metadata } from "next";
import { Button, Chip, Input, Panel, SectionTitle } from "@/components/ui";

export const metadata: Metadata = {
  title: "Kit de Cited",
  description: "Los componentes del sistema de diseño de Cited, con los tokens y la tipografía de la marca.",
};

export default function Kit() {
  return (
    <main lang="es" className="min-h-screen bg-paper px-6 py-16 text-ink">
      <div className="mx-auto flex max-w-[960px] flex-col gap-12">
        <header className="flex flex-col gap-3">
          <SectionTitle data-kit="section-title" level="h1" eyebrow="Sistema de diseño">
            El kit de Cited
          </SectionTitle>
          <p className="max-w-[65ch] text-lg text-ink/80">
            Los cinco componentes con los que se construyen las pantallas del producto. Todos son cuadrados, usan los
            tokens de la marca y llevan el foco de la casa: un contorno de lima de 2 px separado del borde.
          </p>
        </header>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Acciones">
            Botones
          </SectionTitle>
          <p className="max-w-[65ch] text-ink/80">
            El botón principal es la única acción principal de una vista. El secundario acompaña sin competir.
          </p>
          <div className="flex flex-wrap items-center gap-4">
            <Button data-kit="button-primary">Buscar</Button>
            <Button data-kit="button-secondary" variant="secondary">
              Ver los documentos
            </Button>
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
              placeholder="¿Cuánto cuesta una afinación de bicicleta?"
            />
          </div>
        </section>

        <section className="flex flex-col gap-4">
          <SectionTitle level="h2" eyebrow="Estado">
            Etiquetas
          </SectionTitle>
          <p className="max-w-[65ch] text-ink/80">
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
            <p className="text-ink/80">
              El panel agrupa una idea sobre el papel cálido de la marca, con un borde de un pixel y sin sombra en
              reposo. Es el mismo papel que usan las gráficas del README.
            </p>
          </Panel>
        </section>
      </div>
    </main>
  );
}
