import { useCallback, useEffect, useState } from "react";
import { GetServerSideProps } from "next";
import nookies from "nookies";
import { WebPlaybackSDK } from "react-spotify-web-playback-sdk";
import GameController from "@/components/GameController";
import Head from "next/head";
import { onTokenExpiry } from "@/auth/refreshSpotifyToken";
import { redirectToSpotifyLogin } from "@/auth";
import SideBar from "@/components/SideBar";
import Logo from "@/components/ui/Logo";
const Player = () => {
  const [access_token, setAccess_token] = useState<string | null>();
  useEffect(() => {
    setAccess_token(localStorage.getItem("spotify_access_token"));
  }, []);
  const getOAuthToken: Spotify.PlayerInit["getOAuthToken"] = useCallback(
    (callback) =>
      onTokenExpiry().then((access_token) => {
        if (access_token) setAccess_token(access_token);
        callback(access_token ?? "");
      }),
    []
  );
  if (!access_token)
    return (
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col items-center justify-center gap-6 px-5 text-center animate-fade-up">
        <Logo className="text-4xl" />
        <p className="text-white/70">Log in with Spotify to play.</p>
        <button
          className="btn btn-primary w-full"
          onClick={() => redirectToSpotifyLogin()}
        >
          Login with Spotify
        </button>
      </main>
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
