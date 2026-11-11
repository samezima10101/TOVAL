import Slider from "@react-native-community/slider";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState as NativeAppState, Pressable, StyleSheet, Text, View } from "react-native";
import Svg, { Path } from "react-native-svg";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { DEFAULT_BGM_VOLUME, DEFAULT_SE_VOLUME } from "@/src/config/audioSettings";
import { Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";

type VolumeSettingProps = {
  active: boolean;
  title: string;
  volume: number;
  onPreview: (volume: number | null) => void;
  onSave: (volume: number) => Promise<void>;
  defaultVolume: number;
};

function VolumeSetting({ active, title, volume, onPreview, onSave, defaultVolume }: VolumeSettingProps) {
  const lastAudibleVolumeRef = useRef(volume > 0 ? volume : defaultVolume);
  const busy = useRef(false);
  const dragging = useRef(false);
  const focused = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failedValue, setFailedValue] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    focused.current = active;
    return () => {
      focused.current = false;
      dragging.current = false;
      onPreview(null);
    };
  }, [active, onPreview]));

  const save = async (nextVolume: number) => {
    if (busy.current || !focused.current || NativeAppState.currentState !== "active") return;
    busy.current = true;
    setSaving(true);
    setFailedValue(null);
    onPreview(nextVolume);
    try {
      await onSave(nextVolume);
      if (nextVolume > 0) lastAudibleVolumeRef.current = nextVolume;
    } catch {
      setFailedValue(nextVolume);
    } finally {
      onPreview(null);
      busy.current = false;
      setSaving(false);
    }
  };

  return (
    <View style={styles.volumeContainer}>
      <View style={styles.labelRow}>
        <Text style={styles.label}>{title}</Text>
        <Text style={styles.value}>{Math.round(volume * 100)}%</Text>
      </View>
      <View style={styles.controls}>
        <Slider
          style={styles.volumeSlider}
          value={Math.round(volume * 100)}
          minimumValue={0}
          maximumValue={100}
          step={1}
          minimumTrackTintColor="#FFFFFF"
          maximumTrackTintColor="rgba(255,255,255,0.3)"
          disabled={saving}
          onSlidingStart={() => {
            if (busy.current || !focused.current || NativeAppState.currentState !== "active") return;
            dragging.current = true;
          }}
          onValueChange={(percent) => {
            if (busy.current || !focused.current || NativeAppState.currentState !== "active") return;
            const nextVolume = Math.round(percent) / 100;
            if (dragging.current) onPreview(nextVolume);
            else void save(nextVolume); // VoiceOver changes do not emit touch-end.
          }}
          onSlidingComplete={(percent) => {
            const wasDragging = dragging.current;
            dragging.current = false;
            if (wasDragging) void save(Math.round(percent) / 100);
          }}
          accessibilityLabel={title}
          accessibilityHint="0%で消音になります"
          accessibilityValue={{
            min: 0,
            max: 100,
            now: Math.round(volume * 100),
            text: `${Math.round(volume * 100)}%`,
          }}
        />
        <Pressable
          style={({ pressed }) => [styles.muteButton, volume === 0 && styles.muted, (pressed || saving) && styles.dimmed]}
          disabled={saving}
          onPress={() => {
            if (volume > 0) lastAudibleVolumeRef.current = volume;
            void save(volume === 0 ? lastAudibleVolumeRef.current : 0);
          }}
          accessibilityRole="button"
          accessibilityLabel={`${title}の${volume === 0 ? "ミュートを解除" : "ミュート"}`}
          accessibilityState={{ disabled: saving, selected: volume === 0 }}
        >
          <Svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth={1.7} strokeLinecap="round" strokeLinejoin="round" accessible={false}>
            <Path d="M11 4 6 8H3v8h3l5 4V4Z" />
            <Path d={volume === 0 ? "m16 9 6 6m0-6-6 6" : "M15 8a6 6 0 0 1 0 8m3-11a10 10 0 0 1 0 14"} />
          </Svg>
          <Text style={styles.muteLabel}>{volume === 0 ? "解除" : "消音"}</Text>
        </Pressable>
      </View>
      {saving ? <Text style={styles.status}>保存中…</Text> : null}
      {failedValue !== null ? (
        <View accessibilityRole="alert">
          <Text style={styles.error}>
            {title}を保存できませんでした。保存済みの音量に戻しました。
          </Text>
          <PrimaryButton
            title={`${title}の保存を再試行`}
            onPress={() => {
              void save(failedValue);
            }}
            disabled={saving}
          />
        </View>
      ) : null}
    </View>
  );
}

export default function AudioSettings({ active }: {
  active: boolean;
}) {
  const {
    bgmVolume,
    previewBgmVolume,
    setBgmVolume,
    seVolume,
    previewSeVolume,
    setSeVolume,
  } = useAppState();

  return (
    <View style={styles.settings}>
      <VolumeSetting
        active={active}
        title="BGM音量"
        volume={bgmVolume}
        onPreview={previewBgmVolume}
        onSave={setBgmVolume}
        defaultVolume={DEFAULT_BGM_VOLUME}
      />
      <VolumeSetting
        active={active}
        title="効果音音量"
        volume={seVolume}
        onPreview={previewSeVolume}
        onSave={setSeVolume}
        defaultVolume={DEFAULT_SE_VOLUME}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  settings: { gap: 16 },
  labelRow: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 8 },
  label: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 15, flexShrink: 1 },
  value: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 14 },
  status: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 12 },
  error: { color: "#FFE0E7", fontFamily: Fonts.regular, fontSize: 13 },
  volumeContainer: { gap: 4 },
  controls: { flexDirection: "row", alignItems: "center", gap: 10 },
  volumeSlider: { flex: 1, minWidth: 0, height: 44 },
  muteButton: { minWidth: 44, minHeight: 48, alignItems: "center", justifyContent: "center", padding: 4, borderRadius: 6, borderWidth: 1, borderColor: "rgba(255,255,255,0.4)", gap: 1 },
  muted: { backgroundColor: "rgba(90,148,220,0.5)", borderColor: "#FFFFFF" },
  dimmed: { opacity: 0.5 },
  muteLabel: { color: "#FFFFFF", fontFamily: Fonts.regular, fontSize: 10 },
});
