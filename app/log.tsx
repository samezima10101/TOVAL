import React, { useMemo, useState } from "react";
import { StyleSheet, View } from "react-native";

import BackButton from "@/src/components/common/BackButton";
import CustomCalendar from "@/src/components/log/CustomCalendar";
import LogModal from "@/src/components/log/LogModal";
import { Colors } from "@/src/constants/theme";
import { localDateKey } from "@/src/domain/common/date";
import { DiaryLog } from "@/src/domain/common/types";
import { useAppState } from "@/src/state/AppStateProvider";

export default function CalendarScreen() {
  const { state } = useAppState();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const logsByDate = useMemo(
    () =>
      (state?.diaryLogs ?? []).reduce<Record<string, DiaryLog[]>>((groups, log) => {
        const date = localDateKey(log.completedAt);
        (groups[date] ??= []).push(log);
        return groups;
      }, {}),
    [state?.diaryLogs],
  );
  const recordedDates = useMemo(() => new Set(Object.keys(logsByDate)), [logsByDate]);

  const handleDayPress = (dayString: string) => {
    setSelectedDate(dayString);
    setModalVisible(true);
  };

  return (
    <View style={styles.container}>
      <BackButton />
      <CustomCalendar
        selectedDate={selectedDate}
        recordedDates={recordedDates}
        onDayPress={handleDayPress}
      />
      <LogModal
        visible={modalVisible}
        selectedDate={selectedDate}
        logsByDate={logsByDate}
        onClose={() => setModalVisible(false)}
        onChangeDate={setSelectedDate}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { backgroundColor: Colors.background, flex: 1, padding: 16 },
});
