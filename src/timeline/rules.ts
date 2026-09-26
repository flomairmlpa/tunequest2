import { Song } from "@/components/state";

export const MIN_PLAYERS = 1;
export const MAX_PLAYERS = 6;
// Mistakes allowed in a solo game before it's over
export const SOLO_MAX_MISTAKES = 3;

export type TimelineCard = Song & { year: number };

export type TimelinePlayer = {
  name: string;
  // Sorted by year, oldest first
  timeline: TimelineCard[];
  mistakes: number;
};

export type TimelinePhase =
  // Waiting for the current player to take the phone and draw a song
  | "handoff"
  // Song is playing, the player picks a slot in their timeline
  | "placing"
  // Placement was checked, the song is revealed
  | "reveal"
  | "finished";

export type TimelineGame = {
  players: TimelinePlayer[];
  current: number;
  phase: TimelinePhase;
  song: TimelineCard | null;
  // Slot the song was placed in: 0 = before the first card, timeline.length = after the last
  slot: number | null;
  lastPlacementCorrect: boolean | null;
  winTarget: number;
  usedSongIds: string[];
  // Index of the winning player, null for a draw or a lost solo game
  winner: number | null;
};

export const yearOf = (releaseDate: string) =>
  parseInt(releaseDate.slice(0, 4), 10);

export const toCard = (song: Song, releaseDate = song.releaseDate) => ({
  ...song,
  releaseDate,
  year: yearOf(releaseDate),
});

// Songs of the same year count as correct on either side
export function isCorrectPlacement(
  timeline: TimelineCard[],
  slot: number,
  year: number
): boolean {
  if (slot < 0 || slot > timeline.length) return false;
  const before = timeline[slot - 1];
  const after = timeline[slot];
  return (!before || before.year <= year) && (!after || year <= after.year);
}

export function pickRandomSong(
  playlist: Song[],
  usedSongIds: string[],
  random = Math.random
): Song | null {
  const used = new Set(usedSongIds);
  const available = playlist.filter((song) => !used.has(song.id));
  if (available.length === 0) return null;
  return available[Math.floor(random() * available.length)];
}

export function createGame(
  names: string[],
  startCards: TimelineCard[],
  winTarget: number
): TimelineGame {
  if (names.length < MIN_PLAYERS || names.length > MAX_PLAYERS)
    throw new Error(`A game needs ${MIN_PLAYERS} to ${MAX_PLAYERS} players`);
  if (startCards.length !== names.length)
    throw new Error("Every player needs a start card");

  return {
    players: names.map((name, i) => ({
      name,
      timeline: [startCards[i]],
      mistakes: 0,
    })),
    current: 0,
    phase: "handoff",
    song: null,
    slot: null,
    lastPlacementCorrect: null,
    winTarget,
    usedSongIds: startCards.map((card) => card.id),
    winner: null,
  };
}

export function startTurn(game: TimelineGame, song: TimelineCard): TimelineGame {
  return {
    ...game,
    phase: "placing",
    song,
    slot: null,
    lastPlacementCorrect: null,
    usedSongIds: [...game.usedSongIds, song.id],
  };
}

export function placeSong(game: TimelineGame, slot: number): TimelineGame {
  if (game.phase !== "placing" || !game.song) return game;

  const player = game.players[game.current];
  const correct = isCorrectPlacement(player.timeline, slot, game.song.year);
  const updatedPlayer: TimelinePlayer = correct
    ? {
        ...player,
        timeline: [
          ...player.timeline.slice(0, slot),
          game.song,
          ...player.timeline.slice(slot),
        ],
      }
    : { ...player, mistakes: player.mistakes + 1 };

  const players = game.players.map((p, i) =>
    i === game.current ? updatedPlayer : p
  );
  const won = updatedPlayer.timeline.length >= game.winTarget;

  // The reveal is shown even when the game is over; nextTurn moves on to "finished"
  return {
    ...game,
    players,
    phase: "reveal",
    slot,
    lastPlacementCorrect: correct,
    winner: won ? game.current : null,
  };
}

export const isGameOver = (game: TimelineGame) =>
  game.winner !== null ||
  (game.players.length === 1 &&
    game.players[0].mistakes >= SOLO_MAX_MISTAKES);

export function nextTurn(game: TimelineGame): TimelineGame {
  if (isGameOver(game)) return { ...game, phase: "finished" };
  return {
    ...game,
    phase: "handoff",
    current: (game.current + 1) % game.players.length,
    song: null,
    slot: null,
    lastPlacementCorrect: null,
  };
}

// Ends the game when the playlist runs out: the player with the most cards wins
export function endGameOutOfSongs(game: TimelineGame): TimelineGame {
  const counts = game.players.map((p) => p.timeline.length);
  const best = Math.max(...counts);
  const leaders = counts.filter((count) => count === best).length;
  return {
    ...game,
    phase: "finished",
    winner: leaders === 1 && game.players.length > 1 ? counts.indexOf(best) : null,
  };
}
