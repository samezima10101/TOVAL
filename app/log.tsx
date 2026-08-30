import BackButton from "@/src/components/common/BackButton";
import CustomCalendar from "@/src/components/log/CustomCalendar";
import LogModal from "@/src/components/log/LogModal";
import { Colors } from "@/src/constants/theme";
import { useState } from "react";
import { StyleSheet, View } from "react-native";

export default function CalendarScreen() {
  const mockLoginData: Record<
    string,
    { storyTitle: string; totalTimerMinutes: number; taskMemo: string }
  > = {
    "2026-08-12": {
      storyTitle: "タスク完了！",
      totalTimerMinutes: 45,
      taskMemo: "P.8 ~ P.12",
    },
    "2026-08-19": {
      storyTitle: "上司からの労い",
      totalTimerMinutes: 120,
      taskMemo: "P.13 ~ P.20 今日は調子よかった。嘘。眠い。疲れた。しんどい。",
    },
    "2026-08-25": {
      storyTitle: "部下の決意",
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
      <BackButton />
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
    backgroundColor: Colors.background,
  },
});
