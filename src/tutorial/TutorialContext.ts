import { createContext, useContext } from "react";

import type { TutorialAction, TutorialTarget } from "./content/steps";
import type { TutorialResult } from "./tutorialStorage";

export type TutorialSurface =
  | "screen"
  | "story"
  | "setup"
  | "diary"
  | "power"
  | "input";
export type Measurable = {
  measureInWindow: (
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};
export type TutorialState = {
  active: boolean;
  practicing: boolean;
  intro: boolean;
  closing: boolean;
  busy: boolean;
  transitioning: boolean;
  error: string | null;
  index: number;
  introPart: number;
  introInput: boolean;
  powerSaving: boolean;
  advance: (action?: TutorialAction) => void;
  back: () => void;
  replay: () => void;
  close: (result: TutorialResult) => void;
  nextIntro: () => void;
  savedIntroInput: () => void;
  run: (operation: () => Promise<void>) => void;
  setPowerSaving: (visible: boolean) => void;
  modalShown: (surface: TutorialSurface) => void;
  modalDismissed: (surface: TutorialSurface) => void;
  register: (id: TutorialTarget, node: Measurable | null) => void;
  measure: (
    id: TutorialTarget,
    callback: (x: number, y: number, width: number, height: number) => void,
  ) => void;
};

export const TutorialContext = createContext<TutorialState | null>(null);
export function useTutorial() {
  const context = useContext(TutorialContext);
  if (!context) throw new Error("TutorialProvider is required.");
  return context;
}
