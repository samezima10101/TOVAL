import CustomCalendar from "@/components/log/CustomCalendar";
import LogModal from "@/components/log/LogModal";
import { Colors } from "@/constants/theme";
import { router } from "expo-router";
import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function CalendarScreen() {
  const mockLoginData: Record<
    string,
    { storyTitle: string; totalTimerMinutes: number; taskMemo: string }
  > = {
    "2026-08-12": {
      storyTitle: "ファースト・コンタクト",
      totalTimerMinutes: 45,
      taskMemo: "P.8 ~ P.12",
    },
    "2026-08-19": {
      storyTitle: "遥か彼方のラサイル星",
      totalTimerMinutes: 120,
      taskMemo: "P.13 ~ P.20 今日は調子よかった。嘘。眠い。疲れた。しんどい。",
    },
    "2026-08-25": {
      storyTitle: "「３日坊主」って誰？",
      totalTimerMinutes: 30,
      taskMemo: "P.21 ~ P.25",
    },
  };
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);

  const handleDayPress = (dayString: string) => {
    setSelectedDate(dayString);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        onPress={() => router.dismissTo("/")}
        style={styles.backButton}
        accessibilityRole="button"
        accessibilityLabel="ホームへ戻る"
      >
        <Text style={styles.backText}>＜ ホーム</Text>
      </TouchableOpacity>
      <CustomCalendar
        selectedDate={selectedDate}
        loginData={mockLoginData}
        onDayPress={handleDayPress}
      />
      <LogModal
        visible={modalVisible}
        selectedDate={selectedDate}
        loginData={mockLoginData}
        onClose={() => setModalVisible(false)}
        onChangeDate={setSelectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: "#fff",
  },
  backButton: {
    paddingRight: 10,
    paddingVertical: 8,
  },
  backText: {
    color: Colors.textSub,
    fontSize: 15,
    fontWeight: "700",
  },
});
