import {
  router,
  useGlobalSearchParams,
  usePathname,
  useRootNavigationState,
  useSegments,
} from "expo-router";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
} from "react";
import { Alert, Keyboard, StyleSheet, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { Colors, Fonts } from "@/src/constants/theme";
import { localDateKey, localTimeKey } from "@/src/domain/common/date";
import type { ActiveTimer } from "@/src/domain/common/types";
import {
  AppStateContext,
  useAppState,
  type AppStateContextValue,
} from "@/src/state/AppStateProvider";
import {
  TutorialContext,
  type Measurable,
  type TutorialSurface,
} from "./TutorialContext";
import { getIntroSegment } from "./content/intro";
import {
  TUTORIAL_STEPS,
  type TutorialAction,
  type TutorialTarget,
} from "./content/steps";
import {
  hasFinishedTutorial,
  saveTutorialResult,
  type TutorialResult,
} from "./tutorialStorage";

export default function TutorialProvider({ children }: PropsWithChildren) {
  const app = useAppState();
  const pathname = usePathname();
  const { source } = useGlobalSearchParams<{ source?: string }>();
  const navigation = useRootNavigationState();
  // SDK 58 wraps the app navigator in an internal __root route. Segments omit
  // that wrapper and identify the actual app route group, including (tabs).
  const segments = useSegments();
  const withinTabs = segments[0] === "(tabs)";
  const [phase, setPhase] = useState<"loading" | "intro" | "practice" | "idle">(
    "loading",
  );
  const [initial, setInitial] = useState(true);
  const [closing, setClosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);
  const [pendingIndex, setPendingIndex] = useState<number | null>(null);
  const [introPart, setIntroPart] = useState(0);
  const [introInput, setIntroInput] = useState(false);
  const [startedAt, setStartedAt] = useState(0);
  const [powerSaving, setPowerSaving] = useState(false);
  const [modal, setModal] = useState<TutorialSurface | null>(null);
  const busyRef = useRef(false);
  const skipConfirmationRef = useRef(false);
  const indexRef = useRef(0);
  const readRevision = useRef(0);
  const anchors = useRef<Partial<Record<TutorialTarget, Measurable>>>({});
  const step = TUTORIAL_STEPS[index];
  const active = phase !== "idle";
  const practicing = phase === "practice";
  const transitioning = pendingIndex !== null;
  const destination = initial ? "/" : "/menu";

  const load = useCallback(() => {
    const revision = ++readRevision.current;
    return hasFinishedTutorial().then(
      (finished) => {
        if (readRevision.current !== revision) return;
        setInitial(!finished);
        setPhase(finished ? "idle" : "intro");
        setError(null);
      },
      () => {
        if (readRevision.current === revision)
          setError("チュートリアルの状態を読み込めませんでした。");
      },
    );
  }, []);

  useEffect(() => {
    void load();
    return () => {
      readRevision.current += 1;
    };
  }, [load]);

  // Keep the actual navigator mounted. The guide uses the ordinary routes.
  useEffect(() => {
    if (!navigation?.key || phase === "loading" || phase === "idle") return;
    const goToTab = (target: "/" | "/menu") => {
      const frame = requestAnimationFrame(() => {
        // dismissTo dispatches POP_TO, which the tab navigator cannot handle.
        // Pop a stack only when leaving a screen such as Story or Timer.
        if (withinTabs) router.navigate(target);
        else router.dismissTo(target);
      });
      return () => cancelAnimationFrame(frame);
    };
    if (closing) {
      if (modal !== null) return;
      if (pathname !== destination) return goToTab(destination);
      const frame = requestAnimationFrame(() => {
        setPhase("idle");
        setClosing(false);
        setPowerSaving(false);
      });
      return () => cancelAnimationFrame(frame);
    }
    if (phase === "intro" && (pathname !== "/story" || source !== "tutorial")) {
      const frame = requestAnimationFrame(() =>
        router.replace({ pathname: "/story", params: { source: "tutorial" } }),
      );
      return () => cancelAnimationFrame(frame);
    } else if (practicing && !transitioning && modal === null) {
      if (step.scene === "timer" || step.scene === "diary") {
        if (pathname !== "/timer") {
          const frame = requestAnimationFrame(() => router.navigate("/timer"));
          return () => cancelAnimationFrame(frame);
        }
      } else if (pathname !== "/") {
        return goToTab("/");
      }
    }
  }, [
    navigation?.key,
    withinTabs,
    phase,
    practicing,
    closing,
    modal,
    pathname,
    source,
    destination,
    step.scene,
    transitioning,
  ]);

  // Close native Modals only when leaving their scene, never between its lines.
  useEffect(() => {
    if (pendingIndex === null || modal !== null) return;
    const frame = requestAnimationFrame(() => {
      setIndex(pendingIndex);
      setPendingIndex(null);
      setPowerSaving(false);
    });
    return () => cancelAnimationFrame(frame);
  }, [pendingIndex, modal]);

  const run = useCallback((operation: () => Promise<void>) => {
    if (busyRef.current) return;
    busyRef.current = true;
    setBusy(true);
    setError(null);
    void operation()
      .catch((cause: unknown) => {
        setError(
          cause instanceof Error
            ? cause.message
            : "保存できませんでした。もう一度お試しください。",
        );
      })
      .finally(() => {
        busyRef.current = false;
        setBusy(false);
      });
  }, []);

  const finish = (result: TutorialResult) =>
    run(async () => {
      if (initial) await saveTutorialResult(result);
      Keyboard.dismiss();
      setClosing(true);
    });

  const close = (result: TutorialResult) => {
    if (busyRef.current || closing || transitioning || !active) return;
    if (result === "completed") {
      finish(result);
      return;
    }
    if (skipConfirmationRef.current) return;
    skipConfirmationRef.current = true;
    const cancel = () => {
      skipConfirmationRef.current = false;
    };
    Alert.alert(
      "チュートリアルをスキップしますか？",
      "（チュートリアルはメニュー画面からあとで行うことができます）",
      [
        { text: "キャンセル", style: "cancel", onPress: cancel },
        {
          text: "スキップする",
          style: "destructive",
          onPress: () => {
            skipConfirmationRef.current = false;
            finish("skipped");
          },
        },
      ],
      { cancelable: true, onDismiss: cancel },
    );
  };

  const advance = useCallback(
    (action?: TutorialAction) => {
      if (
        !practicing ||
        closing ||
        busyRef.current ||
        skipConfirmationRef.current ||
        indexRef.current !== index ||
        step.action !== action
      )
        return;
      if (index === TUTORIAL_STEPS.length - 1) return;
      indexRef.current = index + 1;
      if (TUTORIAL_STEPS[index + 1].scene === step.scene) setIndex(index + 1);
      else setPendingIndex(index + 1);
    },
    [practicing, closing, index, step.action, step.scene],
  );

  const back = () => {
    if (
      !practicing ||
      closing ||
      busyRef.current ||
      skipConfirmationRef.current ||
      indexRef.current !== index ||
      index === 0
    ) return;
    indexRef.current = index - 1;
    if (TUTORIAL_STEPS[index - 1].scene === step.scene) setIndex(index - 1);
    else setPendingIndex(index - 1);
  };

  const modalShown = useCallback(
    (surface: TutorialSurface) => setModal(surface),
    [],
  );
  const modalDismissed = useCallback(
    (surface: TutorialSurface) =>
      setModal((current) => (current === surface ? null : current)),
    [],
  );
  const register = useCallback(
    (id: TutorialTarget, node: Measurable | null) => {
      if (node) anchors.current[id] = node;
      else delete anchors.current[id];
    },
    [],
  );
  const measure = useCallback(
    (
      id: TutorialTarget,
      callback: (x: number, y: number, width: number, height: number) => void,
    ) => {
      anchors.current[id]?.measureInWindow(callback);
    },
    [],
  );

  const replay = () => {
    if (active) return;
    Keyboard.dismiss();
    indexRef.current = 0;
    setIndex(0);
    setStartedAt(0);
    setInitial(false);
    setError(null);
    setPhase("practice");
  };
  const nextIntro = () => {
    if (getIntroSegment(introPart).field) setIntroInput(true);
    else {
      indexRef.current = 0;
      setIndex(0);
      setPhase("practice");
    }
  };

  // The actual screens/hooks receive an in-memory timer scope. The production
  // provider and its timer/reward/storage functions never receive practice data.
  const scopedApp = useMemo<AppStateContextValue>(() => {
    if (!active || phase === "loading" || !app.state) return app;
    const timerVisible =
      practicing && (step.scene === "timer" || step.scene === "diary");
    const timer: ActiveTimer | null = timerVisible
      ? {
          sessionId: "tutorial-practice",
          plannedSeconds: 300,
          startedTaskName: app.state.taskName || "チュートリアル",
          startInfo: {
            startedAt,
            startedDate: localDateKey(startedAt),
            startedTime: localTimeKey(startedAt),
          },
          accumulatedMs: step.overtime || step.scene === "diary" ? 315000 : 0,
          runningSince: null,
        }
      : null;
    return {
      ...app,
      state: {
        ...app.state,
        activeTimer: timer,
        ...(practicing
          ? {
              defaultTimerMinutes: 25,
              taskName: app.state.taskName || "チュートリアル",
            }
          : {}),
      },
      timerSaveError: null,
      retryTimerSave: async () => undefined,
      startTimer: async (seconds) => {
        if (!practicing || step.action !== "begin" || seconds !== 300)
          throw new Error("チュートリアルでは5分を設定してください。");
        const now = Date.now();
        setStartedAt(now);
        advance("begin");
        return {
          sessionId: "tutorial-practice",
          plannedSeconds: 300,
          startedTaskName: app.state!.taskName,
          startInfo: {
            startedAt: now,
            startedDate: localDateKey(now),
            startedTime: localTimeKey(now),
          },
          accumulatedMs: 0,
          runningSince: null,
        };
      },
      setTimerRouteFocused: async (focused, changedAt) => {
        if (!focused && changedAt !== undefined) advance("finish");
      },
      cancelTimer: async () => {
        throw new Error("案内に沿って操作してください。");
      },
      finishTimer: async () => {
        if (!practicing || step.action !== "save")
          throw new Error("案内に沿って操作してください。");
        advance("save");
        return {
          status: "completed",
          state: app.state!,
          earnedNt: 0,
          unlockedEpisode: null,
        };
      },
    };
  }, [
    active,
    phase,
    app,
    practicing,
    step.scene,
    step.overtime,
    step.action,
    startedAt,
    advance,
  ]);

  return (
    <TutorialContext.Provider
      value={{
        active,
        practicing,
        intro: phase === "intro",
        closing,
        busy,
        transitioning,
        error,
        index,
        introPart,
        introInput,
        powerSaving,
        advance,
        back,
        replay,
        close,
        nextIntro,
        run,
        setPowerSaving,
        modalShown,
        modalDismissed,
        register,
        measure,
        savedIntroInput: () => {
          setIntroInput(false);
          setIntroPart((part) => part + 1);
        },
      }}
    >
      {phase === "loading" ? (
        <SafeAreaView style={styles.loading}>
          <Text style={styles.message}>
            {error ?? "チュートリアルを準備しています…"}
          </Text>
          {error ? (
            <PrimaryButton
              title="もう一度読み込む"
              onPress={() => void load()}
            />
          ) : null}
          {error ? (
            <PrimaryButton
              title="今回はアプリへ進む"
              onPress={() => {
                readRevision.current += 1;
                setPhase("idle");
              }}
            />
          ) : null}
        </SafeAreaView>
      ) : (
        <AppStateContext.Provider value={scopedApp}>
          {children}
        </AppStateContext.Provider>
      )}
    </TutorialContext.Provider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    gap: 20,
    padding: 24,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.background,
  },
  message: {
    color: Colors.text,
    fontFamily: Fonts.medium,
    textAlign: "center",
  },
});
