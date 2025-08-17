import { useCallback, useEffect, useState } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import GameController from "@/components/ScannerController";
import Head from "next/head";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { redirectToSpotifyLogin } from "@/auth";
import SideBar from "@/components/SideBar";
import QRCodeScanner from "@/components/QRCodeScanner";

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

  // Safe token supplier for the SDK; only refresh if we truly have a refresh token.
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    (callback) => {
      const existingAccess = localStorage.getItem("spotify_access_token");
      if (existingAccess) {
        callback(existingAccess);
        return;
      }
      const refresh = localStorage.getItem("spotify_refresh_token");
      if (!refresh) {
        // No refresh token yet; supply empty string (player features just won't work yet)
        callback("");
        return;
      }
      onTokenExpiry().then((token) => callback(token ?? ""));
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
        <div className="relative flex flex-col w-full min-h-screen">
          <h1 className="fixed top-0 left-1/2 transform -translate-x-1/2 z-10 text-3xl font-bold tracking-tight text-white xs:text-4xl sm:text-5xl lg:text-6xl mt-8 uppercase text-center drop-shadow-lg">
            Scan QR-Code
          </h1>
          <QRCodeScanner handleSpotifyTrackId={handleSpotifyTrackId} />
          <div className="fixed bottom-0 left-0 w-full flex flex-col items-center gap-3 pb-8 px-4 z-20">
            {pendingTrackId && (
              <p className="text-sm font-medium text-white bg-black/40 px-3 py-2 rounded-md backdrop-blur">
                Track scanned. Please login to play (will auto-use after login).
              </p>
            )}
            <button
              onClick={() => redirectToSpotifyLogin()}
              className="w-full max-w-xs rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Login with Spotify
            </button>
          </div>
        </div>
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
