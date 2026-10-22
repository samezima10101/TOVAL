import CustomCalendar from "@/src/components/log/CustomCalendar";
import LogModal from "@/src/components/log/LogModal";
import { DiaryLog } from "@/src/domain/common/types";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import { useAppState } from "@/src/state/AppStateProvider";
import { useMemo, useState } from "react";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { ScrollView, StyleSheet, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export default function CalendarScreen() {
  const { top } = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { state, updateDiary } = useAppState();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const logsByDate = useMemo(
    () =>
      (state?.diaryLogs ?? []).reduce<Record<string, DiaryLog[]>>(
        (groups, log) => {
          (groups[log.logDate] ??= []).push(log);
          return groups;
        },
        {},
      ),
    [state?.diaryLogs],
  );
  const recordedDates = useMemo(
    () => new Set(Object.keys(logsByDate)),
    [logsByDate],
  );

  const handleDayPress = (dayString: string) => {
    setSelectedDate(dayString);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <ScreenBackground source={require("@/assets/bg/primary-bg.png")} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + 76 + 16, paddingBottom: tabBarHeight + 16 },
        ]}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: top + 76, bottom: tabBarHeight }}
      >
        <CustomCalendar
          selectedDate={selectedDate}
          recordedDates={recordedDates}
          onDayPress={handleDayPress}
        />
      </ScrollView>
      {modalVisible ? (
        <LogModal
          key={selectedDate}
          visible={modalVisible}
          selectedDate={selectedDate}
          logsByDate={logsByDate}
          onClose={() => setModalVisible(false)}
          onChangeDate={setSelectedDate}
          onSaveDiary={updateDiary}
        />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flexGrow: 1, paddingHorizontal: 16 },
});
