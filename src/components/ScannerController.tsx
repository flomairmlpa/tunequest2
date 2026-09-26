import React, { useEffect, useState } from "react";
import {
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";
import Link from "next/link";
import NoSleep from "nosleep.js";
import { FiCamera } from "react-icons/fi";
import QRCodeScanner from "@/components/QRCodeScanner";
import PlayerConnecting from "./PlayerConnecting";
import { fetchSong, getInitialReleaseDate } from "./getPlaylistItems";
import { Song } from "./state";
import { usePlayTrack } from "./usePlayTrack";
import GameStage from "./ui/GameStage";
import PlaybackControls from "./ui/PlaybackControls";
import ScanOverlay from "./ui/ScanOverlay";

type Props = {
  token: string;
};

export default function GameController({ token }: Props) {
  const player = useSpotifyPlayer();
  const device = usePlayerDevice();
  const playTrack = usePlayTrack(token);
  const [showScanner, setShowScanner] = useState<boolean>(true);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [revealed, setRevealed] = useState<boolean>(false);

  useEffect(() => {
    if (!showScanner) {
      const noSleep = new NoSleep();
      noSleep.enable().catch(() => {});
      return () => noSleep.disable();
    }
  }, [showScanner]);

  const handleQrResult = async (trackId: string) => {
    setShowScanner(false);
    setRevealed(false);
    setReleaseDate(null);
    setCurrentTrack(null);
    if (device === null) return;

    playTrack(trackId);

    try {
      const song = await fetchSong(trackId, token);
      setCurrentTrack(song);
      // Look up the original release year right away so the reveal is instant
      const date = await getInitialReleaseDate(song, token).catch(
        () => song.releaseDate
      );
      setReleaseDate(date);
    } catch (error) {
      console.error("Failed to fetch track info:", error);
    }
  };

  const goToNext = () => {
    player?.pause();
    setShowScanner(true);
    setCurrentTrack(null);
    setRevealed(false);
    setReleaseDate(null);
  };

  if (device === null || player === null) return <PlayerConnecting />;

  return (
    <>
      {/* Always render scanner to avoid Safari camera permission prompts */}
      <QRCodeScanner handleSpotifyTrackId={handleQrResult} isActive={showScanner} />

      {showScanner && (
        <ScanOverlay>
          <Link href="/" className="btn btn-ghost w-full max-w-sm">
            Back
          </Link>
        </ScanOverlay>
      )}

      {!showScanner && (
        <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-20">
          <div className="mb-6 text-center animate-fade-up">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              Now playing
            </p>
            <h1 className="mt-1 font-display text-xl font-bold">
              When was this released?
            </h1>
          </div>

          <div className="animate-fade-up [animation-delay:100ms]">
            <GameStage
              song={currentTrack}
              releaseDate={releaseDate}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
            />
          </div>

          <div className="mt-8 flex flex-1 flex-col justify-end gap-6">
            <div className="animate-fade-up [animation-delay:200ms]">
              <PlaybackControls player={player} />
            </div>

            <div className="flex flex-col gap-3 animate-fade-up [animation-delay:300ms]">
              {revealed ? (
                <button className="btn btn-primary w-full py-4 text-lg" onClick={goToNext}>
                  <FiCamera /> Scan next card
                </button>
              ) : (
                <>
                  <button
                    className="btn btn-primary w-full py-4 text-lg"
                    onClick={() => setRevealed(true)}
                    disabled={!currentTrack}
                  >
                    Reveal answer
                  </button>
                  <button className="btn btn-ghost w-full" onClick={goToNext}>
                    <FiCamera /> Scan another card
                  </button>
                </>
              )}
            </div>
          </div>
        </main>
      )}
    </>
  );
}
