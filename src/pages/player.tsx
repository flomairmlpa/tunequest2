import { useCallback, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import nookies from "nookies";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import GameController from "@/components/GameController";
import Head from "next/head";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";

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
  if (!access_token) return <div>loading...</div>;
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
        <GameController token={access_token} />
      </WebPlaybackSDK>
    </>
  );
};

export default Player;
