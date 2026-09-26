import { useEffect, useState } from "react";
import { useErrorState } from "react-spotify-web-playback-sdk";
import { redirectToSpotifyLogin } from "@/auth";

const CONNECT_TIMEOUT_MS = 15000;

const errorMessages: Record<string, string> = {
  authentication_error: "Your Spotify login has expired.",
  account_error: "Spotify Premium is required to play songs.",
  initialization_error: "The Spotify player could not start in this browser.",
};

const logout = () => {
  localStorage.removeItem("spotify_access_token");
  localStorage.removeItem("spotify_refresh_token");
  redirectToSpotifyLogin();
};

/**
 * Shown while the Spotify Web Playback SDK has not provided a device yet,
 * so a failed or stuck connection no longer ends up as an empty screen.
 */
export default function PlayerConnecting() {
  const error = useErrorState();
  const [timedOut, setTimedOut] = useState(false);

  useEffect(() => {
    const timeout = setTimeout(() => setTimedOut(true), CONNECT_TIMEOUT_MS);
    return () => clearTimeout(timeout);
  }, []);

  const message = error
    ? errorMessages[error.type] ?? error.message
    : timedOut
    ? "Could not connect to Spotify."
    : null;

  return (
    <div className="flex flex-col items-center justify-center w-full min-h-screen gap-6 px-4 text-center">
      <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
        <span className="text-indigo-500">Tune</span>Quest
      </h1>
      {message ? (
        <>
          <p className="text-sm font-medium text-gray-700">{message}</p>
          <div className="flex flex-col w-full max-w-xs gap-3">
            <button
              className="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500"
              onClick={logout}
            >
              Login with Spotify
            </button>
            <button
              className="w-full rounded-md bg-white bg-opacity-30 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-opacity-60"
              onClick={() => window.location.reload()}
            >
              Try again
            </button>
          </div>
        </>
      ) : (
        <p className="text-sm font-medium text-gray-700 animate-pulse">
          Connecting to Spotify...
        </p>
      )}
    </div>
  );
}
