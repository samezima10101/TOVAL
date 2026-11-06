import { useCallback, useContext } from "react";

import { TutorialContext, type Measurable } from "./TutorialContext";
import { TUTORIAL_STEPS, type TutorialTarget } from "./content/steps";

// Attach to an existing native view without changing its layout.
export default function useTutorialTarget(id?: TutorialTarget) {
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
