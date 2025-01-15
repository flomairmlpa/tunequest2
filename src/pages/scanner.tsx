import { useCallback, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import nookies from "nookies";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import GameController from "@/components/ScannerController";
import Head from "next/head";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { redirectToSpotifyLogin } from "@/auth";
import SideBar from "@/components/SideBar";

const Player = () => {
  const [access_token, setAccess_token] = useState<string | null>();
  useEffect(() => {
    setAccess_token(localStorage.getItem("spotify_access_token"));
  }, []);
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    (callback) =>
      onTokenExpiry().then((access_token) => callback(access_token ?? "")),
    []
  );
  if (!access_token)
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
        <title>TuneQuest</title>
      </Head>
      <WebPlaybackSDK
        initialDeviceName="TuneQuest"
        getOAuthToken={getOAuthToken}
        connectOnInitialized={true}
        initialVolume={1}
      >
        <SideBar />
        <GameController token={access_token} />
      </WebPlaybackSDK>
    </>
  );
};

export default Player;
