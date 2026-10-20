import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import BgmToggle from "@/src/components/home/BgmToggle";
import TaskNameModal from "@/src/components/home/TaskNameModal";
import { Colors, Fonts } from "@/src/constants/theme";
import { closeMenu } from "@/src/navigation/menu";
import { useAppState } from "@/src/state/AppStateProvider";

export default function MenuScreen() {
  const { state, setTaskName } = useAppState();
  const [isEditingTask, setIsEditingTask] = useState(false);

  if (!state) return null;

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Text style={styles.title} accessibilityRole="header">メニュー</Text>
      <View style={[styles.panel, styles.taskPanel]}>
        <Text style={styles.label}>集中するタスク</Text>
        <Text style={styles.taskName}>{state.taskName || "未設定"}</Text>
        <PrimaryButton title="タスク名を編集" onPress={() => setIsEditingTask(true)} />
      </View>
      <View style={styles.panel}>
        <BgmToggle />
      </View>
      <PrimaryButton title="戻る" onPress={closeMenu} />
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
