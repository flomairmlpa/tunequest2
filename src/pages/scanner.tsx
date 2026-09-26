import { useCallback, useEffect, useState } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import GameController from "@/components/ScannerController";
import Head from "next/head";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { redirectToSpotifyLogin } from "@/auth";
import SideBar from "@/components/SideBar";
import QRCodeScanner from "@/components/QRCodeScanner";
import ScanOverlay from "@/components/ui/ScanOverlay";

/**
 * Scanner page behavior change:
 * - Always show the QR scanner immediately (previously an auth redirect happened because the
 *   WebPlaybackSDK tried to fetch a token and onTokenExpiry() redirected when no refresh token existed).
 * - We now only attempt a token refresh if a refresh token is present.
 * - If the user scans a code while unauthenticated we trigger the Spotify login then; after returning
 *   with tokens the full player will initialize automatically.
 */

const ScannerPage = () => {
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [pendingTrackId, setPendingTrackId] = useState<string | null>(null);

  // Read any existing tokens on mount / after returning from auth
  useEffect(() => {
    setAccessToken(localStorage.getItem("spotify_access_token"));
  }, []);

  // Token supplier for the SDK. The stored access token may have expired, so refresh
  // whenever a refresh token exists and fall back to the stored access token otherwise.
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    (callback) => {
      onTokenExpiry().then((token) => {
        if (token) setAccessToken(token);
        callback(token ?? localStorage.getItem("spotify_access_token") ?? "");
      });
    },
    []
  );

  // If we have no access token show a bare scanner that triggers auth on first scan.
  if (!accessToken) {
    // In unauthenticated mode we show the scanner but do NOT redirect automatically.
    // Scans are ignored until the user explicitly logs in.
    const handleSpotifyTrackId = (trackId: string) => {
      setPendingTrackId(trackId); // store for later after login
    };
    return (
      <>
        <Head>
          <title>TuneQuest</title>
        </Head>
        <QRCodeScanner
          handleSpotifyTrackId={handleSpotifyTrackId}
          isActive={true}
        />
        <ScanOverlay>
          {pendingTrackId && (
            <p className="rounded-full bg-white/10 px-4 py-2 text-sm font-medium backdrop-blur animate-fade-up">
              Card scanned! Log in to start playing.
            </p>
          )}
          <button
            onClick={() => redirectToSpotifyLogin()}
            className="btn btn-primary w-full max-w-sm"
          >
            Login with Spotify
          </button>
        </ScanOverlay>
      </>
    );
  }

  // Authenticated: initialize playback SDK + full game controller (which itself contains scanner UI initially)
  return (
    <>
      <Head>
        <title>TuneQuest</title>
      </Head>
      <WebPlaybackSDK
        initialDeviceName="TuneQuest"
        getOAuthToken={getOAuthToken}
        connectOnInitialized={true}
        initialVolume={1}
      >
        <SideBar />
        <GameController token={accessToken} />
      </WebPlaybackSDK>
    </>
  );
};

export default ScannerPage;
