import { router } from "expo-router";
import React from "react";

import { StoryEpisode } from "@/src/domain/common/types";

export const STORY_CHARACTER_INTERVAL_MS = 53;

export default function useStoryReader(
  episode: StoryEpisode | undefined,
  source: "memory" | "home" | "unlock",
  markStoryRead: (id: number) => Promise<void>,
) {
  const [lineIndex, setLineIndex] = React.useState(0);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [visibleCharacterCount, setVisibleCharacterCount] = React.useState(0);
  const [typedLineKey, setTypedLineKey] = React.useState<string>();
  const isProcessingRef = React.useRef(false);
  const cancelTypewriterRef = React.useRef<(() => void) | null>(null);

  // エピソードが変わったら最初のセリフに戻す
  React.useEffect(() => {
    setLineIndex(0);
  }, [episode?.id]);

  const line = episode?.lines[lineIndex];
  const lineId = line?.row;
  const lineKey = `${episode?.id ?? ""}:${lineId ?? ""}`;
  const lineText = line?.text ?? "";

  React.useEffect(() => {
    cancelTypewriterRef.current?.();
    cancelTypewriterRef.current = null;
    setTypedLineKey(lineKey);
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
  }, [lineKey, lineText]);

  const lineCharacters = Array.from(lineText);
  const renderedCharacterCount =
    typedLineKey === lineKey ? visibleCharacterCount : 0;
  const isTyping = Boolean(line && renderedCharacterCount < lineCharacters.length);
  const visibleText = lineCharacters.slice(0, renderedCharacterCount).join("");

  const handleClose = () => {
    if (source === "memory") {
      router.dismissTo("/memory");
    } else {
      router.replace("/");
    }
  };

  const isLastLine = episode ? lineIndex === episode.lines.length - 1 : false;

  const handleNext = async () => {
    if (!episode || !line || isProcessingRef.current) {
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
    isProcessing,
    error,
    handleNext,
    handleClose,
  };
}
