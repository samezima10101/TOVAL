import { router } from "expo-router";
import { usePreventRemove } from "expo-router/react-navigation";
import React from "react";

// Disable the removal guard in a render before dispatching the single exit.
// This also routes iPhone back/swipe to the same destination as the Close button.
export default function useConversationExit(
  destination: "/" | "/memory" | "/shop",
  isBlocked: () => boolean,
): { requestExit: () => void; leavingRef: React.RefObject<boolean> } {
  const [leaving, setLeaving] = React.useState(false);
  const leavingRef = React.useRef(false);
  const requestExit = () => {
    if (leavingRef.current || isBlocked()) return;
    leavingRef.current = true;
    setLeaving(true);
  };
  usePreventRemove(!leaving, requestExit);
  React.useEffect(() => {
    if (leaving) router.dismissTo(destination);
  }, [destination, leaving]);
  return { requestExit, leavingRef };
}
