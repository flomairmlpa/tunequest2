import Player = Spotify.Player;
import { RewindIcon } from "@/components/RewindIcon";
import { usePlaybackState } from "react-spotify-web-playback-sdk";
import { ImNext2 } from "react-icons/im";
export function NextButton({
  setRandomItemIndex,
}: {
  setRandomItemIndex: () => void;
}) {
  return (
    <button
      type="button"
      className="group relative rounded-full focus:outline-none"
      onClick={setRandomItemIndex}
    >
      <div className="absolute -inset-4 -right-2 md:hidden" />
      <ImNext2 className="h-12 w-12 stroke-slate-500 group-hover:stroke-slate-700" />
    </button>
  );
}
