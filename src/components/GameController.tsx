import React, { useEffect, useState } from "react";
import {
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";
import { useRecoilValue } from "recoil";
import NoSleep from "nosleep.js";
import { FiRefreshCw } from "react-icons/fi";
import PlayerConnecting from "./PlayerConnecting";
import PlaylistImport from "./PlaylistImport";
import {
  playedSongsAtom,
  playlistAtom,
  playlistInfoAtom,
  songAtom,
  usePlayNextSong,
  useResetGame,
} from "./state";
import { fetchSong, getInitialReleaseDate } from "./getPlaylistItems";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { usePlayTrack } from "./usePlayTrack";
import GameStage from "./ui/GameStage";
import PlaybackControls from "./ui/PlaybackControls";

type Props = {
  token: string;
};

export default function GameController({ token }: Props) {
  const player = useSpotifyPlayer();
  const device = usePlayerDevice();
  const song = useRecoilValue(songAtom);
  const playlistInfo = useRecoilValue(playlistInfoAtom);
  const playlistItems = useRecoilValue(playlistAtom);
  const playedSongs = useRecoilValue(playedSongsAtom);
  const { playNextSong, songsLeft } = usePlayNextSong();
  const resetGame = useResetGame();
  const playTrack = usePlayTrack(token);
  const [revealed, setRevealed] = useState(false);
  const [releaseDate, setReleaseDate] = useState<string | null>(null);
  const [image, setImage] = useState<string | undefined>();

  const showPlaylistAdder = !playlistItems || playlistItems.length === 0;
  const finished = !song && playedSongs.length > 0 && songsLeft <= 0;
  const canPlay = !!player && !!device;

  useEffect(() => {
    const noSleep = new NoSleep();
    noSleep.enable().catch(() => {});
    return () => noSleep.disable();
  }, []);

  useEffect(() => {
    if (!player) return;
    const onAuthError = () => onTokenExpiry();
    player.addListener("authentication_error", onAuthError);
    return () => {
      player.removeListener("authentication_error", onAuthError);
    };
  }, [player]);

  // Play a new song as soon as it is picked and look up its original release year meanwhile
  useEffect(() => {
    setRevealed(false);
    setReleaseDate(null);
    setImage(song?.image);
    if (!song || !canPlay) return;
    playTrack(song.id);
    let cancelled = false;
    // Playlists imported before covers were stored have no image yet
    if (!song.image) {
      fetchSong(song.id, token)
        .then((track) => {
          if (!cancelled) setImage(track.image);
        })
        .catch(() => {});
    }
    getInitialReleaseDate(song, token)
      .catch(() => song.releaseDate)
      .then((date) => {
        if (!cancelled) setReleaseDate(date);
      });
    return () => {
      cancelled = true;
    };
    // Only react to a different song, not to a changed setting or token
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [song?.id, canPlay]);

  // No pause here: the play request replaces the current song, and a pause sent right
  // before it can arrive after the new song started and stop it again.
  const nextSong = () => {
    // Unlock audio in the user gesture, mobile browsers block playback otherwise
    player?.activateElement().catch(() => {});
    playNextSong();
  };

  const choosePlaylist = () => {
    player?.pause();
    resetGame();
  };

  if (player === null || device === null) return <PlayerConnecting />;
  if (showPlaylistAdder) return <PlaylistImport token={token} />;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-20">
      <div className="mb-6 text-center animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Playlist
        </p>
        <h1 className="mt-1 line-clamp-1 font-display text-xl font-bold">
          {playlistInfo.name}
        </h1>
        <p className="mt-1 text-sm text-white/50">
          {songsLeft} of {playlistInfo.length} songs left
        </p>
      </div>

      {finished ? (
        <div className="glass flex flex-1 flex-col items-center justify-center gap-4 rounded-3xl p-8 text-center animate-fade-up">
          <span className="text-5xl">🎉</span>
          <h2 className="font-display text-2xl font-bold">Playlist finished</h2>
          <p className="text-white/60">
            You played all {playlistInfo.length} songs.
          </p>
          <button className="btn btn-primary mt-2 w-full" onClick={choosePlaylist}>
            <FiRefreshCw /> Choose another playlist
          </button>
        </div>
      ) : (
        <>
          <div className="animate-fade-up [animation-delay:100ms]">
            <GameStage
              song={song && { ...song, image }}
              releaseDate={releaseDate}
              revealed={revealed}
              onReveal={() => setRevealed(true)}
            />
          </div>

          <div className="mt-8 flex flex-1 flex-col justify-end gap-6">
            {song && (
              <div className="animate-fade-up [animation-delay:200ms]">
                <PlaybackControls player={player} />
              </div>
            )}

            <div className="animate-fade-up [animation-delay:300ms]">
              {!song ? (
                <button className="btn btn-primary w-full py-4 text-lg" onClick={nextSong}>
                  Start game
                </button>
              ) : revealed ? (
                <button className="btn btn-primary w-full py-4 text-lg" onClick={nextSong}>
                  Next song
                </button>
              ) : (
                <button
                  className="btn btn-primary w-full py-4 text-lg"
                  onClick={() => setRevealed(true)}
                >
                  Reveal answer
                </button>
              )}
            </div>
          </div>
        </>
      )}
    </main>
  );
}
