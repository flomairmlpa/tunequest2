import Player = Spotify.Player;
import { RewindIcon } from "@/components/RewindIcon";
import { usePlaybackState } from "react-spotify-web-playback-sdk";
import { ImPrevious2 } from "react-icons/im";
export function PrevButton({
  player,
  amount = 10,
}: {
  player: Player;
  amount?: number;
}) {
  const playbackState = usePlaybackState(true, 100);

  return (
    <button
      type="button"
      className="group relative rounded-full focus:outline-none"
      onClick={() => player.previousTrack()}
      aria-label={`Rewind ${amount} seconds`}
    >
      <div className="absolute -inset-4 -right-2 md:hidden" />
      <ImPrevious2 className="h-12 w-12 stroke-slate-500 group-hover:stroke-slate-700" />
    </button>
  );
}
