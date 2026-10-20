import React, { useMemo, useState } from "react";
import { StyleSheet } from "react-native";

import ScreenBackground from "@/src/components/common/ScreenBackground";
import StoryListHeader from "@/src/components/common/StoryListHeader";
import CustomCalendar from "@/src/components/log/CustomCalendar";
import LogModal from "@/src/components/log/LogModal";
import { DiaryLog } from "@/src/domain/common/types";
import { useAppState } from "@/src/state/AppStateProvider";

export default function CalendarScreen() {
  const { state, updateDiary } = useAppState();
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [modalVisible, setModalVisible] = useState(false);
  const logsByDate = useMemo(
    () =>
      (state?.diaryLogs ?? []).reduce<Record<string, DiaryLog[]>>((groups, log) => {
        (groups[log.logDate] ??= []).push(log);
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
    <ScreenBackground style={styles.container}>
      <StoryListHeader title="ログ" />
      <CustomCalendar
        selectedDate={selectedDate}
        recordedDates={recordedDates}
        onDayPress={handleDayPress}
      />
      {modalVisible ? <LogModal
        key={selectedDate}
        visible={modalVisible}
        selectedDate={selectedDate}
        logsByDate={logsByDate}
        onClose={() => setModalVisible(false)}
        onChangeDate={setSelectedDate}
        onSaveDiary={updateDiary}
      /> : null}
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
});
