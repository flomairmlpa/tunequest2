import { useEffect, useRef, useCallback } from "react";
import QrScanner from "qr-scanner";

type Props = {
  handleSpotifyTrackId: (result: string) => void;
  isActive: boolean; // Control scanning without unmounting
};

const spotifyRegex =
  /^(https:\/\/open.spotify.com\/track\/|spotify:track:)([a-zA-Z0-9]+)(.*)$/gm;

export default function QRCodeScanner({ handleSpotifyTrackId, isActive }: Props) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const hasScannedRef = useRef(false);
  const callbackRef = useRef(handleSpotifyTrackId);

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
          callbackRef.current(trackId);
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
    </div>
  );
}
