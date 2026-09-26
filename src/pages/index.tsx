import Link from "next/link";
import Head from "next/head";
import { ReactNode, useEffect, useState } from "react";
import { FiCamera, FiChevronRight, FiList } from "react-icons/fi";
import { redirectToSpotifyLogin } from "../auth";
import { Header } from "@/components/SideBar";
import Logo from "@/components/ui/Logo";
import Vinyl from "@/components/ui/Vinyl";

const steps = [
  ["Listen", "A song plays, the title stays hidden."],
  ["Guess", "Place it on your timeline by release year."],
  ["Reveal", "Flip the card and see if you nailed it."],
];

function ModeCard({
  href,
  icon,
  title,
  description,
  gradient,
  delay,
}: {
  href: string;
  icon: ReactNode;
  title: string;
  description: string;
  gradient: string;
  delay: number;
}) {
  return (
    <Link
      href={href}
      className="glass group flex items-center gap-4 rounded-3xl p-4 transition duration-300 hover:-translate-y-0.5 hover:bg-white/10 active:scale-[0.98] animate-fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <div
        className={`flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br shadow-lg ${gradient}`}
      >
        {icon}
      </div>
      <div className="flex-1">
        <h2 className="font-display text-lg font-bold">{title}</h2>
        <p className="text-sm text-white/60">{description}</p>
      </div>
      <FiChevronRight className="h-5 w-5 text-white/40 transition group-hover:translate-x-1 group-hover:text-white" />
    </Link>
  );
}

export default function Home() {
  const [loggedIn, setLoggedIn] = useState<boolean | null>(null);

  useEffect(() => {
    setLoggedIn(!!localStorage.getItem("spotify_access_token"));
  }, []);

  return (
    <>
      <Head>
        <title>TuneQuest</title>
      </Head>
      {loggedIn && <Header />}

      <main className="mx-auto flex w-full max-w-md flex-1 flex-col px-5 pb-10 pt-20">
        <section className="flex flex-col items-center text-center">
          <div className="relative my-6 animate-fade-up">
            <div className="absolute inset-4 rounded-full bg-neon-pink/40 blur-3xl" />
            <Vinyl spinning className="h-44 w-44" />
          </div>
          <h1 className="animate-fade-up [animation-delay:100ms]">
            <Logo className="text-5xl" />
          </h1>
          <p className="mt-3 max-w-xs text-white/70 animate-fade-up [animation-delay:200ms]">
            Guess the year. Build your timeline. Beat your friends.
          </p>
        </section>

        {loggedIn === false && (
          <section className="mt-10 flex flex-col gap-3 animate-fade-up [animation-delay:300ms]">
            <button
              className="btn btn-primary w-full py-4 text-lg"
              onClick={() => redirectToSpotifyLogin()}
            >
              Login with Spotify
            </button>
            <p className="text-center text-xs text-white/40">
              Requires Spotify Premium
            </p>
          </section>
        )}

        {loggedIn && (
          <section className="mt-10 flex flex-col gap-3">
            <ModeCard
              href="/scanner"
              icon={<FiCamera className="h-7 w-7" />}
              title="Scan cards"
              description="Play with Hitster or TuneQuest cards"
              gradient="from-neon-pink to-neon-violet shadow-neon-pink/30"
              delay={300}
            />
            <ModeCard
              href="/player"
              icon={<FiList className="h-7 w-7 text-ink" />}
              title="Playlist mode"
              description="No cards needed, just a Spotify playlist"
              gradient="from-neon-cyan to-neon-violet shadow-neon-cyan/30"
              delay={400}
            />
          </section>
        )}

        {loggedIn !== null && (
          <section className="mt-10 animate-fade-up [animation-delay:500ms]">
            <h3 className="mb-3 text-center text-xs font-semibold uppercase tracking-[0.2em] text-white/40">
              How to play
            </h3>
            <ol className="grid grid-cols-3 gap-2">
              {steps.map(([title, text], i) => (
                <li
                  key={title}
                  className="glass flex flex-col items-center gap-1.5 rounded-2xl p-3 text-center"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-display text-xs font-bold text-neon-cyan">
                    {i + 1}
                  </span>
                  <span className="text-sm font-semibold">{title}</span>
                  <span className="text-[11px] leading-snug text-white/50">
                    {text}
                  </span>
                </li>
              ))}
            </ol>
          </section>
        )}
      </main>
    </>
  );
}
