import { router } from "expo-router";
import React from "react";

import { StoryEpisode } from "@/src/domain/common/types";
import { getPlayableStoryLines, getStoryRoute } from "@/src/domain/storyData";

type SelectRoute = (routeId: string) => Promise<void>;
type ReaderOptions = {
  source: "memory" | "home" | "unlock" | "shop";
  initialRouteId?: string;
  selectInitialRoute?: SelectRoute;
  // Used by the shop to persist arrival announcements, not read/unread status.
  onFinish?: () => Promise<void>;
  onClose?: () => void;
  processingRef?: React.RefObject<boolean>;
  exitRequestedRef?: React.RefObject<boolean>;
};

export const STORY_CHARACTER_INTERVAL_MS = 53;

export default function useStoryReader(
  episode: StoryEpisode | undefined,
  { source, initialRouteId, selectInitialRoute, onFinish, onClose,
    processingRef, exitRequestedRef }: ReaderOptions,
) {
  const [lineIndex, setLineIndex] = React.useState(0);
  const [selectedRouteId, setSelectedRouteId] =
    React.useState(initialRouteId);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [visibleCharacterCount, setVisibleCharacterCount] = React.useState(0);
  const [typedLineId, setTypedLineId] = React.useState<string | undefined>();
  const localProcessingRef = React.useRef(false);
  const isProcessingRef = processingRef ?? localProcessingRef;
  const closedRef = React.useRef(false);
  const tapFrameRef = React.useRef<number | null>(null);
  const cancelTypewriterRef = React.useRef<(() => void) | null>(null);

  // Callers key each new conversation; saved selections changing during playback
  // must not restart the reader. Reopening mounts it at line zero.
  React.useEffect(() => () => {
    if (tapFrameRef.current !== null) cancelAnimationFrame(tapFrameRef.current);
  }, []);

  const closeReader = () => {
    if (closedRef.current) return;
    closedRef.current = true;
    if (onClose) {
      onClose();
      return;
    }
    if (source === "memory" || source === "shop") {
      router.dismissTo(source === "shop" ? "/shop" : "/memory");
    } else {
      router.dismissTo("/");
    }
  };
  const handleClose = () => {
    if (!isProcessingRef.current && !exitRequestedRef?.current) closeReader();
  };

  const hasChoice = Boolean(episode?.routes?.length);
  const isWaitingForChoice = Boolean(
    episode && hasChoice && !selectedRouteId && lineIndex >= episode.commonBefore.length,
  );
  const lines = episode
    ? selectedRouteId
      ? getPlayableStoryLines(episode, selectedRouteId)
      : episode.routes?.length
        ? episode.commonBefore
        : getPlayableStoryLines(episode)
    : [];
  const line = lines[lineIndex];
  const isLastLine =
    Boolean(line) &&
    lineIndex === lines.length - 1 &&
    !(hasChoice && !selectedRouteId);

  const lineId = line?.id;
  const lineText = line?.text ?? "";

  React.useEffect(() => {
    cancelTypewriterRef.current?.();
    cancelTypewriterRef.current = null;
    // Reset together with the external typewriter timer, not one frame after it starts.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTypedLineId(lineId);
    setVisibleCharacterCount(0);

    const characters = Array.from(lineText);
    if (characters.length === 0) {
      return;
    }

    let characterCount = 0;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;
    let cancelled = false;
    const revealNextCharacter = () => {
      if (cancelled) {
        return;
      }
      characterCount += 1;
      setVisibleCharacterCount(characterCount);
      if (characterCount < characters.length) {
        timeoutId = setTimeout(
          revealNextCharacter,
          STORY_CHARACTER_INTERVAL_MS,
        );
      } else if (cancelTypewriterRef.current === cancel) {
        cancelTypewriterRef.current = null;
      }
    };
    const cancel = () => {
      cancelled = true;
      if (timeoutId !== undefined) {
        clearTimeout(timeoutId);
      }
    };

    cancelTypewriterRef.current = cancel;
    timeoutId = setTimeout(revealNextCharacter, STORY_CHARACTER_INTERVAL_MS);

    return () => {
      cancel();
      if (cancelTypewriterRef.current === cancel) {
        cancelTypewriterRef.current = null;
      }
    };
  }, [lineId, lineText]);

  const lineCharacters = Array.from(lineText);
  const renderedCharacterCount =
    typedLineId === lineId ? visibleCharacterCount : 0;
  const isTyping = Boolean(line && renderedCharacterCount < lineCharacters.length);
  const visibleText = lineCharacters.slice(0, renderedCharacterCount).join("");

  const handleSelectRoute = async (routeId: string) => {
    if (
      !episode ||
      !hasChoice ||
      selectedRouteId ||
      !getStoryRoute(episode, routeId) ||
      isProcessingRef.current || closedRef.current || exitRequestedRef?.current
    ) {
      return;
    }

    setError(null);
    isProcessingRef.current = true;
    setIsProcessing(true);
    try {
      if (selectInitialRoute) {
        await selectInitialRoute(routeId);
      }
      setSelectedRouteId(routeId);
      setLineIndex(episode.commonBefore.length);
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "選択肢を保存できませんでした。もう一度お試しください。",
      );
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  const handleNext = async () => {
    if (!episode || isWaitingForChoice || !line || isProcessingRef.current || closedRef.current || exitRequestedRef?.current || tapFrameRef.current !== null) {
      return;
    }
    tapFrameRef.current = requestAnimationFrame(() => { tapFrameRef.current = null; });
    if (isTyping) {
      cancelTypewriterRef.current?.();
      cancelTypewriterRef.current = null;
      setVisibleCharacterCount(lineCharacters.length);
      return;
    }
    if (!isLastLine) {
      setLineIndex((index) => index + 1);
      return;
    }
    if (!onFinish) {
      closeReader();
      return;
    }

    setError(null);
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      await onFinish();
      isProcessingRef.current = false;
      closeReader();
    } catch (cause) {
      setError(
        cause instanceof Error
          ? cause.message
          : "ストーリーを保存できませんでした。もう一度お試しください。",
      );
    } finally {
      isProcessingRef.current = false;
      setIsProcessing(false);
    }
  };

  return {
    line,
    visibleText,
    isTyping,
    isLastLine,
    isWaitingForChoice,
    isProcessing,
    isProcessingRef,
    error,
    handleNext,
    handleSelectRoute,
    handleClose,
  };
}
