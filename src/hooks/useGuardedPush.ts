import { router, useFocusEffect } from "expo-router";
import React from "react";

export default function useGuardedPush() {
  const navigatingRef = React.useRef(false);
  useFocusEffect(React.useCallback(() => { navigatingRef.current = false; }, []));
  return (href: Parameters<typeof router.push>[0]) => {
    if (navigatingRef.current) return;
    navigatingRef.current = true;
    router.push(href);
  };
}
