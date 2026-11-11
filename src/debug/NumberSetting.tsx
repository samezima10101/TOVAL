import { Picker } from "@react-native-picker/picker";
import { Platform, StyleSheet, View } from "react-native";

const SELECTION_HEIGHT = 56;
const NATIVE_WHEEL_HEIGHT = 216;

export default function NumberSetting({ label, value, min, max, disabled, onChange }: {
  label: string;
  value: number;
  min: number;
  max: number;
  disabled: boolean;
  onChange: (value: number) => void;
}) {
  return <View pointerEvents={disabled ? "none" : "auto"} style={[styles.container, disabled && styles.disabled]}>
    <Picker selectedValue={value} onValueChange={(next: number) => { if (!disabled) onChange(next); }}
      enabled={!disabled} accessibilityLabel={label} accessibilityState={{ disabled }}
      style={[styles.picker, Platform.OS === "ios" && styles.iosWheel]} itemStyle={styles.item}>
      {Array.from({ length: max - min + 1 }, (_, index) => min + index).map((number) =>
        <Picker.Item key={number} label={String(number)} value={number} color="#FFFFFF" />)}
    </Picker>
  </View>;
}

const styles = StyleSheet.create({
  // Keep the native wheel centered at its standard height, but expose only
  // its selected row. The 112-point width leaves room for iOS label insets.
  container: { width: 112, height: SELECTION_HEIGHT, alignSelf: "center", overflow: "hidden" },
  picker: { width: 112, height: SELECTION_HEIGHT },
  iosWheel: { position: "absolute", top: (SELECTION_HEIGHT - NATIVE_WHEEL_HEIGHT) / 2, height: NATIVE_WHEEL_HEIGHT },
  item: { height: NATIVE_WHEEL_HEIGHT, color: "#FFFFFF", fontSize: 28 },
  disabled: { opacity: 0.4 },
});
