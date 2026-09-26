import { handleSpotifyCallback, redirectToSpotifyLogin } from "@/auth";
import { useEffect } from "react";
import Logo from "@/components/ui/Logo";
import Vinyl from "@/components/ui/Vinyl";

export default function AuthCallback() {
  useEffect(() => {
    handleSpotifyCallback().catch(() => redirectToSpotifyLogin());
  }, []);
  return (
    <main className="flex flex-1 flex-col items-center justify-center gap-6 px-5 text-center animate-fade-in">
      <Vinyl spinning className="h-32 w-32" />
      <Logo className="text-3xl" />
      <p className="text-sm text-white/60 animate-pulse">Logging you in…</p>
    </main>
  );
}
