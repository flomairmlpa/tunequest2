import { handleSpotifyCallback } from "@/auth";
import { useEffect } from "react";

export default function AuthCallback() {
  useEffect(() => {
    handleSpotifyCallback().catch(console.error);
  }, []);
  return (
    <div>
      <p>auth-callback</p>
    </div>
  );
}
