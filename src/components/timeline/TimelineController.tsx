import { useCallback, useEffect, useState } from "react";
import {
  usePlayerDevice,
  useSpotifyPlayer,
} from "react-spotify-web-playback-sdk";
import { useRecoilState, useRecoilValue, useResetRecoilState } from "recoil";
import NoSleep from "nosleep.js";
import { FiPlus, FiX } from "react-icons/fi";
import PlaybackControls from "@/components/ui/PlaybackControls";
import { usePlayTrack } from "@/components/usePlayTrack";
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
  // Back to playlist mode
  onExit: () => void;
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

const primaryButton = "btn btn-primary w-full py-4 text-lg";
const secondaryButton = "btn btn-ghost w-full";

const playerLabel = (game: TimelineGame, index: number) =>
  game.players[index].name || `Player ${index + 1}`;

export default function TimelineController({ token, onExit }: Props) {
  const player = useSpotifyPlayer();
  const device = usePlayerDevice();
  const playlist = useRecoilValue(playlistAtom);
  const playlistInfo = useRecoilValue(playlistInfoAtom);
  const resetPlaylist = useResetRecoilState(playlistAtom);
  const resetPlaylistIndex = useResetRecoilState(playlistIndexAtom);
  const [game, setGame] = useRecoilState(timelineGameAtom);
  const [busy, setBusy] = useState(false);

  const playSong = usePlayTrack(token);

  useEffect(() => {
    const noSleep = new NoSleep();
    noSleep.enable().catch(() => {});
    return () => noSleep.disable();
  }, []);

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
    // Unlock audio in the user gesture, mobile browsers block playback otherwise
    player?.activateElement().catch(() => {});
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
    onExit();
  };

  const changePlaylist = () => {
    resetPlaylist();
    resetPlaylistIndex();
    onExit();
  };

  if (device === null || player === null) return null;

  return (
    <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-8 pt-20">
      <div className="mb-6 text-center animate-fade-up">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
          Timeline game
        </p>
        <h1 className="mt-1 line-clamp-1 font-display text-xl font-bold">
          {playlistInfo.name}
        </h1>
      </div>

      {!game && (
        <Setup
          playlistName={playlistInfo.name}
          songCount={playlist.length}
          busy={busy}
          onStart={startGame}
          onChangePlaylist={changePlaylist}
          onBack={onExit}
        />
      )}

      {game && (
        <>
          <Scoreboard game={game} />

          {game.phase === "handoff" && (
            <div className="my-8 flex flex-col items-center gap-6 animate-fade-up">
              <p className="text-center font-display text-2xl font-bold">
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
                <PlaybackControls player={player} />
                {game.phase === "placing" && game.song && (
                  <button
                    className="mt-4 w-full text-sm text-white/50 underline transition hover:text-white"
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
    </main>
  );
}

function Setup({
  playlistName,
  songCount,
  busy,
  onStart,
  onChangePlaylist,
  onBack,
}: {
  playlistName: string;
  songCount: number;
  busy: boolean;
  onStart: (names: string[], winTarget: number) => void;
  onChangePlaylist: () => void;
  onBack: () => void;
}) {
  const [names, setNames] = useRecoilState(timelinePlayerNamesAtom);
  const [winTarget, setWinTarget] = useState(10);
  // Every player needs a start card plus at least a few songs to play
  const enoughSongs = songCount >= names.length + winTarget;

  const setName = (index: number, name: string) =>
    setNames(names.map((n, i) => (i === index ? name : n)));

  return (
    <div className="flex flex-col gap-6 animate-fade-up">
      <div className="glass rounded-3xl p-4">
        <p className="text-xs text-white/40">Playlist</p>
        <p className="truncate font-semibold">{playlistName}</p>
        <p className="text-sm text-white/60">{songCount} songs</p>
        <button
          className="mt-2 text-sm text-neon-cyan underline"
          onClick={onChangePlaylist}
        >
          Change playlist
        </button>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/50">
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
                className="min-w-0 flex-1 rounded-2xl border-0 bg-ink/60 px-4 py-3 text-white ring-1 ring-inset ring-white/10 placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-neon-cyan"
              />
              {names.length > 1 && (
                <button
                  onClick={() => setNames(names.filter((_, j) => j !== i))}
                  aria-label={`Remove player ${i + 1}`}
                  className="p-2 text-white/40 transition hover:text-white"
                >
                  <FiX className="h-5 w-5" />
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
            <FiPlus /> Add player
          </button>
        )}
        {names.length === 1 && (
          <p className="mt-2 text-sm text-white/60">
            Solo: reach the goal before making {SOLO_MAX_MISTAKES} mistakes.
          </p>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wider text-white/50">
          Songs needed to win
        </p>
        <div className="grid grid-cols-4 gap-2">
          {winTargets.map((target) => (
            <button
              key={target}
              onClick={() => setWinTarget(target)}
              className={`rounded-2xl px-3 py-2.5 font-semibold ring-1 ring-inset transition ${
                target === winTarget
                  ? "bg-gradient-to-r from-neon-pink to-neon-violet text-white ring-transparent"
                  : "bg-white/5 text-white/80 ring-white/10 hover:bg-white/10"
              }`}
            >
              {target}
            </button>
          ))}
        </div>
      </div>

      {!enoughSongs && (
        <p className="text-sm text-neon-pink">
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
      <button className={secondaryButton} onClick={onBack}>
        Back to playlist mode
      </button>
    </div>
  );
}

function Scoreboard({ game }: { game: TimelineGame }) {
  if (game.players.length === 1) {
    const [solo] = game.players;
    return (
      <p className="text-center text-sm text-white/60">
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
          } ${i === game.current ? "ring-2 ring-white ring-offset-2 ring-offset-ink" : "opacity-70"}`}
        >
          {playerLabel(game, i)}
          <span className="rounded-full bg-white/30 px-1.5">
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
  showAlbumArt,
}: {
  card: Song & { year: number };
  highlight?: "correct" | "wrong";
  showAlbumArt?: boolean;
}) {
  const colors =
    highlight === "correct"
      ? "bg-emerald-500/15 ring-emerald-400"
      : highlight === "wrong"
        ? "bg-neon-pink/15 ring-neon-pink"
        : "bg-white/5 ring-white/10";
  return (
    <div
      className={`flex items-center gap-4 rounded-2xl px-4 py-2 ring-2 ring-inset backdrop-blur ${colors}`}
    >
      {showAlbumArt && card.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={card.image}
          alt=""
          className="h-16 w-16 shrink-0 rounded-xl object-cover shadow-lg animate-cover-in"
        />
      )}
      <span className="w-20 shrink-0 font-display text-3xl font-bold text-gradient">
        {card.year}
      </span>
      <div className="min-w-0">
        <p className="truncate font-semibold">{card.name}</p>
        <p className="truncate text-sm text-white/60">{card.artists}</p>
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
      className={`w-full rounded-2xl border-2 border-dashed py-2 text-sm font-semibold transition ${
        selectedSlot === slot
          ? "border-neon-cyan bg-neon-cyan/10 text-neon-cyan"
          : "border-white/20 text-white/50 hover:border-white/40"
      }`}
    >
      {selectedSlot === slot ? "Song goes here" : "Place here"}
    </button>
  );

  return (
    <div className="flex flex-col gap-2">
      <p className="mb-2 text-center font-display text-lg font-bold">
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
          <SongCard card={game.song} highlight="wrong" showAlbumArt />
        </div>
      )}

      {!revealing && slotButton(0)}
      {timeline.map((card, i) => (
        <div key={card.id} className="flex flex-col gap-2">
          <SongCard
            card={card}
            highlight={i === placedIndex ? "correct" : undefined}
            showAlbumArt={i === placedIndex}
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
    <div className="my-8 flex flex-col gap-6 animate-fade-up">
      <p className="text-center font-display text-3xl font-bold">{title}</p>
      {game.players.map((p, i) => (
        <div key={i}>
          <p className="mb-2 font-semibold">
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
