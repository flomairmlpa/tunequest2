import Link from "next/link";
import Head from "next/head";
import { redirectToSpotifyLogin, handleSpotifyCallback } from "../auth";
import { useEffect } from "react";
const createUrl = process.env.NEXT_PUBLIC_TUNEQUEST_CREATE_URL || "";

export default function Home() {
  useEffect(() => {
    // If you're on the callback route, handle the code exchange
    const p = localStorage.getItem("spotify_access_token");
    if (p) {
      window.location.href = "/player";
    }
  }, []);
  return (
    <>
      <Head>
        <title>TuneQuest</title>
      </Head>

      <div className="h-screen overflow-scroll bg-gradient-to-t from-purple-200 to-pink-200 pb-12">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button onClick={() => redirectToSpotifyLogin()}>Login</button>
              <Link
                href="/api/login"
                className="rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600"
              >
                Play the Game
              </Link>
              <Link
                href={createUrl}
                target="_blank"
                className="text-sm font-semibold leading-6 text-gray-900"
              >
                Create Your Own Game <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
