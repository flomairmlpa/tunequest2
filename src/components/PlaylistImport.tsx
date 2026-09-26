import { FormEvent, useState } from "react";
import dayjs from "dayjs";
import { useSetRecoilState } from "recoil";
import { FiArrowRight, FiList, FiX } from "react-icons/fi";
import {
  playlistAtom,
  playlistIndexAtom,
  playlistInfoAtom,
  useRecentPlaylists,
} from "./state";
import { fetchAllPlaylistTracks } from "./getPlaylistItems";

type Props = {
  token: string;
};

const playlistRegex = /open\.spotify\.com\/playlist\/([a-zA-Z0-9]+)/;

const App: React.FC<Props> = ({ token }) => {
  const setPlaylistItems = useSetRecoilState(playlistAtom);
  const setPlaylistInfo = useSetRecoilState(playlistInfoAtom);
  const setPlaylistIndex = useSetRecoilState(playlistIndexAtom);
  const [url, setUrl] = useState<string>("");
  const [loadingId, setLoadingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { recentPlaylists, addRecentPlaylist, removeRecentPlaylist } =
    useRecentPlaylists();

  const loadPlaylist = async (playlistId: string) => {
    setLoadingId(playlistId);
    setError(null);
    try {
      const { tracks, name } = await fetchAllPlaylistTracks(playlistId, token);
      if (!tracks.length) throw new Error("Empty playlist");
      addRecentPlaylist({ id: playlistId, name, songCount: tracks.length });
      setPlaylistItems(tracks);
      setPlaylistInfo({ name, length: tracks.length });
      setPlaylistIndex(-1);
    } catch (e) {
      console.error(e);
      setError("Could not load this playlist. Is it public?");
    } finally {
      setLoadingId(null);
    }
  };

  const getPlaylist = async (event: FormEvent) => {
    event.preventDefault();
    const match = playlistRegex.exec(url);
    if (!match) {
      setError("That does not look like a Spotify playlist link.");
      return;
    }
    await loadPlaylist(match[1]);
  };

  const loadingUrl = loadingId !== null && loadingId === playlistRegex.exec(url)?.[1];

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col justify-center px-5 pb-10 pt-20">
      <div className="flex flex-col items-center text-center animate-fade-up">
        <div className="flex h-16 w-16 items-center justify-center rounded-3xl bg-gradient-to-br from-neon-cyan to-neon-violet text-ink shadow-lg shadow-neon-cyan/30">
          <FiList className="h-8 w-8" />
        </div>
        <h1 className="mt-5 font-display text-2xl font-bold">Pick a playlist</h1>
        <p className="mt-2 text-white/60">
          Paste a link to any public Spotify playlist. Songs are played in random order.
        </p>
      </div>

      <form
        onSubmit={getPlaylist}
        className="glass mt-8 flex flex-col gap-3 rounded-3xl p-4 animate-fade-up [animation-delay:150ms]"
      >
        <label htmlFor="playlist" className="sr-only">
          Playlist URL
        </label>
        <input
          type="url"
          id="playlist"
          value={url}
          placeholder="https://open.spotify.com/playlist/…"
          onChange={(e) => {
            setUrl(e.target.value);
            setError(null);
          }}
          className="w-full rounded-2xl border-0 bg-ink/60 px-4 py-3.5 text-white ring-1 ring-inset ring-white/10 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
        />
        {error && (
          <p className="px-1 text-sm text-neon-pink animate-fade-in">{error}</p>
        )}
        <button
          type="submit"
          disabled={loadingId !== null || !url}
          className="btn btn-primary w-full"
        >
          {loadingUrl ? (
            <>
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-white/30 border-t-white" />
              Loading songs…
            </>
          ) : (
            <>
              Load playlist <FiArrowRight />
            </>
          )}
        </button>
      </form>

      {recentPlaylists.length > 0 && (
        <section className="mt-8 animate-fade-up [animation-delay:300ms]">
          <h2 className="px-1 text-sm font-semibold uppercase tracking-wider text-white/50">
            Recently played
          </h2>
          <ul className="glass mt-3 divide-y divide-white/10 overflow-hidden rounded-3xl">
            {recentPlaylists.map((playlist) => (
              <li key={playlist.id} className="flex items-center">
                <button
                  onClick={() => loadPlaylist(playlist.id)}
                  disabled={loadingId !== null}
                  className="min-w-0 flex-1 px-4 py-3 text-left transition hover:bg-white/5 disabled:opacity-50"
                >
                  <p className="truncate font-semibold">{playlist.name}</p>
                  <p className="text-xs text-white/50">
                    {loadingId === playlist.id
                      ? "Loading songs…"
                      : `${playlist.songCount} songs · ${dayjs(
                          playlist.lastPlayedAt
                        ).format("DD.MM.YYYY")}`}
                  </p>
                </button>
                <button
                  onClick={() => removeRecentPlaylist(playlist.id)}
                  aria-label={`Remove ${playlist.name}`}
                  className="px-4 py-3 text-white/40 transition hover:text-white"
                >
                  <FiX className="h-5 w-5" />
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
};

export default App;
