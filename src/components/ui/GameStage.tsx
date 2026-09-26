import { usePlaybackState } from "react-spotify-web-playback-sdk";
import { Song } from "@/components/state";
import Vinyl from "./Vinyl";

type Props = {
  song: Song | null;
  /** Release date used for the answer; undefined while it is still being looked up */
  releaseDate?: string | null;
  revealed: boolean;
  onReveal?: () => void;
};

// Bright, Hitster-like card colors per decade
const decadeColors: [number, string][] = [
  [2020, "from-pink-300 to-violet-300"],
  [2010, "from-sky-200 to-indigo-300"],
  [2000, "from-emerald-200 to-cyan-300"],
  [1990, "from-violet-300 to-sky-200"],
  [1980, "from-fuchsia-300 to-cyan-200"],
  [1970, "from-orange-300 to-pink-300"],
  [1960, "from-amber-200 to-lime-200"],
  [0, "from-rose-300 to-orange-200"],
];

const cardColor = (year: number) =>
  decadeColors.find(([decade]) => year >= decade)?.[1] ?? decadeColors[0][1];

function Equalizer({ playing }: { playing: boolean }) {
  return (
    <div className="flex h-6 items-end gap-1">
      {[0, -0.4, -0.2, -0.6].map((delay, i) => (
        <span
          key={i}
          className="h-full w-1.5 origin-bottom rounded-full bg-gradient-to-t from-neon-pink to-neon-cyan animate-eq"
          style={{
            animationDelay: `${delay}s`,
            animationPlayState: playing ? "running" : "paused",
          }}
        />
      ))}
    </div>
  );
}

/**
 * The card works like a record sleeve: the vinyl slides out while a song plays and the
 * sleeve flips around to reveal the answer, just like turning over a Hitster card.
 */
export default function GameStage({ song, releaseDate, revealed, onReveal }: Props) {
  const playbackState = usePlaybackState();
  const playing = !!song && playbackState?.paused === false;
  const year = releaseDate ? Number(releaseDate.slice(0, 4)) : null;

  return (
    <div className="relative mx-auto h-64 w-full max-w-[22rem]">
      <div
        className={`absolute left-1/2 top-0 h-64 w-64 -translate-x-1/2 transition-[margin] duration-700 ease-out ${
          song ? "-ml-11" : ""
        }`}
      >
        <Vinyl
          spinning={playing}
          image={revealed ? song?.image : undefined}
          className={`!absolute left-3 top-3 h-[14.5rem] w-[14.5rem] transition-transform duration-700 ease-out ${
            song ? "translate-x-[5.5rem]" : ""
          }`}
        />

        <button
          type="button"
          onClick={onReveal}
          disabled={!song || revealed}
          aria-label={revealed ? "Answer" : "Reveal the answer"}
          className="relative block h-64 w-64 [perspective:1200px] disabled:cursor-default"
        >
          <div
            className={`relative h-full w-full transition-transform duration-700 [transform-style:preserve-3d] ${
              revealed ? "[transform:rotateY(180deg)]" : ""
            }`}
          >
            {/* Front: the sleeve */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 overflow-hidden rounded-3xl bg-night p-6 ring-1 ring-white/10 shadow-2xl shadow-black/60 [backface-visibility:hidden]">
              <div className="absolute inset-0 rounded-3xl bg-[radial-gradient(circle_at_30%_20%,rgba(255,79,163,0.25),transparent_60%),radial-gradient(circle_at_80%_90%,rgba(62,230,255,0.2),transparent_55%)]" />
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-neon-pink/30" />
              <span className="relative font-display text-8xl font-extrabold text-gradient">
                ?
              </span>
              {song ? (
                <div className="relative flex flex-col items-center gap-3">
                  <Equalizer playing={playing} />
                  <span className="text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                    Tap to reveal
                  </span>
                </div>
              ) : (
                <span className="relative text-xs font-medium uppercase tracking-[0.2em] text-white/60">
                  Ready when you are
                </span>
              )}
            </div>

            {/* Back: the answer */}
            <div
              className={`absolute inset-0 flex flex-col items-center justify-between rounded-3xl bg-gradient-to-br p-5 text-center text-ink shadow-2xl shadow-black/60 [backface-visibility:hidden] [transform:rotateY(180deg)] ${
                year ? cardColor(year) : "from-slate-200 to-slate-300"
              }`}
            >
              {revealed && song && (
                <>
                  <p className="line-clamp-2 text-base font-semibold leading-tight animate-fade-up [animation-delay:250ms]">
                    {song.artists}
                  </p>
                  {year ? (
                    <p className="font-display text-7xl font-extrabold tracking-tight animate-pop [animation-delay:350ms]">
                      {year}
                    </p>
                  ) : (
                    <div className="h-10 w-10 animate-spin rounded-full border-4 border-ink/20 border-t-ink" />
                  )}
                  <p className="line-clamp-2 text-base font-medium italic leading-tight animate-fade-up [animation-delay:450ms]">
                    {song.name}
                  </p>
                </>
              )}
            </div>
          </div>
        </button>
      </div>
    </div>
  );
}
