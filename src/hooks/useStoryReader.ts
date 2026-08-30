import { router } from "expo-router";
import React from "react";

import { StoryEpisode } from "@/src/domain/common/types";
import { getPlayableStoryLines, getStoryRoute } from "@/src/domain/storyData";

type SelectRoute = (routeId: string) => Promise<void>;

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
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isProcessingRef = React.useRef(false);

  React.useEffect(() => {
    setLineIndex(0);
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
    if (!episode || isWaitingForChoice || !line || isProcessingRef.current) {
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
    isLastLine,
    isWaitingForChoice,
    isProcessing,
    error,
    handleNext,
    handleSelectRoute,
    handleClose,
  };
}
