"use client";

import dynamic from "next/dynamic";
import type { OrbAgentState } from "./voice-state";

// A port of `components/voice/voice-orb.tsx` of Construye (MIT, read only). three.js and the whole react-three tree
// arrive with this chunk only: nothing of it is in the page until the panel opens, which is what the end-to-end test
// measures by looking for the texture in the scripts the browser fetched.
const Orb = dynamic(() => import("@/components/ui/orb").then((module) => module.Orb), {
  ssr: false,
  loading: () => <div className="h-full w-full" aria-hidden />,
});

export function VoiceOrb({
  agentState,
  colors,
  getInputVolume,
  getOutputVolume,
  reducedMotion,
}: {
  agentState: OrbAgentState;
  colors: [string, string];
  getInputVolume: () => number;
  getOutputVolume: () => number;
  reducedMotion: boolean;
}) {
  return (
    <div data-testid="voice-orb" data-colors={colors.join(" ")} className="relative h-full w-full">
      <Orb
        colors={colors}
        seed={7}
        agentState={agentState}
        volumeMode="manual"
        getInputVolume={getInputVolume}
        getOutputVolume={getOutputVolume}
        reducedMotion={reducedMotion}
        className="h-full w-full"
      />
    </div>
  );
}
