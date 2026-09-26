import { ReactNode, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";
import { useSpotifyPlayer } from "react-spotify-web-playback-sdk";
import {
  FiCamera,
  FiHome,
  FiList,
  FiLogOut,
  FiMenu,
  FiRefreshCw,
  FiX,
} from "react-icons/fi";
import { useResetGame } from "./state";
import Logo from "./ui/Logo";
import packageJson from "../../package.json";

function MenuItem({
  icon,
  label,
  href,
  onClick,
  active,
}: {
  icon: ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
  active?: boolean;
}) {
  const className = `flex w-full items-center gap-4 rounded-2xl px-4 py-3.5 text-left text-base font-medium transition ${
    active
      ? "bg-white/10 text-white"
      : "text-white/70 hover:bg-white/5 hover:text-white"
  }`;
  const content = (
    <>
      <span className={active ? "text-neon-cyan" : ""}>{icon}</span>
      {label}
    </>
  );
  return href ? (
    <Link href={href} className={className} onClick={onClick}>
      {content}
    </Link>
  ) : (
    <button type="button" className={className} onClick={onClick}>
      {content}
    </button>
  );
}

/** Top bar for pages rendered inside the Spotify player context */
export default function PlayerHeader() {
  const player = useSpotifyPlayer();
  return <Header player={player} />;
}

export function Header({ player }: { player?: Spotify.Player | null }) {
  const router = useRouter();
  const resetGame = useResetGame();
  const [isNavOpen, setIsNavOpen] = useState(false);

  const close = () => setIsNavOpen(false);

  useEffect(() => {
    if (!isNavOpen) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsNavOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isNavOpen]);

  const resetPlaylistCb = useCallback(() => {
    player?.pause();
    resetGame();
    setIsNavOpen(false);
  }, [player, resetGame]);

  const logout = () => {
    player?.pause();
    localStorage.removeItem("spotify_access_token");
    localStorage.removeItem("spotify_refresh_token");
    window.location.href = "/";
  };

  const iconClass = "h-5 w-5";

  return (
    <>
      <header className="fixed inset-x-0 top-0 z-30 flex h-16 items-center justify-between bg-gradient-to-b from-ink/90 to-transparent px-4">
        <Link href="/" aria-label="TuneQuest home">
          <Logo className="text-xl" />
        </Link>
        <button
          type="button"
          onClick={() => setIsNavOpen(true)}
          aria-label="Open menu"
          className="glass flex h-11 w-11 items-center justify-center rounded-full transition hover:bg-white/10 active:scale-95"
        >
          <FiMenu className="h-5 w-5" />
        </button>
      </header>

      {isNavOpen && (
        <div className="fixed inset-0 z-40" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-ink/70 backdrop-blur-sm animate-fade-in"
            onClick={close}
          />
          <nav className="absolute inset-y-0 right-0 flex w-80 max-w-[85vw] flex-col border-l border-white/10 bg-night/95 p-4 shadow-2xl backdrop-blur-xl animate-slide-in">
            <div className="flex h-12 items-center justify-between pl-2">
              <Logo className="text-lg" />
              <button
                type="button"
                onClick={close}
                aria-label="Close menu"
                className="flex h-11 w-11 items-center justify-center rounded-full text-white/70 transition hover:bg-white/10 hover:text-white"
              >
                <FiX className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 flex flex-col gap-1">
              <MenuItem
                icon={<FiHome className={iconClass} />}
                label="Home"
                href="/"
                onClick={close}
                active={router.pathname === "/"}
              />
              <MenuItem
                icon={<FiCamera className={iconClass} />}
                label="Scan cards"
                href="/scanner"
                onClick={close}
                active={router.pathname === "/scanner"}
              />
              <MenuItem
                icon={<FiList className={iconClass} />}
                label="Playlist mode"
                href="/player"
                onClick={close}
                active={router.pathname === "/player"}
              />
              {router.pathname === "/player" && (
                <MenuItem
                  icon={<FiRefreshCw className={iconClass} />}
                  label="Choose another playlist"
                  onClick={resetPlaylistCb}
                />
              )}
            </div>

            <div className="mt-auto flex flex-col gap-1 border-t border-white/10 pt-4">
              <MenuItem
                icon={<FiLogOut className={iconClass} />}
                label="Log out"
                onClick={logout}
              />
              <p className="px-4 pt-3 text-xs text-white/30">
                v{packageJson.version}
              </p>
            </div>
          </nav>
        </div>
      )}
    </>
  );
}
