import { useEffect, useState } from "react";
import { useErrorState } from "react-spotify-web-playback-sdk";
import { redirectToSpotifyLogin } from "@/auth";
import Logo from "./ui/Logo";
import Vinyl from "./ui/Vinyl";

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
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-5 text-center animate-fade-in">
      <div className="relative">
        <div className="absolute inset-4 rounded-full bg-neon-violet/40 blur-3xl" />
        <Vinyl spinning={!message} className="h-32 w-32" />
      </div>
      <Logo className="text-3xl" />
      {message ? (
        <div className="flex w-full flex-col gap-3 animate-fade-up">
          <p className="mb-2 text-white/70">{message}</p>
          <button className="btn btn-primary w-full" onClick={logout}>
            Login with Spotify
          </button>
          <button
            className="btn btn-ghost w-full"
            onClick={() => window.location.reload()}
          >
            Try again
          </button>
        </div>
      ) : (
        <p className="text-sm text-white/60 animate-pulse">
          Connecting to Spotify…
        </p>
      )}
    </main>
  );
}
