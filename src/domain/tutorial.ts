export const TUTORIAL_STEPS = [
  "intro", "navigation", "start", "timer", "talk", "episode", "complete",
] as const;

export type TutorialStep = (typeof TUTORIAL_STEPS)[number];

export function isTutorialStep(value: unknown): value is TutorialStep {
  return TUTORIAL_STEPS.some((step) => step === value);
}

export function getTutorialPath(step: TutorialStep | undefined): string | null {
  switch (step) {
    case "intro": return "/story";
    case "timer": return "/timer";
    case "episode": return "/story";
    case "navigation":
    case "start":
    case "talk": return "/";
    default: return null;
  }
}
