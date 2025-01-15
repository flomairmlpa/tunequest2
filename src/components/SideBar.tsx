import { useCallback, useState } from "react";
import { useSpotifyPlayer } from "react-spotify-web-playback-sdk";
import { useResetRecoilState } from "recoil";
import { playlistAtom, playlistIndexAtom } from "./state";

export default function Header() {
  const player = useSpotifyPlayer();

  const resetPlaylistIndex = useResetRecoilState(playlistIndexAtom);
  const resetPlaylist = useResetRecoilState(playlistAtom);

  const [isNavOpen, setIsNavOpen] = useState(false);
  const resetPlaylistCb = useCallback(() => {
    player?.pause();
    resetPlaylist();
    resetPlaylistIndex();
    setIsNavOpen(false);
  }, [player, resetPlaylist, resetPlaylistIndex]);
  const logout = () => {
    localStorage.removeItem("spotify_access_token");
    window.location.href = "/";
  };

  return (
    <div className="flex items-center justify-between py-16">
      <nav>
        <section className="MOBILE-MENU flex">
          <div className="absolute top-0 right-0 px-8 py-8">
            <div
              className="HAMBURGER-ICON space-y-2"
              onClick={() => setIsNavOpen((prev) => !prev)}
            >
              <span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
              <span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
              <span className="block h-0.5 w-8 animate-pulse bg-gray-600"></span>
            </div>
          </div>

          <div className={isNavOpen ? "showMenuNav" : "hideMenuNav"}>
            <div
              className="absolute top-0 right-0 px-8 py-8"
              onClick={() => setIsNavOpen(false)}
            >
              <svg
                className="h-8 w-8 text-gray-600"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            </div>
            <ul className="flex flex-col items-center justify-between min-h-[250px] text-4xl">
              <li className="border-b border-gray-400 my-8 uppercase">
                <a onClick={logout}>Logout</a>
              </li>
              <li className="border-b border-gray-400 my-8 uppercase">
                <a href="/palyer">Playlist Mode</a>
              </li>
              <li className="border-b border-gray-400 my-8 uppercase">
                <a href="/scanner">Scann</a>
              </li>
              <li className="border-b border-gray-400 my-8 uppercase">
                <a onClick={resetPlaylistCb}>Select new Playlist</a>
              </li>
            </ul>
          </div>
        </section>

        {/* <ul className="DESKTOP-MENU hidden space-x-8 lg:flex">
          <li>
            <a href="/about">About</a>
          </li>
          <li>
            <a href="/portfolio">Portfolio</a>
          </li>
          <li>
            <a href="/contact">Contact</a>
          </li>
        </ul> */}
      </nav>
      <style>{`
      .hideMenuNav {
        display: none;
      }
      .showMenuNav {
        display: block;
        position: absolute;
        width: 100%;
        height: 100vh;
        top: 0;
        left: 0;
        background: white;
        z-index: 10;
        display: flex;
        flex-direction: column;
        justify-content: space-evenly;
        align-items: center;
      }
    `}</style>
    </div>
  );
}
