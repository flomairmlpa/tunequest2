import { useCallback, useEffect, useState } from "react";
import {
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import NoSleep from "nosleep.js";
import { PlayButton } from "@/components/PlayButton";
import { ForwardButton } from "@/components/ForwardButton";
import { RewindButton } from "@/components/RewindButton";
import ProgressBar from "@/components/ProgressBar";
import PlaylistImport from "@/components/PlaylistImport";
import { getInitialReleaseDate } from "@/components/getPlaylistItems";
import {
  playlistAtom,
  playlistIndexAtom,
  playlistInfoAtom,
  Song,
} from "@/components/state";
import {
  createGame,
  endGameOutOfSongs,
  isGameOver,
  MAX_PLAYERS,
  nextTurn,
  pickRandomSong,
  placeSong,
  SOLO_MAX_MISTAKES,
  startTurn,
  TimelineCard,
  TimelineGame,
  toCard,
} from "@/timeline/rules";
import { timelineGameAtom, timelinePlayerNamesAtom } from "@/timeline/state";

type Props = {
  token: string;
};

// Literal class names so Tailwind keeps them
const playerColors = [
  "bg-rose-500",
  "bg-sky-500",
  "bg-amber-500",
  "bg-emerald-500",
  "bg-violet-500",
  "bg-orange-500",
];
const winTargets = [5, 7, 10, 15];

const primaryButton =
  "w-full rounded-md bg-indigo-500 px-3.5 py-2.5 text-2xl font-semibold text-white shadow-sm hover:bg-indigo-400 disabled:opacity-50";
const secondaryButton =
  "w-full rounded-md bg-white bg-opacity-50 px-3.5 py-2.5 text-sm font-semibold text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-opacity-80";

const playerLabel = (game: TimelineGame, index: number) =>
  game.players[index].name || `Player ${index + 1}`;

export default function TimelineController({ token }: Props) {
  const player = useSpotifyPlayer();
  const device = usePlayerDevice();
  const playlist = useRecoilValue(playlistAtom);
  const playlistInfo = useRecoilValue(playlistInfoAtom);
  const resetPlaylist = useResetRecoilState(playlistAtom);
  const resetPlaylistIndex = useResetRecoilState(playlistIndexAtom);
  const [game, setGame] = useRecoilState(timelineGameAtom);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const noSleep = new NoSleep();
    noSleep.enable();
    return () => noSleep.disable();
  }, []);

  const playSong = useCallback(
    (trackId: string) => {
      if (!device) return;
      fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${device.device_id}`,
        {
          method: "PUT",
          body: JSON.stringify({ uris: [`spotify:track:${trackId}`] }),
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        }
      );
    },
    [device, token]
  );

  // Draws a song and looks up its original release year
  const drawCard = useCallback(
    async (usedSongIds: string[]): Promise<TimelineCard | null> => {
      const song = pickRandomSong(playlist, usedSongIds);
      if (!song) return null;
      const releaseDate = await getInitialReleaseDate(song, token).catch(
        () => song.releaseDate
      );
      return toCard(song, releaseDate);
    },
    [playlist, token]
  );

  const startGame = async (names: string[], winTarget: number) => {
    setBusy(true);
    try {
      const startCards: TimelineCard[] = [];
      while (startCards.length < names.length) {
        const card = await drawCard(startCards.map((c) => c.id));
        if (!card) return;
        startCards.push(card);
      }
      setGame(createGame(names, startCards, winTarget));
    } finally {
      setBusy(false);
    }
  };

  const drawNextSong = async () => {
    if (!game) return;
    setBusy(true);
    try {
      const card = await drawCard(game.usedSongIds);
      if (!card) {
        setGame(endGameOutOfSongs(game));
        return;
      }
      setGame(startTurn(game, card));
      playSong(card.id);
    } finally {
      setBusy(false);
    }
  };

  const continueGame = () => {
    if (!game) return;
    player?.pause();
    setGame(nextTurn(game));
  };

  const quitGame = () => {
    player?.pause();
    setGame(null);
  };

  const changePlaylist = () => {
    resetPlaylist();
    resetPlaylistIndex();
  };

  if (device === null || player === null) return null;

  if (!game && playlist.length === 0) return <PlaylistImport token={token} />;

  return (
    <div className="flex flex-col w-full sm:w-3/5 lg:w-2/5 pb-12 px-4 mx-auto">
      <h1 className="w-full text-center text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl mb-6">
        <span className="text-indigo-500">Tune</span>Quest Timeline
      </h1>

      {!game && (
        <Setup
          playlistName={playlistInfo.name}
          songCount={playlist.length}
          busy={busy}
          onStart={startGame}
          onChangePlaylist={changePlaylist}
        />
      )}

      {game && (
        <>
          <Scoreboard game={game} />

          {game.phase === "handoff" && (
            <div className="flex flex-col items-center gap-6 my-8">
              <p className="text-center text-2xl font-semibold text-gray-900">
                {game.players.length > 1
                  ? `Pass the phone to ${playerLabel(game, game.current)}`
                  : `Mistakes: ${game.players[0].mistakes} / ${SOLO_MAX_MISTAKES}`}
              </p>
              <button
                className={primaryButton}
                onClick={drawNextSong}
                disabled={busy}
              >
                {busy ? "Loading..." : "Play song"}
              </button>
            </div>
          )}

          {(game.phase === "placing" || game.phase === "reveal") && (
            <>
              <div className="my-6">
                <ProgressBar />
                <div className="flex justify-around gap-x-4 mt-6">
                  <RewindButton player={player} amount={10} />
                  <PlayButton player={player} />
                  <ForwardButton player={player} amount={10} />
                </div>
                {game.phase === "placing" && game.song && (
                  <button
                    className="mt-4 w-full text-sm text-gray-600 underline"
                    onClick={() => game.song && playSong(game.song.id)}
                  >
                    Restart song
                  </button>
                )}
              </div>
              <Turn
                game={game}
                onPlace={(slot) => setGame(placeSong(game, slot))}
                onContinue={continueGame}
              />
            </>
          )}

          {game.phase === "finished" && (
            <Finished game={game} onNewGame={quitGame} />
          )}

          {game.phase !== "finished" && (
            <button className={`${secondaryButton} mt-10`} onClick={quitGame}>
              End game
            </button>
          )}
        </>
      )}
    </div>
  );
}

function Setup({
  playlistName,
  songCount,
  busy,
  onStart,
  onChangePlaylist,
}: {
  playlistName: string;
  songCount: number;
  busy: boolean;
  onStart: (names: string[], winTarget: number) => void;
  onChangePlaylist: () => void;
}) {
  const [names, setNames] = useRecoilState(timelinePlayerNamesAtom);
  const [winTarget, setWinTarget] = useState(10);
  // Every player needs a start card plus at least a few songs to play
  const enoughSongs = songCount >= names.length + winTarget;

  const setName = (index: number, name: string) =>
    setNames(names.map((n, i) => (i === index ? name : n)));

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-lg bg-white bg-opacity-70 p-4 shadow-sm">
        <p className="text-xs text-gray-500">Playlist</p>
        <p className="font-semibold text-gray-900 truncate">{playlistName}</p>
        <p className="text-sm text-gray-600">{songCount} songs</p>
        <button
          className="mt-2 text-sm text-indigo-600 underline"
          onClick={onChangePlaylist}
        >
          Change playlist
        </button>
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Players ({names.length}/{MAX_PLAYERS})
        </p>
        <div className="flex flex-col gap-2">
          {names.map((name, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className={`h-4 w-4 rounded-full ${playerColors[i]}`} />
              <input
                type="text"
                value={name}
                placeholder={`Player ${i + 1}`}
                onChange={(e) => setName(i, e.target.value)}
                className="flex-1 rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600"
              />
              {names.length > 1 && (
                <button
                  onClick={() => setNames(names.filter((_, j) => j !== i))}
                  aria-label={`Remove player ${i + 1}`}
                  className="px-2 text-2xl text-gray-400 hover:text-gray-900"
                >
                  ×
                </button>
              )}
            </div>
          ))}
        </div>
        {names.length < MAX_PLAYERS && (
          <button
            className={`${secondaryButton} mt-2`}
            onClick={() => setNames([...names, ""])}
          >
            Add player
          </button>
        )}
        {names.length === 1 && (
          <p className="mt-2 text-sm text-gray-600">
            Solo: reach the goal before making {SOLO_MAX_MISTAKES} mistakes.
          </p>
        )}
      </div>

      <div>
        <p className="text-sm font-semibold text-gray-900 mb-2">
          Songs needed to win
        </p>
        <div className="grid grid-cols-4 gap-2">
          {winTargets.map((target) => (
            <button
              key={target}
              onClick={() => setWinTarget(target)}
              className={`rounded-md px-3 py-2 font-semibold shadow-sm ring-1 ring-inset ring-gray-300 ${
                target === winTarget
                  ? "bg-indigo-500 text-white"
                  : "bg-white bg-opacity-50 text-gray-900"
              }`}
            >
              {target}
            </button>
          ))}
        </div>
      </div>

      {!enoughSongs && (
        <p className="text-sm text-red-600">
          This playlist is too short for {names.length} players and a goal of{" "}
          {winTarget} songs.
        </p>
      )}
      <button
        className={primaryButton}
        disabled={busy || !enoughSongs}
        onClick={() => onStart(names.map((n) => n.trim()), winTarget)}
      >
        {busy ? "Dealing start cards..." : "Start game"}
      </button>
    </div>
  );
}

function Scoreboard({ game }: { game: TimelineGame }) {
  if (game.players.length === 1) {
    const [solo] = game.players;
    return (
      <p className="text-center text-sm text-gray-700">
        {solo.timeline.length} / {game.winTarget} songs · {solo.mistakes} /{" "}
        {SOLO_MAX_MISTAKES} mistakes
      </p>
    );
  }
  return (
    <div className="flex flex-wrap justify-center gap-2">
      {game.players.map((p, i) => (
        <span
          key={i}
          className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-semibold text-white ${
            playerColors[i]
          } ${i === game.current ? "ring-2 ring-offset-2 ring-gray-900" : "opacity-70"}`}
        >
          {playerLabel(game, i)}
          <span className="rounded-full bg-white bg-opacity-30 px-1.5">
            {p.timeline.length}/{game.winTarget}
          </span>
        </span>
      ))}
    </div>
  );
}

function SongCard({
  card,
  highlight,
}: {
  card: Song & { year: number };
  highlight?: "correct" | "wrong";
}) {
  const colors =
    highlight === "correct"
      ? "bg-green-100 ring-green-500"
      : highlight === "wrong"
        ? "bg-red-100 ring-red-500"
        : "bg-white ring-gray-200";
  return (
    <div
      className={`flex items-center gap-4 rounded-lg px-4 py-2 shadow-sm ring-2 ${colors}`}
    >
      <span className="text-3xl font-bold text-indigo-600 w-20 shrink-0">
        {card.year}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold text-gray-900">{card.name}</p>
        <p className="truncate text-sm text-gray-600">{card.artists}</p>
      </div>
    </div>
  );
}

function Turn({
  game,
  onPlace,
  onContinue,
}: {
  game: TimelineGame;
  onPlace: (slot: number) => void;
  onContinue: () => void;
}) {
  const [selectedSlot, setSelectedSlot] = useState<number | null>(null);
  const current = game.players[game.current];
  const revealing = game.phase === "reveal";

  useEffect(() => setSelectedSlot(null), [game.song?.id]);

  // During the reveal a correct song is already part of the timeline
  const timeline = current.timeline;
  const placedIndex =
    revealing && game.lastPlacementCorrect ? game.slot : null;

  const slotButton = (slot: number) => (
    <button
      key={`slot-${slot}`}
      onClick={() => setSelectedSlot(slot)}
      className={`w-full rounded-lg border-2 border-dashed py-2 text-sm font-semibold ${
        selectedSlot === slot
          ? "border-indigo-500 bg-indigo-100 text-indigo-700"
          : "border-gray-400 text-gray-500"
      }`}
    >
      {selectedSlot === slot ? "Song goes here" : "Place here"}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="text-center font-semibold text-gray-900 mb-2">
        {revealing
          ? game.lastPlacementCorrect
            ? "Correct!"
            : "Wrong!"
          : game.players.length > 1
            ? `${playerLabel(game, game.current)}, when was this song released?`
            : "When was this song released?"}
      </p>

      {revealing && !game.lastPlacementCorrect && game.song && (
        <div className="mb-4">
          <SongCard card={game.song} highlight="wrong" />
        </div>
      )}

      {!revealing && slotButton(0)}
      {timeline.map((card, i) => (
        <div key={card.id} className="flex flex-col gap-2">
          <SongCard
            card={card}
            highlight={i === placedIndex ? "correct" : undefined}
          />
          {!revealing && slotButton(i + 1)}
        </div>
      ))}

      <div className="mt-6">
        {!revealing ? (
          <button
            className={primaryButton}
            disabled={selectedSlot === null}
            onClick={() => selectedSlot !== null && onPlace(selectedSlot)}
          >
            Confirm
          </button>
        ) : (
          <button className={primaryButton} onClick={onContinue}>
            {isGameOver(game) ? "See result" : "Next turn"}
          </button>
        )}
      </div>
    </div>
  );
}

function Finished({
  game,
  onNewGame,
}: {
  game: TimelineGame;
  onNewGame: () => void;
}) {
  const solo = game.players.length === 1;
  const title =
    game.winner !== null
      ? solo
        ? "You made it!"
        : `${playerLabel(game, game.winner)} wins!`
      : solo
        ? "Game over"
        : "It's a draw!";

  return (
    <div className="flex flex-col gap-6 my-8">
      <p className="text-center text-3xl font-bold text-gray-900">{title}</p>
      {game.players.map((p, i) => (
        <div key={i}>
          <p className="font-semibold text-gray-900 mb-2">
            {playerLabel(game, i)}: {p.timeline.length} songs
          </p>
          <div className="flex flex-col gap-2">
            {p.timeline.map((card) => (
              <SongCard key={card.id} card={card} />
            ))}
          </div>
        </div>
      ))}
      <button className={primaryButton} onClick={onNewGame}>
        New game
      </button>
    </div>
  );
}
