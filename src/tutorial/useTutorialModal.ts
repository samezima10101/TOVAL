import { useEffect } from "react";

import { useTutorial, type TutorialSurface } from "./TutorialContext";

export default function useTutorialModal(surface: TutorialSurface) {
  const { active, modalShown, modalDismissed } = useTutorial();
  useEffect(() => () => modalDismissed(surface), [surface, modalDismissed]);
  return {
    onShow: () => {
      if (active) modalShown(surface);
    },
    onDismiss: () => modalDismissed(surface),
  };
}
