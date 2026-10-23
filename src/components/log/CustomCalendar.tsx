import { Fonts } from "@/src/constants/theme";
import { todayKey } from "@/src/domain/common/date";
import { Image } from "expo-image";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { Calendar, type CalendarProps, type DateData } from "react-native-calendars";
import Svg, { Polyline } from "react-native-svg";

type CustomCalendarProps = {
  selectedDate: string | null;
  recordedDates: ReadonlySet<string>;
  onDayPress: (dayString: string) => void;
};

const WEEKDAYS = ["日", "月", "火", "水", "木", "金", "土"];

function CalendarHeader({
  month,
  addMonth,
}: Pick<CalendarProps, "month" | "addMonth">) {
  return (
    <View>
      <View style={styles.monthNavigation}>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="前の月へ"
          onPress={() => addMonth?.(-1)}
          style={styles.monthArrowButton}
        >
          <Svg width={10} height={22} viewBox="0 0 10 22" accessible={false}>
            <Polyline points="7,3 3,11 7,19" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.monthText} accessibilityRole="header">
          {month?.getFullYear()}年 {month ? month.getMonth() + 1 : ""}月
        </Text>
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="次の月へ"
          onPress={() => addMonth?.(1)}
          style={styles.monthArrowButton}
        >
          <Svg width={10} height={22} viewBox="0 0 10 22" accessible={false}>
            <Polyline points="3,3 7,11 3,19" fill="none" stroke="#FFFFFF" strokeWidth={1.5} />
          </Svg>
        </TouchableOpacity>
      </View>
      <View style={styles.weekdays}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekday} accessibilityLabel={`${day}曜日`}>
            {day}
          </Text>
        ))}
      </View>
    </View>
  );
}

export default function CustomCalendar({
  selectedDate,
  recordedDates,
  onDayPress,
}: CustomCalendarProps) {
  return (
    <Calendar
      current={todayKey()}
      initialDate={selectedDate ?? todayKey()}
      firstDay={0}
      customHeader={CalendarHeader}
      style={styles.calendar}
      theme={{
        calendarBackground: "transparent",
        backgroundColor: "transparent",
        weekVerticalMargin: 2,
      }}
      dayComponent={({ date, state }: { date?: DateData; state?: string }) => {
        if (!date) return null;

        const isSelected = selectedDate === date.dateString;
        const hasRecord = recordedDates.has(date.dateString);

        return (
          <TouchableOpacity
            onPress={() => onDayPress(date.dateString)}
            accessibilityRole="button"
            accessibilityLabel={`${date.year}年${date.month}月${date.day}日${hasRecord ? "、記録あり" : ""}`}
            accessibilityState={{ selected: isSelected }}
            style={styles.dayContainer}
          >
            {hasRecord ? (
              <Image
                source={require("@/assets/images/calendar_star_20.svg")}
                style={styles.star}
                contentFit="contain"
                pointerEvents="none"
                accessible={false}
              />
            ) : null}
            <Text
              style={[
                styles.dayText,
                state === "disabled" && styles.disabledDayText,
                hasRecord && styles.recordedDayText,
              ]}
            >
              {date.day}
            </Text>
          </TouchableOpacity>
        );
      }}
    />
  );
}

const styles = StyleSheet.create({
  calendar: {
    backgroundColor: "transparent",
    paddingHorizontal: 5,
  },
  monthNavigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    alignSelf: "center",
    width: "100%",
    maxWidth: 240,
    minHeight: 44,
  },
  monthText: {
    fontFamily: Fonts.bold,
    fontSize: 21,
    color: "#FFFFFF",
    textAlign: "center",
    flexShrink: 1,
  },
  monthArrowButton: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  weekdays: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 26,
    height: 28,
  },
  weekday: {
    flex: 1,
    fontFamily: Fonts.regular,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    textAlign: "center",
  },
  dayContainer: {
    alignItems: "center",
    height: 44,
    justifyContent: "center",
    width: 44,
  },
  dayText: {
    fontFamily: Fonts.regular,
    color: "#FFFFFF",
    fontSize: 13,
    lineHeight: 20,
  },
  disabledDayText: { color: "rgba(255,255,255,0.48)" },
  recordedDayText: {
    color: "#70747D",
    fontFamily: Fonts.bold,
  },
  star: {
    position: "absolute",
    width: 74,
    height: 79,
  },
});
