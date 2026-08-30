import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import BackButton from "@/src/components/common/BackButton";
import StoryCharacters from "@/src/components/story/StoryCharacters";
import StoryChoices from "@/src/components/story/StoryChoices";
import StoryMessageBox from "@/src/components/story/StoryMessageBox";
import StoryUnlockConfirmation from "@/src/components/story/StoryUnlockConfirmation";
import { Colors } from "@/src/constants/theme";
import { EpisodeId } from "@/src/domain/common/types";
import {
  getStoryEpisode,
  getStoryRoute,
  isEpisodeId,
  isStoryRouteUnlocked,
} from "@/src/domain/storyData";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

function parseEpisodeId(
  value: string | string[] | undefined,
): EpisodeId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : NaN;
  return isEpisodeId(parsed) ? parsed : null;
}

function parseRouteId(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function StoryScreen() {
  const {
    state,
    markStoryRead,
    selectInitialStoryRoute,
    unlockAdditionalStoryRoute,
  } = useAppState();
  const [pendingUnlockRouteId, setPendingUnlockRouteId] = React.useState<
    string | null
  >(null);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const params = useLocalSearchParams<{
    episode?: string;
    source?: string;
    route?: string;
  }>();
  const episodeId = parseEpisodeId(params.episode);
  const source =
    params.source === "memory"
      ? "memory"
      : params.source === "home"
        ? "home"
        : "unlock";
  const routeId = parseRouteId(params.route);
  const episode = episodeId ? getStoryEpisode(episodeId) : undefined;
  const progress = episodeId ? state?.storyRouteProgress[episodeId] : undefined;
  const savedInitialRouteId =
    episodeId && source !== "memory"
      ? progress?.firstSelectedRouteId
      : undefined;
  const initialRouteId = routeId ?? savedInitialRouteId;
  const unlockedStory = episodeId
    ? state?.unlockedStories.find((story) => story.episodeId === episodeId)
    : undefined;
  const isUnlocked = Boolean(unlockedStory);
  const route =
    episode && routeId ? getStoryRoute(episode, routeId) : undefined;
  const routeIsUnlocked = Boolean(
    routeId && isStoryRouteUnlocked(progress, routeId),
  );
  const canPlayDirectRoute =
    !routeId || !episode?.routes?.length || routeIsUnlocked;

  const {
    line,
    isLastLine,
    isWaitingForChoice,
    isProcessing,
    error,
    handleNext,
    handleSelectRoute,
    handleClose,
  } = useStoryReader(
    episode,
    source,
    (id) => (isEpisodeId(id) ? markStoryRead(id) : Promise.resolve()),
    initialRouteId,
    episodeId && !progress?.firstSelectedRouteId
      ? (selectedRouteId) => selectInitialStoryRoute(episodeId, selectedRouteId)
      : undefined,
  );

  if (!episode || !isUnlocked || (routeId && (!route || !canPlayDirectRoute))) {
    return (
      <SafeAreaView style={styles.invalidContainer} edges={["top", "bottom"]}>
        <Text style={styles.invalidTitle}>このストーリーはまだ読めません</Text>
        <Text style={styles.invalidDescription}>
          メモリーから解放済みのストーリーを選んでください。
        </Text>
        <BackButton label="戻る" onPress={handleClose} />
      </SafeAreaView>
    );
  }

  if (!line && !isWaitingForChoice) return null;

  const lockedRouteIds =
    source === "memory" && progress?.firstSelectedRouteId
      ? (episode.routes ?? [])
          .filter((item) => !isStoryRouteUnlocked(progress, item.id))
          .map((item) => item.id)
      : [];
  const choiceAnchor = episode.commonBefore[episode.commonBefore.length - 1];

  const requestRoute = (selectedRouteId: string) => {
    if (!lockedRouteIds.includes(selectedRouteId)) {
      void handleSelectRoute(selectedRouteId);
      return;
    }

    setUnlockError(null);
    setPendingUnlockRouteId(selectedRouteId);
  };

  const pendingUnlockRoute = getStoryRoute(
    episode,
    pendingUnlockRouteId ?? undefined,
  );

  const confirmUnlock = async () => {
    if (!pendingUnlockRoute || !episodeId || isUnlocking) {
      return;
    }

    setUnlockError(null);
    setIsUnlocking(true);
    try {
      await unlockAdditionalStoryRoute(episodeId, pendingUnlockRoute.id);
      setPendingUnlockRouteId(null);
    } catch (cause) {
      setUnlockError(
        cause instanceof Error ? cause.message : "もう一度お試しください。",
      );
    } finally {
      setIsUnlocking(false);
    }
  };

  const closeUnlockConfirmation = () => {
    if (isUnlocking) {
      return;
    }
    setUnlockError(null);
    setPendingUnlockRouteId(null);
  };

  const characterLine = line ?? choiceAnchor;

  return (
    <SafeAreaView style={styles.container} edges={["top", "bottom"]}>
      <View style={styles.header}>
        <Text style={styles.episodeTitle} numberOfLines={2}>
          Episode {String(episode.id).padStart(2, "0")} {episode.title}
        </Text>
        <TouchableOpacity
          onPress={handleClose}
          style={styles.closeButton}
          disabled={isProcessing}
          accessibilityRole="button"
          accessibilityLabel="ストーリーを閉じる"
          accessibilityState={{ disabled: isProcessing }}
        >
          <Text style={styles.closeText}>閉じる</Text>
        </TouchableOpacity>
      </View>

      {error ? <Text style={styles.error}>{error}</Text> : null}

      <StoryCharacters
        leftExpression={characterLine?.left}
        rightExpression={characterLine?.right}
        activeSpeaker={isWaitingForChoice ? undefined : characterLine?.speaker}
      />

      {line ? (
        <StoryMessageBox
          speaker={line.speaker}
          text={line.text}
          isLastLine={isLastLine}
          isProcessing={isProcessing}
          onNext={handleNext}
        />
      ) : null}

      {isWaitingForChoice && pendingUnlockRoute && state ? (
        <StoryUnlockConfirmation
          routeLabel={pendingUnlockRoute.label}
          totalNt={state.totalNt}
          isProcessing={isUnlocking}
          error={unlockError}
          onBack={closeUnlockConfirmation}
          onConfirm={() => void confirmUnlock()}
        />
      ) : isWaitingForChoice && episode.routes ? (
        <StoryChoices
          routes={episode.routes}
          onSelect={requestRoute}
          lockedRouteIds={lockedRouteIds}
          disabled={isProcessing}
        />
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1 },
  header: {
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    paddingTop: 8,
  },
  episodeTitle: {
    color: Colors.text,
    flex: 1,
    fontSize: 16,
    fontWeight: "800",
    marginRight: 10,
  },
  closeButton: {
    borderColor: Colors.border,
    borderRadius: 18,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  closeText: { color: Colors.textSub, fontSize: 13, fontWeight: "700" },
  error: {
    backgroundColor: "#FFF1F0",
    borderColor: Colors.warning,
    borderRadius: 8,
    borderWidth: 1,
    color: Colors.warning,
    fontSize: 13,
    marginHorizontal: 18,
    marginTop: 12,
    paddingHorizontal: 12,
    paddingVertical: 9,
    textAlign: "center",
  },
  invalidContainer: {
    alignItems: "center",
    backgroundColor: Colors.background,
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  invalidTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: "800",
    textAlign: "center",
  },
  invalidDescription: {
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
});
