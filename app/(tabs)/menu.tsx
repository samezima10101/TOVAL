import { router } from "expo-router";
import { useBottomTabBarHeight } from "expo-router/js-tabs";
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import ScreenBackground from "@/src/components/common/ScreenBackground";
import BgmToggle from "@/src/components/home/BgmToggle";
import TaskNameModal from "@/src/components/home/TaskNameModal";
import { Colors, Fonts } from "@/src/constants/theme";
import { useAppState } from "@/src/state/AppStateProvider";

export default function MenuScreen() {
  const { top } = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const { state, setTaskName } = useAppState();
  const [isEditingTask, setIsEditingTask] = useState(false);

  if (!state) return null;

  return (
    <View style={{ flex: 1 }}>
      <ScreenBackground source={require("@/assets/bg/primary-bg.png")} />
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: top + 76 + 20, paddingBottom: tabBarHeight + 20 },
        ]}
        contentInsetAdjustmentBehavior="never"
        scrollIndicatorInsets={{ top: top + 76, bottom: tabBarHeight }}
      >
        <Text style={styles.title} accessibilityRole="header">
          メニュー
        </Text>
        <PrimaryButton
          title="ショップ"
          onPress={() => router.navigate("/shop")}
        />
        <View style={[styles.panel, styles.taskPanel]}>
          <Text style={styles.label}>集中するタスク</Text>
          <Text style={styles.taskName}>{state.taskName || "未設定"}</Text>
          <PrimaryButton
            title="タスク名を編集"
            onPress={() => setIsEditingTask(true)}
          />
        </View>
        <View style={styles.panel}>
          <BgmToggle />
        </View>
        <TaskNameModal
          visible={isEditingTask}
          initialValue={state.taskName}
          onClose={() => setIsEditingTask(false)}
          onSave={async (taskName) => {
            await setTaskName(taskName);
            setIsEditingTask(false);
          }}
        />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 24 },
  title: { color: "#FFFFFF", fontFamily: Fonts.bold, fontSize: 24 },
  label: { color: Colors.textSub, fontFamily: Fonts.regular, fontSize: 14 },
  taskName: { color: Colors.text, fontFamily: Fonts.medium, fontSize: 20 },
  taskPanel: { paddingTop: 20, gap: 12 },
  panel: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 2,
    paddingBottom: 20,
  },
});
