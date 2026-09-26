import { useCallback, useEffect, useState } from "react";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import Head from "next/head";
import TimelineController from "@/components/timeline/TimelineController";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { redirectToSpotifyLogin } from "@/auth";
import SideBar from "@/components/SideBar";

const Timeline = () => {
  const [accessToken, setAccessToken] = useState<string | null>();
  useEffect(() => {
    setAccessToken(localStorage.getItem("spotify_access_token"));
  }, []);
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    (callback) =>
      onTokenExpiry().then((accessToken) => callback(accessToken ?? "")),
    []
  );
  if (!accessToken)
    return (
      <button
        className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
        onClick={() => redirectToSpotifyLogin()}
      >
        Login
      </button>
    );
  return (
    <>
      <Head>
        <title>TuneQuest Timeline</title>
      </Head>
      <WebPlaybackSDK
        initialDeviceName="TuneQuest"
        getOAuthToken={getOAuthToken}
        connectOnInitialized={true}
        initialVolume={1}
      >
        <SideBar />
        <TimelineController token={accessToken} />
      </WebPlaybackSDK>
    </>
  );
};

export default Timeline;
