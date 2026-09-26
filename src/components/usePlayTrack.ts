import { useCallback } from "react";
import { usePlayerDevice } from "react-spotify-web-playback-sdk";
import { useRecoilValue } from "recoil";
import { randomStartAtom } from "./state";

/** Plays a track on the TuneQuest device, optionally starting somewhere in the first minute. */
export const usePlayTrack = (token: string) => {
  const device = usePlayerDevice();
  const randomStart = useRecoilValue(randomStartAtom);

  return useCallback(
    (trackId: string) => {
      if (!device) return;
      const position = randomStart ? Math.floor(Math.random() * 60000) : 0;
      return fetch(
        `https://api.spotify.com/v1/me/player/play?device_id=${device.device_id}`,
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
    [device, randomStart, token]
  );
};
