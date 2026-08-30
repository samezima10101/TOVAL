import { todayKey } from "@/src/domain/common/date";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

type LoginRecord = {
  storyTitle: string;
  totalTimerMinutes: number;
  taskMemo: string;
};

type CustomCalendarProps = {
  selectedDate: string | null;
  loginData: Record<string, LoginRecord>;
  onDayPress: (dayString: string) => void;
};

export default function CustomCalendar({
  selectedDate,
  loginData,
  onDayPress,
}: CustomCalendarProps) {
  return (
    <Calendar
      current={todayKey()}
      dayComponent={({ date, state }: { date?: DateData; state?: string }) => {
        if (!date) return null;

        const isSelected = selectedDate === date.dateString;
        const hasLogin = !!loginData[date.dateString];

        return (
          <TouchableOpacity
            onPress={() => onDayPress(date.dateString)}
            style={[
              styles.dayContainer,
              isSelected && styles.selectedDayContainer,
            ]}
          >
            <Text
              style={[
                styles.dayText,
                state === "disabled" && styles.disabledDayText,
                isSelected && styles.selectedDayText,
              ]}
            >
              {date.day}
            </Text>
            {/* ログインした日には☆を表示 */}
            <Text style={styles.starText}>{hasLogin ? "☆" : " "}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 50,
    borderRadius: 8,
  },
  selectedDayContainer: {
    backgroundColor: "#00adf5",
  },
  dayText: {
    fontSize: 16,
    color: "#2d4150",
  },
  disabledDayText: {
    color: "#d9e1e8",
  },
  selectedDayText: {
    color: "#ffffff",
    fontWeight: "bold",
  },
  starText: {
    fontSize: 12,
    color: "#ffa500",
    marginTop: 2,
    minHeight: 16,
  },
});
