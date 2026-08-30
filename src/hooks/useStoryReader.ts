import { router } from "expo-router";
import React from "react";

import { StoryEpisode } from "@/src/domain/common/types";

export default function useStoryReader(
  episode: StoryEpisode | undefined,
  source: "memory" | "home" | "unlock",
  markStoryRead: (id: number) => Promise<void>,
) {
  const [lineIndex, setLineIndex] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const isProcessingRef = React.useRef(false);

  // エピソードが変わったら最初のセリフに戻す
  React.useEffect(() => {
    setLineIndex(0);
  }, [episode?.id]);

  const handleClose = () => {
    if (source === "memory") {
      router.dismissTo("/memory");
    } else {
      router.replace("/");
    }
  };

  const line = episode?.lines[lineIndex];
  const isLastLine = episode ? lineIndex === episode.lines.length - 1 : false;

  const handleNext = async () => {
    if (!episode || isProcessingRef.current) {
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
    isProcessing,
    error,
    handleNext,
    handleClose,
  };
}
