import React, { useEffect, useState } from "react";
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
import { getInitialReleaseDate } from "./getPlaylistItems";
import dayjs from "dayjs";
import { Song } from "./state";

type Props = {
  token: string;
};

export default function GameController({ token }: Props) {
  const player = useSpotifyPlayer();
  const device = usePlayerDevice();
  const [showScanner, setShowScanner] = useState<boolean>(true);
  const [randomStart, setRandomStart] = useState<boolean>(false);
  const [currentTrack, setCurrentTrack] = useState<Song | null>(null);
  const [showReleaseYear, setShowReleaseYear] = useState<boolean>(false);
  const [correctedReleaseDate, setCorrectedReleaseDate] = useState<
    string | null
  >(null);
  const [isLoadingYear, setIsLoadingYear] = useState<boolean>(false);

  useEffect(() => {
    if (!showScanner) {
      const noSleep = new NoSleep();
      noSleep.enable();
    }
  }, [showScanner]);
  const handleQrResult = async (trackId: string) => {
    setShowScanner(false);
    setShowReleaseYear(false);
    setCorrectedReleaseDate(null);
    if (device === null) return;
    // set position to random value between 0 and 60 seconds
    let position = randomStart ? Math.floor(Math.random() * 60000) : 0;

    // Fetch track info to get release date
    try {
      const trackResponse = await fetch(
        `https://api.spotify.com/v1/tracks/${trackId}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (trackResponse.ok) {
        const trackData = await trackResponse.json();
        const song: Song = {
          id: trackData.id,
          name: trackData.name,
          artists: trackData.artists.map((a: any) => a.name).join(", "),
          releaseDate: trackData.album.release_date,
        };
        setCurrentTrack(song);
      }
    } catch (error) {
      console.error("Failed to fetch track info:", error);
    }

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
  };

  const handleShowReleaseYear = async () => {
    if (!currentTrack) return;

    setIsLoadingYear(true);
    try {
      const correctedDate = await getInitialReleaseDate(currentTrack, token);
      setCorrectedReleaseDate(correctedDate);
      setShowReleaseYear(true);
    } catch (error) {
      console.error("Failed to get corrected release date:", error);
      setCorrectedReleaseDate(currentTrack.releaseDate);
      setShowReleaseYear(true);
    } finally {
      setIsLoadingYear(false);
    }
  };

  const goToNext = () => {
    player?.pause();
    setShowScanner(true);
    setCurrentTrack(null);
    setShowReleaseYear(false);
    setCorrectedReleaseDate(null);
  };

  if (device === null) return null;
  if (player === null) return null;

  return (
    <div className="relative flex flex-col justify-around w-full min-h-screen bg-gradient-to-t from-purple-200 to-pink-200">
      {/* Always render scanner to avoid Safari camera permission prompts */}
      <QRCodeScanner handleSpotifyTrackId={handleQrResult} isActive={showScanner} />
      
      {showScanner && (
        <>
          <h1 className="fixed top-0 left-1/2 transform -translate-x-1/2 z-10 text-3xl font-bold tracking-tight text-white xs:text-4xl sm:text-5xl lg:text-6xl mt-8 uppercase text-center drop-shadow-lg">
            Scan QR-Code
          </h1>

          <div className="fixed flex w-full mb-4 bottom-0 left-1/2 transform -translate-x-1/2 z-20 px-4">
            <Link
              href="/"
              className="text-center w-full rounded-md bg-white bg-opacity-70 px-3.5 py-2.5 text-sm font-bold text-slate-900 shadow-sm ring-1 ring-inset ring-gray-200 hover:bg-opacity-10"
            >
              Go back
            </Link>
          </div>
        </>
      )}
      {!showScanner && (
        <>
          <div className="flex flex-col w-full sm:w-2/5 py-24 px-4 mx-auto">
            <h1 className="w-full text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-12">
              <span className="text-indigo-500">Tune</span>Quest
            </h1>
            <div className="flex items-center mb-4">
              <input
                type="checkbox"
                id="randomStart"
                name="randomStart"
                checked={randomStart}
                onChange={(event) => setRandomStart(event.target.checked)}
                className="w-4 h-4 rounded"
              />
              <label htmlFor="randomStart" className="ms-2 text-sm font-medium">
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

            {/* Show Release Year Section */}
            {currentTrack && (
              <div className="mt-8">
                {!showReleaseYear ? (
                  <button
                    className="w-full rounded-md bg-indigo-500 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-50 disabled:cursor-not-allowed"
                    onClick={handleShowReleaseYear}
                    disabled={isLoadingYear}
                  >
                    {isLoadingYear ? "Loading..." : "Show Release Year"}
                  </button>
                ) : (
                  <div className="bg-white bg-opacity-70 rounded-lg p-4 text-center shadow-lg">
                    <p className="text-sm text-gray-600 mb-1">
                      {currentTrack.artists}
                    </p>
                    <p className="text-lg font-semibold text-gray-900 mb-2">
                      {currentTrack.name}
                    </p>
                    <p className="text-4xl font-bold text-indigo-600">
                      {dayjs(correctedReleaseDate).format("YYYY")}
                    </p>
                  </div>
                )}
              </div>
            )}

            <div className="mt-8 flex w-full">
              <button
                className="w-full rounded-md bg-white bg-opacity-30 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-opacity-60"
                onClick={() => goToNext()}
              >
                Scan Next Card
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
