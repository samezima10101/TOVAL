import PrimaryButton from "@/components/PrimaryButton";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function TimerModalScreen() {
  const theme = Colors;
  // 仮のロジック～～～～～
  const [hours, setHours] = useState(0);
  const [minutes, setMinutes] = useState(0);
  const incrementHours = () => {
    setHours((prev) => prev + 1);
  };
  const decrementHours = () => {
    setHours((prev) => prev - 1);
  };
  const incrementMinutes = () => {
    setMinutes((prev) => prev + 1);
  };
  const decrementMinutes = () => {
    setMinutes((prev) => prev - 1);
  };
  // ～～～～～～～～～

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <Text style={[styles.title, { color: theme.text }]}>タイマーの設定</Text>

      <View style={styles.pickerContainer}>
        {/* 時間 */}
        <View style={styles.pickerColumn}>
          <TouchableOpacity onPress={incrementHours} style={styles.arrowButton}>
            <Text style={styles.arrowText}>＋</Text>
          </TouchableOpacity>
          <Text style={[styles.numberText, { color: theme.primary }]}>
            {hours}
          </Text>
          <TouchableOpacity onPress={decrementHours} style={styles.arrowButton}>
            <Text style={styles.arrowText}>－</Text>
          </TouchableOpacity>
          <Text style={[styles.unitText, { color: theme.textSub }]}>hour</Text>
        </View>

        <Text style={[styles.colon, { color: theme.text }]}>:</Text>

        {/* 分 */}
        <View style={styles.pickerColumn}>
          <TouchableOpacity
            onPress={incrementMinutes}
            style={styles.arrowButton}
          >
            <Text style={styles.arrowText}>＋</Text>
          </TouchableOpacity>
          <Text style={[styles.numberText, { color: theme.primary }]}>
            {minutes}
          </Text>
          <TouchableOpacity
            onPress={decrementMinutes}
            style={styles.arrowButton}
          >
            <Text style={styles.arrowText}>－</Text>
          </TouchableOpacity>
          <Text style={[styles.unitText, { color: theme.textSub }]}>min</Text>
        </View>
      </View>

      <PrimaryButton
        title="はじめる"
        onPress={() => {
          router.back();
          setTimeout(() => {
            router.push({
              pathname: "/timer",
            });
          }, 150);
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 30,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    marginBottom: 40,
  },
  pickerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 50,
  },
  pickerColumn: {
    alignItems: "center",
    width: 80,
  },
  arrowButton: {
    padding: 10,
  },
  arrowText: {
    fontSize: 24,
    color: "#A0AEC0",
    fontWeight: "bold",
  },
  numberText: {
    fontSize: 48,
    fontWeight: "bold",
    marginVertical: 10,
  },
  unitText: {
    fontSize: 16,
    marginTop: 5,
  },
  colon: {
    fontSize: 40,
    fontWeight: "bold",
    marginHorizontal: 10,
    paddingBottom: 25,
  },
});
