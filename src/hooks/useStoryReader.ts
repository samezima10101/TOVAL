import { router } from "expo-router";
import React from "react";

import { StoryEpisode } from "@/src/domain/common/types";
import { getPlayableStoryLines, getStoryRoute } from "@/src/domain/storyData";

type SelectRoute = (routeId: string) => Promise<void>;

export const STORY_CHARACTER_INTERVAL_MS = 53;

export default function useStoryReader(
  episode: StoryEpisode | undefined,
  source: "memory" | "home" | "unlock",
  markStoryRead: (id: number) => Promise<void>,
  initialRouteId: string | undefined = undefined,
  selectInitialRoute?: SelectRoute,
) {
  const [lineIndex, setLineIndex] = React.useState(0);
  const [selectedRouteId, setSelectedRouteId] =
    React.useState(initialRouteId);
  const selectedRouteIdRef = React.useRef(initialRouteId);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [visibleCharacterCount, setVisibleCharacterCount] = React.useState(0);
  const [typedLineId, setTypedLineId] = React.useState<string | undefined>();
  const isProcessingRef = React.useRef(false);
  const cancelTypewriterRef = React.useRef<(() => void) | null>(null);

  React.useEffect(() => {
    if (
      initialRouteId !== undefined &&
      selectedRouteIdRef.current === initialRouteId
    ) {
      return;
    }
    setLineIndex(0);
    selectedRouteIdRef.current = initialRouteId;
    setSelectedRouteId(initialRouteId);
    setError(null);
  }, [episode?.id, initialRouteId]);

  const handleClose = () => {
    if (source === "memory") {
      router.dismissTo("/memory");
    } else {
      router.replace("/");
    }
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
      isProcessingRef.current
    ) {
      return;
    }

    setError(null);
    isProcessingRef.current = true;
    selectedRouteIdRef.current = routeId;
    setIsProcessing(true);
    try {
      if (selectInitialRoute) {
        await selectInitialRoute(routeId);
      }
      setSelectedRouteId(routeId);
      setLineIndex(episode.commonBefore.length);
    } catch (cause) {
      selectedRouteIdRef.current = undefined;
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
    if (!episode || isWaitingForChoice || !line || isProcessingRef.current) {
      return;
    }
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

    setError(null);
    isProcessingRef.current = true;
    setIsProcessing(true);

    try {
      await markStoryRead(episode.id);
      handleClose();
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
    error,
    handleNext,
    handleSelectRoute,
    handleClose,
  };
}
