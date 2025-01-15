import { handleSpotifyCallback, redirectToSpotifyLogin } from "@/auth";
import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    handleSpotifyCallback().catch(() => redirectToSpotifyLogin());
  }, []);
  return (
    <div>
      <h1>Authenticating...</h1>
    </div>
  );
}
