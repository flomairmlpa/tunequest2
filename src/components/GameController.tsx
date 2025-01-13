import React, {
  MutableRefObject,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import {
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";
import QRCodeScanner from "@/components/QRCodeScanner";
import Link from "next/link";
import { PlayButton } from "@/components/PlayButton";
import { ForwardButton } from "@/components/ForwardButton";
import { RewindButton } from "@/components/RewindButton";
import ProgressBar from "@/components/ProgressBar";
import NoSleep from "nosleep.js";
import { useRecoilValue, useResetRecoilState, useSetRecoilState } from "recoil";
import { playlistAtom, playlistIndexAtom, songAtom } from "./state";
import PlaylistImport from "./PlaylistImport";
import dayjs from "dayjs";
import Lottie, { LottieRefCurrentProps } from "lottie-react";
import disk from "./disk.json";
type Props = {
  token: string;
};

const hitsterMapping = {
  de: {
    "00300": "spotify:track:5IMtdHjJ1OtkxbGe4zfUxQ",
  },
};

export default function GameController({ token }: Props) {
  const player = useSpotifyPlayer();
  const device = usePlayerDevice();
  const item = useRecoilValue(songAtom);
  const resetPlaylistIndex = useResetRecoilState(playlistIndexAtom);
  const resetPlaylist = useResetRecoilState(playlistAtom);
  const playlistItems = useRecoilValue(playlistAtom);
  const setplaylistIndex = useSetRecoilState(playlistIndexAtom);
  const playlistIndex = useRecoilValue(playlistIndexAtom);
  const [showScanner, setShowScanner] = useState<boolean>(false);
  const [randomStart, setRandomStart] = useState<boolean>(false);
  const showPlaylistAdder = !playlistItems || playlistItems.length === 0;
  console.log("playlistItems", playlistItems, showPlaylistAdder);
  const lottieRef: MutableRefObject<LottieRefCurrentProps | null> =
    useRef(null);
  useEffect(() => {
    if (!showScanner) {
      const noSleep = new NoSleep();
      noSleep.enable();
    }
  }, [showScanner]);

  useEffect(() => {
    player?.addListener("player_state_changed", (state) => {
      console.log("player_state_changed", state);
      lottieRef.current?.setSpeed(state.paused ? 0 : 1);
    });
  }, [player, lottieRef]);
  const handleQrResult = useCallback(
    (trackId: string) => {
      setShowScanner(false);
      if (device === null) return;
      // set position to random value between 0 and 60 seconds
      let position = randomStart ? Math.floor(Math.random() * 60000) : 0;

      fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${device?.device_id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            uris: [`spotify:track:${trackId}`],
            position_ms: position,
          }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    [device, token, randomStart]
  );
  const resetPlaylistCb = useCallback(() => {
    player?.pause();
    resetPlaylist();
    resetPlaylistIndex();
  }, [player, resetPlaylist, resetPlaylistIndex]);
  const setRandomItemIndex = useCallback(() => {
    player?.pause();
    setplaylistIndex(Math.floor(Math.random() * (playlistItems ?? []).length));
  }, [player, playlistItems, setplaylistIndex]);

  useEffect(() => {
    if (item) handleQrResult(item?.track.id);
  }, [handleQrResult, item]);

  const goToNext = () => {
    // player?.pause();
    setShowScanner(true);
  };
  useEffect(() => {}, [showScanner]);
  if (device === null) return null;
  if (player === null) return null;

  return (
    <div className="relative flex flex-col justify-around w-full min-h-screen bg-gradient-to-t from-purple-200 to-pink-200">
      {!showPlaylistAdder && (
        <>
          <>
            <div className="flex flex-col w-full sm:w-2/5 py-24 px-4 mx-auto">
              <h1 className="w-full text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-12">
                <span className="text-indigo-500">Tune</span>Quest
              </h1>
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  border: showScanner ? "3px solid #ccc" : "none",
                  gap: 2,
                  height: "20rem",
                  marginBottom: "2rem",
                  // backgroundColor: "red",s
                }}
              >
                {!showScanner && (
                  <Lottie
                    animationData={disk}
                    loop={true}
                    lottieRef={lottieRef}
                  />
                )}
                {showScanner && (
                  <div className="relative w-64 h-80  text-gray-800  flex flex-col items-center justify-center p-4">
                    <h2 className="absolute top-4 text-2xl font-semibold text-center">
                      {item?.track.artists
                        .map((artist) => artist.name)
                        .join(", ")}
                    </h2>

                    <h1 className="text-8xl font-bold leading-tight text-center">
                      {dayjs(item?.track.album.release_date).format("YYYY")}
                    </h1>

                    {/* Song Title */}
                    <p className="absolute bottom-8 text-2xl text-base font-light text-center">
                      {item?.track.name}
                    </p>
                  </div>
                )}
              </div>
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="randomStart"
                  name="randomStart"
                  checked={randomStart}
                  onChange={(event) => setRandomStart(event.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <label
                  htmlFor="randomStart"
                  className="ms-2 text-sm font-medium"
                >
                  {" "}
                  Random start between 0 and 60s
                </label>
              </div>
              <div className="mb-8">
                <ProgressBar />
              </div>
              <div className="flex justify-around gap-x-6">
                <RewindButton player={player} amount={10} />
                <PlayButton player={player} />
                <ForwardButton player={player} amount={10} />
              </div>
              <div className="mt-16 flex w-full" style={{ gap: 4 }}>
                {!showScanner && (
                  <button
                    className="w-full rounded-md bg-white bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-opacity-60"
                    onClick={() => goToNext()}
                  >
                    SHOW DETAILS
                  </button>
                )}
                {showScanner && (
                  <button
                    className="w-full rounded-md bg-white bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-opacity-60"
                    onClick={setRandomItemIndex}
                  >
                    PLAY NEXT SONG
                  </button>
                )}
              </div>
              <button
                style={{ marginTop: "2rem" }}
                className="w-full rounded-md bg-white bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-opacity-60"
                onClick={resetPlaylistCb}
              >
                Reset Playlist
              </button>
            </div>
          </>
        </>
      )}
      {showPlaylistAdder && <PlaylistImport token={token} />}
    </div>
  );
}
