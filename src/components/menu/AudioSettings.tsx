import Slider from "@react-native-community/slider";
import { useFocusEffect } from "expo-router";
import { useCallback, useRef, useState } from "react";
import { AppState as NativeAppState, StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import { SettingsCard, SettingsRow } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";

type VolumeSettingProps = {
  title: string;
  volume: number;
  onPreview: (volume: number | null) => void;
  onSave: (volume: number) => Promise<void>;
};

function VolumeSetting({ title, volume, onPreview, onSave }: VolumeSettingProps) {
  const busy = useRef(false);
  const dragging = useRef(false);
  const focused = useRef(false);
  const [saving, setSaving] = useState(false);
  const [failedValue, setFailedValue] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    focused.current = true;
    return () => {
      focused.current = false;
      dragging.current = false;
      onPreview(null);
    };
  }, [onPreview]));

  const save = async (nextVolume: number) => {
    if (busy.current || !focused.current || NativeAppState.currentState !== "active") return;
    busy.current = true;
    setSaving(true);
    setFailedValue(null);
    onPreview(nextVolume);
    try {
      await onSave(nextVolume);
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
      <SettingsRow title={title}>
        <Text style={styles.value}>{Math.round(volume * 100)}%</Text>
      </SettingsRow>
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

export default function AudioSettings() {
  const {
    bgmVolume,
    previewBgmVolume,
    setBgmVolume,
    seVolume,
    previewSeVolume,
    setSeVolume,
  } = useAppState();

  return (
    <>
      <SettingsCard>
        <VolumeSetting
          title="BGM音量"
          volume={bgmVolume}
          onPreview={previewBgmVolume}
          onSave={setBgmVolume}
        />
      </SettingsCard>
      <SettingsCard>
        <VolumeSetting
          title="効果音音量"
          volume={seVolume}
          onPreview={previewSeVolume}
          onSave={setSeVolume}
        />
      </SettingsCard>
    </>
  );
}

const styles = StyleSheet.create({
  value: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18 },
  status: { color: "#E0E3EE", fontFamily: Fonts.regular, fontSize: 12 },
  error: { color: "#FFE0E7", fontFamily: Fonts.regular, fontSize: 13 },
  volumeContainer: { gap: 8 },
  volumeSlider: { width: "100%", height: 44 },
});
