import {
  AccessToken,
  PlaylistedTrack,
  Scopes,
  SpotifyApi,
  Track,
} from "@spotify/web-api-ts-sdk";
import { useEffect, useRef, useState } from "react";
import dayjs from "dayjs";
import { atom, useSetRecoilState } from "recoil";
import { playlistAtom, playlistIndexAtom } from "./state";
import { fetchAllPlaylistTracks } from "./getPlaylistItems";

type Props = {
  token: string;
};

const playlistRegex =
  /^https:\/\/open\.spotify\.com\/playlist\/([a-zA-Z0-9-]+).*$/gm;

const App: React.FC<Props> = ({ token }) => {
  const setPlaylistItems = useSetRecoilState(playlistAtom);
  const setPlaylistIndex = useSetRecoilState(playlistIndexAtom);
  const [url, setUrl] = useState<string>("");

  const getPlaylist = async () => {
    const match = playlistRegex.exec(url);
    if (!match) {
      return;
    }

    const items: PlaylistedTrack<Track>[] = [];

    const result = await fetchAllPlaylistTracks(match[1], token);

    setPlaylistItems(result);
    setPlaylistIndex(-1);
  };

  return (
    <div className="w-full h-screen overflow-scroll">
      <div className="mx-auto mt-16 w-full mt-8 px-8">
        <div className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-5">
          <div className="col-span-1 sm:col-span-4">
            <label
              htmlFor="playlist"
              className="block text-sm font-semibold leading-6 text-gray-900"
            >
              Playlist URL
            </label>
            <div className="mt-2.5">
              <input
                type="text"
                id="playlist"
                value={url}
                placeholder="https://open.spotify.com/playlist/A1B2C3D4E5F6G7H8I9"
                onChange={(e) => setUrl(e.target.value)}
                className="block w-full rounded-md border-0 px-3.5 py-2 text-gray-900 shadow-sm ring-1 ring-inset ring-gray-300 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6"
              />
            </div>
          </div>
          <div className="flex items-end">
            <button
              onClick={getPlaylist}
              className="block w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-center text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
            >
              Load Playlist Data
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default App;
