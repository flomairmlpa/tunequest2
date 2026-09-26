import { useEffect, useRef, useState } from "react";
import QrScanner from "qr-scanner";

type Props = {
  handleSpotifyTrackId: (result: string) => void;
  isActive: boolean; // Control scanning without unmounting
};

const spotifyRegex =
  /^(https:\/\/open.spotify.com\/track\/|spotify:track:)([a-zA-Z0-9]+)(.*)$/gm;

// Classic Hitster cards: www.hitstergame.com/<lang>/<card> or www.hitstergame.com/<lang>/<sku>/<card>
const hitsterRegex =
  /^(?:https?:\/\/)?(?:www\.)?hitstergame\.com\/([a-z-]+)\/(?:([a-z]{4}\d{4})\/)?(\d+)\/?$/i;

const resolveHitsterTrackId = async (text: string) => {
  const match = hitsterRegex.exec(text.trim());
  if (!match) return undefined;
  const [, lang, sku, card] = match;
  const params = new URLSearchParams({ lang, card });
  if (sku) params.set("sku", sku);
  const response = await fetch(`/api/hitster?${params.toString()}`);
  if (!response.ok) throw new Error("Unknown Hitster card");
  const { trackId } = await response.json();
  return trackId as string;
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
        if (hitsterRegex.test(text.trim()) && text !== failedHitsterTextRef.current) {
          hasScannedRef.current = true;
          resolveHitsterTrackId(text)
            .then((hitsterTrackId) => {
              if (!hitsterTrackId) throw new Error("Unknown Hitster card");
              setError(null);
              callbackRef.current(hitsterTrackId);
            })
            .catch((e) => {
              console.error("Failed to resolve Hitster card:", e);
              failedHitsterTextRef.current = text;
              setError("Unknown Hitster card, try another one");
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
        <div className="fixed border-2 border-white border-opacity-25 rounded-2xl w-[200px] h-[200px] top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"></div>
      )}
      {isActive && error && (
        <p className="fixed top-1/2 left-1/2 transform -translate-x-1/2 translate-y-[120px] z-10 text-sm font-medium text-white bg-black/40 px-3 py-2 rounded-md backdrop-blur text-center">
          {error}
        </p>
      )}
    </div>
  );
}
