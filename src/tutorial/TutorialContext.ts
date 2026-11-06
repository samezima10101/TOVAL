import { createContext, useCallback, useContext, useEffect } from "react";

import { TUTORIAL_STEPS, type TutorialAction, type TutorialTarget } from "./steps";

export type TutorialResult = "completed" | "skipped";

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

// Attach to an existing native view without changing its layout.
export function useTutorialTarget(id?: TutorialTarget) {
  const context = useContext(TutorialContext);
  const register = context?.register;
  const ref = useCallback(
    (node: Measurable | null) => {
      if (id) register?.(id, node);
    },
    [id, register],
  );
  const step = context?.practicing ? TUTORIAL_STEPS[context.index] : null;
  return {
    anchor: id ? { ref, collapsable: false } : {},
    blocked: Boolean(
      id &&
      context?.active &&
      (!step?.action || step.target !== id || context.busy || context.closing || context.transitioning),
    ),
  };
}

export function useTutorialModal(surface: TutorialSurface) {
  const { active, modalShown, modalDismissed } = useTutorial();
  useEffect(() => () => modalDismissed(surface), [surface, modalDismissed]);
  return {
    onShow: () => {
      if (active) modalShown(surface);
    },
    onDismiss: () => modalDismissed(surface),
  };
}
