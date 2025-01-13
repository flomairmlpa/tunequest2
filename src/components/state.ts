import { PlaylistedTrack, Track } from "@spotify/web-api-ts-sdk";
import { atom, selector, AtomEffect } from "recoil";


function localStorageEffect<T>(key: string): AtomEffect<T> {
    return ({ setSelf, onSet }) => {
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


export const playlistAtom = atom<PlaylistedTrack<Track>[]>({
    key: "playlistAtom",
    default: [],
    effects: [
        localStorageEffect('playlistAtom'),
    ]
});

export const playlistIndexAtom = atom<number>({
    key: "playlistIndexAtom",
    default: 0,
    effects: [
        localStorageEffect('playlistIndexAtom'),
    ]
});

export const songAtom = selector<PlaylistedTrack<Track> | null>({
    key: "songAtom",
    get: ({ get }) => {
        const playlist = get(playlistAtom);
        const index = get(playlistIndexAtom);
        return playlist[index] || null;
    }
});
