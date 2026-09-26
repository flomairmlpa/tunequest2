import { atom } from "recoil";
import { localStorageEffect } from "@/components/state";
import { TimelineGame } from "./rules";

// The running timeline game, persisted so a reload doesn't end it
export const timelineGameAtom = atom<TimelineGame | null>({
  key: "timelineGameAtom",
  default: null,
  effects: [localStorageEffect("timelineGameAtom")],
});

// Player names of the last game, to prefill the setup
export const timelinePlayerNamesAtom = atom<string[]>({
  key: "timelinePlayerNamesAtom",
  default: ["", ""],
  effects: [localStorageEffect("timelinePlayerNamesAtom")],
});
