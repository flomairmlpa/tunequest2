import { MouseEvent } from "react";
import { usePlaybackState } from "react-spotify-web-playback-sdk";
import { useRecoilState } from "recoil";
import { FiShuffle } from "react-icons/fi";
import { PlayIcon } from "@/components/PlayIcon";
import { PauseIcon } from "@/components/PauseIcon";
import { RewindIcon } from "@/components/RewindIcon";
import { ForwardIcon } from "@/components/ForwardIcon";
import { randomStartAtom } from "@/components/state";

const SKIP_MS = 10000;

const formatTime = (ms: number) => {
  const seconds = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
};

export default function PlaybackControls({ player }: { player: Spotify.Player }) {
  const playbackState = usePlaybackState(true, 200);
  const [randomStart, setRandomStart] = useRecoilState(randomStartAtom);

  const position = playbackState?.position ?? 0;
  const duration = playbackState?.duration ?? 0;
  const paused = playbackState?.paused ?? true;
  const progress = duration ? Math.min(100, (position / duration) * 100) : 0;

  const seekTo = (event: MouseEvent<HTMLDivElement>) => {
    if (!duration) return;
    const rect = event.currentTarget.getBoundingClientRect();
    const ratio = (event.clientX - rect.left) / rect.width;
    player.seek(Math.round(ratio * duration));
  };

  return (
    <div className="w-full">
      <div
        className="group relative h-6 cursor-pointer touch-none"
        onClick={seekTo}
        role="slider"
        aria-label="Song position"
        aria-valuemin={0}
        aria-valuemax={duration}
        aria-valuenow={position}
      >
        <div className="absolute inset-x-0 top-1/2 h-1.5 -translate-y-1/2 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-gradient-to-r from-neon-pink via-neon-violet to-neon-cyan transition-[width] duration-200 ease-linear"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div
          className="absolute top-1/2 h-4 w-4 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_rgba(62,230,255,0.8)] transition-[left] duration-200 ease-linear group-hover:scale-110"
          style={{ left: `${progress}%` }}
        />
      </div>
      <div className="flex justify-between text-xs tabular-nums text-white/50">
        <span>{formatTime(position)}</span>
        <span>{formatTime(duration)}</span>
      </div>

      <div className="mt-4 flex items-center justify-center gap-10">
        <button
          type="button"
          className="rounded-full p-2 transition active:scale-90"
          onClick={() => player.seek(Math.max(0, position - SKIP_MS))}
          aria-label="Rewind 10 seconds"
        >
          <RewindIcon className="h-9 w-9 stroke-white/70 transition hover:stroke-white" />
        </button>
        <button
          type="button"
          className="relative flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-neon-pink to-neon-violet shadow-xl shadow-neon-pink/30 transition active:scale-95"
          onClick={() => (paused ? player.resume() : player.pause())}
          aria-label={paused ? "Play" : "Pause"}
        >
          {!paused && (
            <span className="absolute inset-0 rounded-full bg-neon-pink/40 animate-ping-slow" />
          )}
          {paused ? (
            <PlayIcon className="relative ml-1 h-9 w-9 fill-white" />
          ) : (
            <PauseIcon className="relative h-9 w-9 fill-white" />
          )}
        </button>
        <button
          type="button"
          className="rounded-full p-2 transition active:scale-90"
          onClick={() => player.seek(position + SKIP_MS)}
          aria-label="Fast-forward 10 seconds"
        >
          <ForwardIcon className="h-9 w-9 stroke-white/70 transition hover:stroke-white" />
        </button>
      </div>

      <div className="mt-5 flex justify-center">
        <button
          type="button"
          onClick={() => setRandomStart((value) => !value)}
          aria-pressed={randomStart}
          className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium ring-1 ring-inset transition ${
            randomStart
              ? "bg-neon-cyan/15 text-neon-cyan ring-neon-cyan/50"
              : "text-white/60 ring-white/15 hover:text-white/80"
          }`}
        >
          <FiShuffle className="h-3.5 w-3.5" />
          Random start {randomStart ? "on" : "off"}
        </button>
      </div>
    </div>
  );
}
