import { FormEvent, useState } from "react";
import { useSetRecoilState } from "recoil";
import { FiArrowRight, FiList } from "react-icons/fi";
import { playlistAtom, playlistIndexAtom, playlistInfoAtom } from "./state";
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
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getPlaylist = async (event: FormEvent) => {
    event.preventDefault();
    const match = playlistRegex.exec(url);
    if (!match) {
      setError("That does not look like a Spotify playlist link.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const { tracks, name } = await fetchAllPlaylistTracks(match[1], token);
      if (!tracks.length) throw new Error("Empty playlist");
      setPlaylistItems(tracks);
      setPlaylistInfo({ name, length: tracks.length });
      setPlaylistIndex(-1);
    } catch (e) {
      console.error(e);
      setError("Could not load this playlist. Is it public?");
    } finally {
      setLoading(false);
    }
  };

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
        <button type="submit" disabled={loading || !url} className="btn btn-primary w-full">
          {loading ? (
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
    </main>
  );
};

export default App;
