import { todayKey } from "@/src/domain/common/date";
import React from "react";
import { StyleSheet, Text, TouchableOpacity } from "react-native";
import { Calendar, DateData } from "react-native-calendars";

type CustomCalendarProps = {
  selectedDate: string | null;
  recordedDates: ReadonlySet<string>;
  onDayPress: (dayString: string) => void;
};

export default function CustomCalendar({
  selectedDate,
  recordedDates,
  onDayPress,
}: CustomCalendarProps) {
  return (
    <Calendar
      current={todayKey()}
      dayComponent={({ date, state }: { date?: DateData; state?: string }) => {
        if (!date) return null;

        const isSelected = selectedDate === date.dateString;
        const hasRecord = recordedDates.has(date.dateString);

        return (
          <TouchableOpacity
            onPress={() => onDayPress(date.dateString)}
            accessibilityRole="button"
            accessibilityLabel={`${date.dateString}${hasRecord ? "、日記あり" : ""}`}
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
            <Text style={styles.starText}>{hasRecord ? "☆" : " "}</Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  dayContainer: {
    alignItems: "center",
    borderRadius: 8,
    height: 50,
    justifyContent: "center",
    width: 40,
  },
  selectedDayContainer: { backgroundColor: "#00adf5" },
  dayText: { color: "#2d4150", fontSize: 16 },
  disabledDayText: { color: "#d9e1e8" },
  selectedDayText: { color: "#ffffff", fontWeight: "bold" },
  starText: { color: "#ffa500", fontSize: 12, minHeight: 16 },
});
