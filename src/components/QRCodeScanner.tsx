import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";
import { parseHitsterUrl } from "@/hitster/parseHitsterUrl";

type Props = {
  handleSpotifyTrackId: (result: string) => void;
  isActive: boolean; // Control scanning without unmounting
};

const spotifyRegex =
  /^(https:\/\/open.spotify.com\/track\/|spotify:track:)([a-zA-Z0-9]+)(.*)$/gm;

class HitsterLookupError extends Error {}

// Resolves an original Hitster card URL (hitstergame.com/<lang>[/<sku>]/<card>) to a Spotify track id
const resolveHitsterTrackId = async (url: string) => {
  const response = await fetch(`/api/hitster?url=${encodeURIComponent(url)}`);
  const data = await response.json().catch(() => ({}));
  if (response.ok && data.trackId) return data.trackId as string;
  throw new HitsterLookupError(
    response.status === 404
      ? "This Hitster card is not in the database"
      : "Could not look up Hitster card"
  );
};

export default function QRCodeScanner({ handleSpotifyTrackId, isActive }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const hasScannedRef = useRef(false);
  const failedHitsterTextRef = useRef<string | null>(null);
  const callbackRef = useRef(handleSpotifyTrackId);
  const [error, setError] = useState<string | null>(null);

  // Keep callback ref up to date
  useEffect(() => {
    callbackRef.current = handleSpotifyTrackId;
  }, [handleSpotifyTrackId]);

  // Initialize scanner once and keep it alive
  useEffect(() => {
    const videoEl = videoRef.current;
    if (!videoEl) return;

    const scanner = new QrScanner(
      videoEl,
      (result) => {
        if (hasScannedRef.current) return;
        // Reset regex state (global flag g in regex causes lastIndex to persist)
        spotifyRegex.lastIndex = 0;
        const text = typeof result === "string" ? result : (result as any).data;
        const trackId = spotifyRegex.exec(text)?.[2];
        if (trackId) {
          hasScannedRef.current = true;
          setError(null);
          callbackRef.current(trackId);
          return;
        }
        if (parseHitsterUrl(text) && text !== failedHitsterTextRef.current) {
          hasScannedRef.current = true;
          resolveHitsterTrackId(text)
            .then((hitsterTrackId) => {
              setError(null);
              callbackRef.current(hitsterTrackId);
            })
            .catch((e) => {
              console.error("Failed to resolve Hitster card:", e);
              failedHitsterTextRef.current = text;
              setError(
                e instanceof HitsterLookupError
                  ? e.message
                  : "Could not look up Hitster card"
              );
              hasScannedRef.current = false;
            });
        }
      },
      {
        /* you can optionally set maxScansPerSecond here */
      }
    );

    scanner.setInversionMode("both");
    scannerRef.current = scanner;

    return () => {
      // Only destroy on actual component unmount (page navigation)
      try {
        scanner.stop();
      } catch {}
      try {
        (scanner as any).destroy?.();
      } catch {}
      scannerRef.current = null;
    };
  }, []);

  // Handle active state changes (pause/resume scanning)
  useEffect(() => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    if (isActive) {
      hasScannedRef.current = false; // Reset scan state when becoming active
      failedHitsterTextRef.current = null;
      setError(null);
      scanner.start();
    } else {
      scanner.pause();
    }
  }, [isActive]);

  return (
    <div className="relative" style={{ display: isActive ? 'block' : 'none' }}>
      <video
        ref={videoRef}
        className="fixed right-0 bottom-0 min-w-full min-h-full object-cover"
        style={{ visibility: isActive ? 'visible' : 'hidden' }}
      ></video>
      {isActive && (
        <div className="pointer-events-none fixed left-1/2 top-1/2 z-10 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-3xl shadow-[0_0_0_200vmax_rgba(12,7,23,0.6)] animate-fade-in">
          <span className="absolute -left-1 -top-1 h-12 w-12 rounded-tl-3xl border-l-4 border-t-4 border-neon-pink" />
          <span className="absolute -right-1 -top-1 h-12 w-12 rounded-tr-3xl border-r-4 border-t-4 border-neon-violet" />
          <span className="absolute -bottom-1 -left-1 h-12 w-12 rounded-bl-3xl border-b-4 border-l-4 border-neon-violet" />
          <span className="absolute -bottom-1 -right-1 h-12 w-12 rounded-br-3xl border-b-4 border-r-4 border-neon-cyan" />
          <span className="absolute inset-x-4 h-0.5 rounded-full bg-gradient-to-r from-transparent via-neon-cyan to-transparent shadow-[0_0_16px_4px_rgba(62,230,255,0.5)] animate-scan" />
        </div>
      )}
      {isActive && error && (
        <p className="fixed left-1/2 top-1/2 z-20 -translate-x-1/2 translate-y-[9.5rem] whitespace-nowrap rounded-full bg-neon-pink/20 px-4 py-2 text-center text-sm font-medium text-white ring-1 ring-neon-pink/50 backdrop-blur animate-fade-up">
          {error}
        </p>
      )}
    </div>
  );
}
