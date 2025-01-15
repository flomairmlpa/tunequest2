import { usePlaybackState } from "react-spotify-web-playback-sdk";

export default function ProgressBar() {
  const playbackState = usePlaybackState(true, 100);

  return (
    <progress
      className="rounded-full progress-filled:bg-green-500 w-full border-red-500 bg-red-500"
      value={playbackState?.position}
      max={playbackState?.duration}
    />
  );
}
