import { useLocalSearchParams } from "expo-router";
import React from "react";
import { StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import BackButton from "@/src/components/common/BackButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import StoryCharacters from "@/src/components/story/StoryCharacters";
import StoryChoices from "@/src/components/story/StoryChoices";
import { StoryMessage } from "@/src/components/story/StoryMessageBox";
import StoryScene from "@/src/components/story/StoryScene";
import StoryUnlockConfirmation from "@/src/components/story/StoryUnlockConfirmation";
import { getAdditionalRoutePriceNt } from "@/src/config/conversationSettings";
import { Colors, Fonts } from "@/src/constants/theme";
import { EpisodeId } from "@/src/domain/common/types";
import {
  STORY_CATALOG,
  StoryCatalog,
  getStoryEpisode,
  getStoryRoute,
  isEpisodeId,
  isStoryRouteUnlocked,
} from "@/src/domain/storyData";
import useConversationExit from "@/src/hooks/useConversationExit";
import useStoryReader from "@/src/hooks/useStoryReader";
import { useAppState } from "@/src/state/AppStateProvider";

function parseEpisodeId(
  value: string | string[] | undefined,
  catalog: StoryCatalog,
): EpisodeId | null {
  const raw = Array.isArray(value) ? value[0] : value;
  const parsed = raw ? Number(raw) : NaN;
  return isEpisodeId(parsed, catalog) ? parsed : null;
}

function parseRouteId(
  value: string | string[] | undefined,
): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

export default function StoryScreen({
  catalog = STORY_CATALOG,
}: {
  catalog?: StoryCatalog;
}) {
  const { top } = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    episode?: string;
    source?: string;
    route?: string;
  }>();
  return (
    <View style={{ flex: 1, paddingTop: top + 76 }}>
      <ScreenBackground source={require("@/assets/bg/starry-bg.png")} />
      <StoryPlayback
        key={JSON.stringify([params.episode, params.source, params.route])}
        catalog={catalog}
      />
    </View>
  );
}

function StoryPlayback({ catalog }: { catalog: StoryCatalog }) {
  const { state, selectInitialStoryRoute, unlockAdditionalStoryRoute } =
    useAppState();
  const [pendingUnlockRouteId, setPendingUnlockRouteId] = React.useState<
    string | null
  >(null);
  const [isUnlocking, setIsUnlocking] = React.useState(false);
  const unlockingRef = React.useRef(false);
  const [unlockError, setUnlockError] = React.useState<string | null>(null);
  const params = useLocalSearchParams<{
    episode?: string;
    source?: string;
    route?: string;
  }>();
  const episodeId = parseEpisodeId(params.episode, catalog);
  const source =
    params.source === "memory"
      ? "memory"
      : params.source === "home"
        ? "home"
        : "unlock";
  const routeId = parseRouteId(params.route);
  const episode = episodeId ? getStoryEpisode(episodeId, catalog) : undefined;
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

  const readingRef = React.useRef(false);
  const exit = useConversationExit(
    source === "memory" ? "/memory" : "/",
    () => unlockingRef.current || readingRef.current,
  );
  const reader = useStoryReader(
    isUnlocked && canPlayDirectRoute ? episode : undefined,
    {
      source,
      initialRouteId,
      userName: state?.userName,
      selectInitialRoute: episodeId
        ? (selectedRouteId) =>
            selectInitialStoryRoute(episodeId, selectedRouteId)
        : undefined,
      onClose: exit.requestExit,
      processingRef: readingRef,
      exitRequestedRef: exit.leavingRef,
    },
  );
  const {
    line,
    isWaitingForChoice,
    isProcessing,
    error,
    handleSelectRoute,
    handleClose,
  } = reader;

  if (!episode || !isUnlocked || (routeId && (!route || !canPlayDirectRoute))) {
    return (
      <View style={styles.invalidContainer}>
        <Text style={styles.invalidTitle}>このストーリーはまだ読めません</Text>
        <Text style={styles.invalidDescription}>
          メモリーから解放済みのストーリーを選んでください。
        </Text>
        <BackButton onPress={handleClose} />
      </View>
    );
  }

  if (!line && !isWaitingForChoice) return null;

  const lockedRouteIds = progress?.firstSelectedRouteId
    ? (episode.routes ?? [])
        .filter((item) => !isStoryRouteUnlocked(progress, item.id))
        .map((item) => item.id)
    : [];
  const choiceAnchor = episode.commonBefore[episode.commonBefore.length - 1];

  const requestRoute = (selectedRouteId: string) => {
    if (exit.leavingRef.current || unlockingRef.current) return;
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
    if (
      !pendingUnlockRoute ||
      !episodeId ||
      unlockingRef.current ||
      exit.leavingRef.current
    ) {
      return;
    }

    unlockingRef.current = true;
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
      unlockingRef.current = false;
      setIsUnlocking(false);
    }
  };

  const closeUnlockConfirmation = () => {
    if (unlockingRef.current) {
      return;
    }
    setUnlockError(null);
    setPendingUnlockRouteId(null);
  };

  const characterLine = line ?? choiceAnchor;

  return (
    <StoryScene
      title={`Episode ${String(episode.id).padStart(2, "0")} ${episode.title}`}
      episodeNumber={episode.id}
      dateLabel={unlockedStory?.unlockedDate.replaceAll("-", "/")}
      onClose={() => {
        if (!unlockingRef.current) handleClose();
      }}
      disabled={isProcessing || isUnlocking}
      error={error}
      contentKey={
        isWaitingForChoice
          ? pendingUnlockRoute
            ? `unlock:${pendingUnlockRoute.id}`
            : "choices"
          : line?.id
      }
      characters={
        <StoryCharacters
          leftExpression={characterLine?.left}
          rightExpression={characterLine?.right}
        />
      }
    >
      <StoryMessage {...reader} />

      {isWaitingForChoice && pendingUnlockRoute && state ? (
        <StoryUnlockConfirmation
          priceNt={getAdditionalRoutePriceNt(episode.id)}
          routeLabel={pendingUnlockRoute.label}
          totalNt={state.totalNt}
          isProcessing={isUnlocking}
          error={unlockError}
          onBack={closeUnlockConfirmation}
          onConfirm={() => void confirmUnlock()}
        />
      ) : isWaitingForChoice && episode.routes ? (
        <StoryChoices
          priceNt={getAdditionalRoutePriceNt(episode.id)}
          routes={episode.routes}
          onSelect={requestRoute}
          lockedRouteIds={lockedRouteIds}
          disabled={isProcessing}
        />
      ) : null}
    </StoryScene>
  );
}

const styles = StyleSheet.create({
  invalidContainer: {
    alignItems: "center",
    flex: 1,
    justifyContent: "center",
    padding: 24,
  },
  invalidTitle: {
    color: Colors.text,
    fontSize: 20,
    fontFamily: Fonts.bold,
    textAlign: "center",
  },
  invalidDescription: {
    fontFamily: Fonts.regular,
    color: Colors.textSub,
    fontSize: 14,
    lineHeight: 22,
    marginTop: 10,
    textAlign: "center",
  },
});
