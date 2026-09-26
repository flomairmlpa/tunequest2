import { PlaylistedTrack, Track } from "@spotify/web-api-ts-sdk";
import { useCallback } from "react";
import { atom, selector, AtomEffect, useSetRecoilState, useRecoilValue, useRecoilState, useResetRecoilState } from "recoil";

export interface Song {
    id: string;
    name: string;
    artists: string
    releaseDate: string;
    image?: string;
}
export function localStorageEffect<T>(key: string): AtomEffect<T> {
    return ({ setSelf, onSet }) => {
        if (typeof window === "undefined") return;
        const savedValue = localStorage.getItem(key);
        if (savedValue != null) {
            setSelf(JSON.parse(savedValue) as T);
        }
        onSet((newValue, _, isReset) => {
            isReset
                ? localStorage.removeItem(key)
                : localStorage.setItem(key, JSON.stringify(newValue));
        });
    };
}


export const playlistAtom = atom<Song[]>({
    key: "playlistAtom",
    default: [],
    effects: [
        localStorageEffect('playlistAtom'),
    ]
});
export const playlistInfoAtom = atom<{ name: string, length: number }>({
    key: "playlistInfoAtom",
    default: { name: "", length: 0 },
    effects: [
        localStorageEffect('playlistInfoAtom'),
    ]
});

export interface RecentPlaylist {
    id: string;
    name: string;
    songCount: number;
    lastPlayedAt: string;
}

const MAX_RECENT_PLAYLISTS = 20;

// Playlists played before, most recent first
export const recentPlaylistsAtom = atom<RecentPlaylist[]>({
    key: "recentPlaylistsAtom",
    default: [],
    effects: [
        localStorageEffect('recentPlaylistsAtom'),
    ]
});

export const useRecentPlaylists = () => {
    const [recentPlaylists, setRecentPlaylists] = useRecoilState(recentPlaylistsAtom);

    const addRecentPlaylist = useCallback(
        (playlist: Omit<RecentPlaylist, "lastPlayedAt">) => {
            setRecentPlaylists((playlists) => [
                { ...playlist, lastPlayedAt: new Date().toISOString() },
                ...playlists.filter((p) => p.id !== playlist.id),
            ].slice(0, MAX_RECENT_PLAYLISTS));
        },
        [setRecentPlaylists]
    );

    const removeRecentPlaylist = useCallback(
        (id: string) => {
            setRecentPlaylists((playlists) => playlists.filter((p) => p.id !== id));
        },
        [setRecentPlaylists]
    );

    return { recentPlaylists, addRecentPlaylist, removeRecentPlaylist };
}

export const playlistIndexAtom = atom<number>({
    key: "playlistIndexAtom",
    default: 0,
    effects: [
        localStorageEffect('playlistIndexAtom'),
    ]
});


export const playedSongsAtom = atom<string[]>({
    key: "playedSongsAtom",
    default: [],
    effects: [
        localStorageEffect('playedSongsAtom'),
    ]
});

export const randomStartAtom = atom<boolean>({
    key: "randomStartAtom",
    default: false,
    effects: [
        localStorageEffect('randomStartAtom'),
    ]
});

export const useResetGame = () => {
    const resetPlaylist = useResetRecoilState(playlistAtom);
    const resetPlaylistInfo = useResetRecoilState(playlistInfoAtom);
    const resetPlaylistIndex = useResetRecoilState(playlistIndexAtom);
    const resetPlayedSongs = useResetRecoilState(playedSongsAtom);

    return useCallback(() => {
        resetPlaylist();
        resetPlaylistInfo();
        resetPlaylistIndex();
        resetPlayedSongs();
    }, [resetPlaylist, resetPlaylistInfo, resetPlaylistIndex, resetPlayedSongs]);
}

export const songAtom = selector<Song | null>({
    key: "songAtom",
    get: ({ get }) => {
        const playlist = get(playlistAtom);
        const index = get(playlistIndexAtom);
        return playlist[index] || null;
    }
});


export const usePlayNextSong = () => {
    const playlist = useRecoilValue(playlistAtom);
    const [playlistindex, setPlaylistIndex] = useRecoilState(playlistIndexAtom);
    const [playedSongs, setPlayedSongs] = useRecoilState(playedSongsAtom);

    const playNextSong = useCallback(
        () => {
            const song = playlist[playlistindex]
            if (song) {
                setPlayedSongs((songs) => [...songs, song.id]);
            }
            const selectAblesongs = playlist.filter((songinPl) => !playedSongs.concat(song?.id ?? "nope").includes(songinPl.id));
            const nextSong = selectAblesongs[Math.floor(Math.random() * selectAblesongs.length)];
            const nextIndex = playlist.indexOf(nextSong);
            setPlaylistIndex(nextIndex);

        },
        [playlist, playlistindex, setPlayedSongs, setPlaylistIndex, playedSongs]
    )

    return { playNextSong, songsLeft: playlist.length - playedSongs.length };
}