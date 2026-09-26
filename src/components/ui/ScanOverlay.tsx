import { ReactNode } from "react";

/** Title and bottom actions layered over the full-screen camera while scanning. */
export default function ScanOverlay({ children }: { children?: ReactNode }) {
  return (
    <>
      <div className="pointer-events-none fixed inset-x-0 top-20 z-20 px-6 text-center animate-fade-up">
        <h1 className="font-display text-3xl font-extrabold drop-shadow-lg">
          Scan a card
        </h1>
        <p className="mt-2 text-sm text-white/70 drop-shadow">
          Point your camera at a Hitster or TuneQuest QR code
        </p>
      </div>
      <div className="fixed inset-x-0 bottom-0 z-20 flex flex-col items-center gap-3 bg-gradient-to-t from-ink/90 to-transparent px-5 pb-8 pt-16">
        {children}
      </div>
    </>
  );
}
