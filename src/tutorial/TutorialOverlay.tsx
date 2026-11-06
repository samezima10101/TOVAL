import { usePathname } from "expo-router";
import { useLayoutEffect, useRef, useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  type ViewInstance,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";
import CoachMark, { type Spotlight } from "./CoachMark";
import { useTutorial, type TutorialSurface } from "./TutorialContext";
import { TUTORIAL_STEPS } from "./content/steps";

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
        if (!step.target) return;
        measureTarget(step.target, (x, y, targetWidth, targetHeight) => {
          if (cancelled) return;
          const next = {
            key: step.id,
            x: Math.max(0, x - _x - 4),
            y: Math.max(0, y - rootY - 4),
            width: Math.min(width, targetWidth + 8),
            height: Math.min(height, targetHeight + 8),
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
  const skip = (
    <TouchableOpacity
      onPress={() => tutorial.close("skipped")}
      disabled={tutorial.busy || tutorial.closing}
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

  const target = step.target && spot?.key === step.id ? spot : null;
  const top = Math.max(8, insets.top - bounds.y + 8);
  const bottom = surface === "screen" ? insets.bottom + 66 : insets.bottom + 12;
  const above = target ? target.y - top - 12 : 0;
  const below = target
    ? bounds.height - bottom - target.y - target.height - 12
    : 0;
  const useAbove = Boolean(target && above > below);
  const available = target
    ? Math.max(100, useAbove ? above : below)
    : Math.max(160, bounds.height - top - bottom);
  const position = target
    ? useAbove
      ? { bottom: bounds.height - target.y + 12 }
      : { top: target.y + target.height + 12 }
    : { bottom };
  const last = tutorial.index === TUTORIAL_STEPS.length - 1;

  return (
    <View
      ref={root}
      collapsable={false}
      style={styles.overlay}
      pointerEvents="box-none"
    >
      <CoachMark
        spot={target}
        interactive={
          Boolean(step.action) && !tutorial.busy && !tutorial.closing
        }
      />
      <View
        style={[styles.card, position, { maxHeight: Math.min(320, available) }]}
        accessibilityViewIsModal={!step.action}
      >
        <View style={styles.header}>
          <Text style={styles.counter}>
            チュートリアル {tutorial.index + 1}/{TUTORIAL_STEPS.length}
          </Text>
          {skip}
        </View>
        <ScrollView key={step.id} style={styles.message}>
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
        </ScrollView>
        {step.action ? (
          <Text style={styles.hint}>光っている場所を操作してください</Text>
        ) : (
          <TouchableOpacity
            style={styles.button}
            accessibilityRole="button"
            disabled={tutorial.busy || tutorial.closing}
            onPress={() =>
              last ? tutorial.close("completed") : tutorial.advance()
            }
          >
            <Text style={styles.action}>
              {last ? "アプリをはじめる" : "次へ ▼"}
            </Text>
          </TouchableOpacity>
        )}
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
  card: {
    position: "absolute",
    left: 16,
    right: 16,
    borderWidth: 2,
    borderColor: "#BDF9F5",
    borderRadius: 12,
    backgroundColor: "#112D46",
    paddingHorizontal: 14,
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
  message: { flexShrink: 1 },
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
  error: {
    color: "#FFD5DC",
    backgroundColor: "#722C43",
    fontFamily: Fonts.medium,
    padding: 8,
  },
});
