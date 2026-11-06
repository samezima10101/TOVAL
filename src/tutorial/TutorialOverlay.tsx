import { usePathname } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";
import { CoachMark, TutorialTransition, type Spotlight } from "./TutorialEffects";
import { useTutorial, type TutorialSurface } from "./TutorialContext";
import { TUTORIAL_STEPS } from "./steps";

export default function TutorialOverlay({
  surface,
}: {
  surface: TutorialSurface;
}) {
  const tutorial = useTutorial();
  const measureTarget = tutorial.measure;
  const { state } = useAppState();
  const pathname = usePathname();
  const insets = useSafeAreaInsets();
  const root = useRef<ViewInstance>(null);
  const [bounds, setBounds] = useState({ width: 0, height: 0, y: 0 });
  const [spot, setSpot] = useState<Spotlight | null>(null);
  const [cardSize, setCardSize] = useState({ key: "", height: 0 });
  const step = TUTORIAL_STEPS[tutorial.index];
  const onScreen =
    tutorial.practicing &&
    !tutorial.powerSaving &&
    ((pathname === "/" && (step.scene === "home" || step.scene === "done")) ||
      (pathname === "/timer" && step.scene === "timer"));
  const shown =
    tutorial.active &&
    (surface === "screen"
      ? onScreen ||
        tutorial.closing ||
        (tutorial.intro && pathname !== "/story")
      : surface === "story"
        ? tutorial.intro
        : surface === "power"
          ? tutorial.powerSaving
          : surface === "setup"
            ? tutorial.practicing && step.scene === "setup"
            : surface === "diary"
              ? tutorial.practicing && step.scene === "diary"
              : false);

  useLayoutEffect(() => {
    if (!shown) return;
    let cancelled = false;
    const measure = () =>
      root.current?.measureInWindow((_x, rootY, width, height) => {
        if (cancelled) return;
        setBounds((current) =>
          current.width === width &&
          current.height === height &&
          current.y === rootY
            ? current
            : { width, height, y: rootY },
        );
        const targetId = step.target;
        if (!targetId) return;
        measureTarget(targetId, (x, y, targetWidth, targetHeight) => {
          if (cancelled) return;
          // The NT frame asset extends to 170% of its native badge bounds.
          const paddingX = targetId === "nt" ? targetWidth * 0.35 : 4;
          const paddingY = targetId === "nt" ? targetHeight * 0.35 : 4;
          const left = Math.max(0, x - _x - paddingX);
          const top = Math.max(0, y - rootY - paddingY);
          const next = {
            key: targetId,
            x: left,
            y: top,
            width: Math.min(
              width - left,
              x - _x + targetWidth + paddingX - left,
            ),
            height: Math.min(
              height - top,
              y - rootY + targetHeight + paddingY - top,
            ),
          };
          setSpot((current) =>
            current?.key === next.key &&
            current.x === next.x &&
            current.y === next.y &&
            current.width === next.width &&
            current.height === next.height
              ? current
              : next,
          );
        });
      });
    const frame = requestAnimationFrame(measure);
    // Recheck while native navigation/modal animations move the existing views.
    const interval = setInterval(measure, 250);
    return () => {
      cancelled = true;
      cancelAnimationFrame(frame);
      clearInterval(interval);
    };
  }, [shown, step.id, step.target, measureTarget]);

  if (!shown) return null;
  const disabled = tutorial.busy || tutorial.closing || tutorial.transitioning;
  const skip = (
    <TouchableOpacity
      onPress={() => tutorial.close("skipped")}
      disabled={disabled}
      style={styles.button}
      accessibilityRole="button"
      accessibilityLabel="チュートリアルをスキップ"
    >
      <Text style={styles.action}>
        {tutorial.busy ? "保存中…" : "スキップ"}
      </Text>
    </TouchableOpacity>
  );

  if (surface === "story" || surface === "power")
    return (
      <View
        style={[
          styles.overlay,
          { paddingTop: Math.max(8, insets.top - bounds.y) },
        ]}
        pointerEvents="box-none"
      >
        <View style={styles.skipOnly}>{skip}</View>
        {tutorial.error ? (
          <Text style={styles.error} accessibilityRole="alert">
            {tutorial.error}
          </Text>
        ) : null}
      </View>
    );

  const target = step.target && spot?.key === step.target ? spot : null;
  const skipTop = Math.max(8, insets.top - bounds.y + 8);
  const top = skipTop + 44;
  // Full text takes priority over the footer; never constrain it to a scroll box.
  const bottom = insets.bottom + 8;
  const cardHeight = cardSize.height || 220;
  const above = target ? target.y - top - 12 : 0;
  const below = target
    ? bounds.height - bottom - target.y - target.height - 12
    : 0;
  const useAbove = above >= cardHeight || (below < cardHeight && above > below);
  const position =
    target && bounds.height
      ? {
          top: Math.max(
            top,
            Math.min(
              useAbove
                ? target.y - cardHeight - 12
                : target.y + target.height + 12,
              bounds.height - bottom - cardHeight,
            ),
          ),
        }
      : { bottom };
  const last = tutorial.index === TUTORIAL_STEPS.length - 1;
  const next = () => {
    if (disabled || step.action) return;
    if (last) tutorial.close("completed");
    else tutorial.advance();
  };

  return (
    <View
      ref={root}
      collapsable={false}
      style={styles.overlay}
      pointerEvents="box-none"
      accessibilityViewIsModal={!step.action}
    >
      <CoachMark
        spot={target}
        fullScreen={step.fullScreen}
        interactive={Boolean(step.action) && !disabled}
      />
      {!step.action ? (
        <Pressable
          style={StyleSheet.absoluteFill}
          onPress={next}
          disabled={disabled}
          accessible={false}
        />
      ) : null}
      <TutorialTransition
        contentKey={step.id}
        style={[styles.cardPosition, position]}
      >
        <Pressable
          style={styles.card}
          onPress={step.action ? undefined : next}
          accessible={false}
          onLayout={({ nativeEvent: { layout } }) =>
            setCardSize((current) =>
              current.key === step.id && current.height === layout.height
                ? current
                : { key: step.id, height: layout.height },
            )
          }
        >
          <View style={styles.header}>
            <Text style={styles.counter}>
              チュートリアル {tutorial.index + 1}/{TUTORIAL_STEPS.length}
            </Text>
          </View>
          <View>
            <Text style={styles.speaker}>
              {step.speaker === "alta" ? "アルタ" : "ジェム"}
            </Text>
            <Text style={styles.text}>
              {step.text.replace(
                /\[userName\]/g,
                () => state?.userName ?? "ゲスト",
              )}
            </Text>
            {tutorial.error ? (
              <Text style={styles.error} accessibilityRole="alert">
                {tutorial.error}
              </Text>
            ) : null}
          </View>
          <View style={styles.controls}>
            <TouchableOpacity
              style={styles.button}
              accessibilityRole="button"
              accessibilityLabel="前のチュートリアルに戻る"
              accessibilityState={{ disabled: disabled || tutorial.index === 0 }}
              disabled={disabled}
              onPress={tutorial.back}
            >
              <Text style={[styles.action, tutorial.index === 0 && styles.muted]}>
                ＜ 戻る
              </Text>
            </TouchableOpacity>
            {step.action ? (
              <Text style={styles.hint}>光っている場所を操作してください</Text>
            ) : (
              <TouchableOpacity
                style={styles.button}
                accessibilityRole="button"
                disabled={disabled}
                onPress={next}
              >
                <Text style={styles.action}>
                  {last ? "アプリをはじめる" : "次へ ▼"}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </Pressable>
      </TutorialTransition>
      <View style={[styles.skipOnly, styles.skipPosition, { top: skipTop }]}>
        {skip}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 100,
  },
  cardPosition: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  card: {
    borderWidth: 2,
    borderColor: "#BDF9F5",
    borderRadius: 12,
    backgroundColor: "#112D46",
    paddingHorizontal: 14,
    paddingTop: 12,
    paddingBottom: 8,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 4,
  },
  counter: {
    flex: 1,
    color: "#BDF9F5",
    fontFamily: Fonts.medium,
    fontSize: 12,
  },
  controls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  muted: { opacity: 0.35 },
  speaker: {
    color: "#BDF9F5",
    fontFamily: Fonts.bold,
    fontSize: 14,
    marginBottom: 6,
  },
  text: {
    color: "#FFFFFF",
    fontFamily: Fonts.medium,
    fontSize: 15,
    lineHeight: 23,
    paddingBottom: 8,
  },
  button: {
    minHeight: 44,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 12,
  },
  action: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 14 },
  hint: {
    flex: 1,
    color: "#BDF9F5",
    fontFamily: Fonts.medium,
    textAlign: "center",
    fontSize: 12,
    paddingVertical: 10,
  },
  skipOnly: {
    alignSelf: "flex-end",
    marginRight: 12,
    borderRadius: 8,
    backgroundColor: "#112D46",
  },
  skipPosition: { position: "absolute", right: 0 },
  error: {
    color: "#FFD5DC",
    backgroundColor: "#722C43",
    fontFamily: Fonts.medium,
    padding: 8,
  },
});
