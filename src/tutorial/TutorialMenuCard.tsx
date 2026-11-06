import { StyleSheet, Text } from "react-native";

import PrimaryButton from "@/src/components/common/PrimaryButton";
import {
  SettingsCard,
  SettingsTitle,
} from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import { useTutorial } from "./TutorialContext";

export default function TutorialMenuCard() {
  const { replay } = useTutorial();
  return (
    <SettingsCard>
      <SettingsTitle>チュートリアル</SettingsTitle>
      <Text style={styles.text}>
        タイマーの使い方をもう一度練習できます。練習ではNT・記録は増えません。
      </Text>
      <PrimaryButton
        title="もう一度練習する"
        accessibilityLabel="チュートリアルをもう一度行う"
        onPress={replay}
      />
    </SettingsCard>
  );
}

const styles = StyleSheet.create({
  text: { color: "#FFFFFF", fontFamily: Fonts.regular, lineHeight: 22 },
});
