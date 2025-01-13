import type { AppProps } from "next/app";
import { RecoilRoot } from "recoil";
import "./globals.css";
import { useEffect } from "react";
import { handleSpotifyCallback } from "@/auth";

export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <RecoilRoot>
      <Component {...pageProps} />
    </RecoilRoot>
  );
}
