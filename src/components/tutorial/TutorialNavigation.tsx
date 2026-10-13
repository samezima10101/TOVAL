import { router, useGlobalSearchParams, usePathname } from "expo-router";
import React from "react";

import { getTutorialPath } from "@/src/domain/tutorial";
import { useAppState } from "@/src/state/AppStateProvider";

// Mounted inside the navigator shell: safe to route after the Stack mounts.
export default function TutorialNavigation() {
  const pathname = usePathname();
  const { episode, source } = useGlobalSearchParams<{ episode?: string; source?: string }>();
  const { state } = useAppState();
  const step = state?.tutorialStep;
  React.useEffect(() => {
    const target = getTutorialPath(step);
    const validStoryParams = step === "episode" ? episode === "1" && source === "home"
      : step === "intro" ? source === "tutorial" : true;
    if (!target || (pathname === target && validStoryParams)) return;
    if (step === "intro") {
      router.replace({ pathname: "/story", params: { source: "tutorial" } });
    } else if (step === "episode") {
      router.replace({ pathname: "/story", params: { episode: "1", source: "home" } });
    } else if (target === "/timer") {
      router.replace("/timer");
    } else {
      router.replace("/");
    }
  }, [episode, pathname, source, step]);
  return null;
}
