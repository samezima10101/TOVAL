import { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { SettingsCard, SettingsTitle } from "@/src/components/menu/SettingsLayout";
import { Fonts } from "@/src/constants/theme";
import type { AppState } from "@/src/domain/common/types";
import { STORY_CATALOG } from "@/src/domain/storyData";
import { DebugAction, debugStyles } from "./DebugControls";
import { setChoiceProgress, setEpisodeProgress } from "./debugActions";
import NumberSetting from "./NumberSetting";

export default function StoryProgressControls({ state, disabled, onChange }: {
  state: AppState;
  disabled: boolean;
  onChange: (transform: (state: AppState) => AppState, message: string) => void;
}) {
  const episodes = STORY_CATALOG.episodes;
  const lastEpisode = episodes[episodes.length - 1].id;
  const unlockedThrough = Math.max(0, ...state.unlockedStories.map(({ episodeId }) => episodeId));
  const [through, setThrough] = useState(unlockedThrough);
  const [range, setRange] = useState({ from: 1, to: 1 });
  const [count, setCount] = useState(0);
  const start = Math.min(range.from, unlockedThrough);
  const end = Math.max(start, Math.min(range.to, unlockedThrough));
  const selectedEpisodes = episodes.filter(({ id }) => id >= start && id <= end);
  const maxChoices = selectedEpisodes.length ? Math.min(...selectedEpisodes.map((episode) => episode.routes?.length ?? 0)) : 0;
  const allChoiceCounts = Array.from({ length: Math.max(...episodes.map((episode) => episode.routes?.length ?? 0)) + 1 }, (_, index) => index);
  const selectedCount = Math.min(count, maxChoices);
  const storyDisabled = disabled || state.activeTimer !== null;

  return <>
    <SettingsCard>
      <SettingsTitle>解放する話</SettingsTitle>
      <Text style={debugStyles.text}>第1話から指定した話まで解放します。0話は全話未解放です。指定より後の話と選択肢の権利は削除し、新しく解放する話の選択肢は0個になります。</Text>
      <View style={styles.wheelRow}>
        <NumberSetting label="解放する話" value={through} min={0} max={lastEpisode} disabled={storyDisabled} onChange={setThrough} />
        <Text style={styles.unit}>話</Text>
      </View>
      <DebugAction title="決定" disabled={storyDisabled} onPress={() => onChange(
        (current) => setEpisodeProgress(current, through),
        through === 0 ? "全話を未解放に戻しました。" : `第${through}話まで解放しました。`,
      )} />
    </SettingsCard>
    <SettingsCard>
      <SettingsTitle>選択肢の進捗</SettingsTitle>
      <Text style={debugStyles.text}>解放済みの話を範囲指定し、各話の選択肢を0・1・2個に設定します。本文の上から順に解放し、現在の権利を置き換えます。NTは消費・返還しません。</Text>
      {unlockedThrough > 0 ? <>
        <View style={styles.range}>
          <View style={styles.rangeColumn}>
            <NumberSetting label="開始話" value={start} min={1} max={unlockedThrough} disabled={storyDisabled} onChange={(value) => setRange({ from: value, to: Math.max(end, value) })} />
            <Text style={styles.unit}>話から</Text>
          </View>
          <View style={styles.rangeColumn}>
            <NumberSetting label="終了話" value={end} min={1} max={unlockedThrough} disabled={storyDisabled} onChange={(value) => setRange({ from: Math.min(start, value), to: value })} />
            <Text style={styles.unit}>話まで</Text>
          </View>
        </View>
        <Text style={debugStyles.text}>第6話だけを指定すると3個も選べます。条件付きの質問も、ここでは指定数を直接解放します。</Text>
        <View style={styles.counts} accessibilityRole="radiogroup" accessibilityLabel="解放する選択肢の数">
          {allChoiceCounts.map((value) => {
            const countDisabled = storyDisabled || value > maxChoices;
            return <TouchableOpacity key={value} onPress={() => setCount(value)} disabled={countDisabled}
              accessibilityRole="radio" accessibilityLabel={`${value}個`} accessibilityState={{ checked: selectedCount === value, disabled: countDisabled }}
              style={[styles.count, selectedCount === value && styles.selectedCount, countDisabled && styles.disabled]}>
              <Text style={styles.countText}>{value}個</Text>
            </TouchableOpacity>;
          })}
        </View>
        <DebugAction title="決定" disabled={storyDisabled} onPress={() => onChange(
          (current) => setChoiceProgress(current, start, end, selectedCount),
          `第${start}話〜第${end}話の選択肢を${selectedCount}個にしました。`,
        )} />
      </> : <Text style={debugStyles.text}>先にエピソードを解放してください。</Text>}
      <Text style={debugStyles.text}>変更後はメモリー画面で会話を確認できます。</Text>
    </SettingsCard>
    {state.activeTimer ? <Text style={debugStyles.text}>タイマー終了／キャンセル後に変更できます。</Text> : null}
  </>;
}

const styles = StyleSheet.create({
  wheelRow: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 12 },
  range: { flexDirection: "row", flexWrap: "wrap", columnGap: 16, rowGap: 12 },
  rangeColumn: { flexGrow: 1, flexBasis: 112, minWidth: 112, alignItems: "center", gap: 4 },
  unit: { color: "#FFFFFF", fontFamily: Fonts.regular, fontSize: 18, lineHeight: 28, textAlign: "center" },
  counts: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  count: { flexGrow: 1, flexBasis: 64, minWidth: 64, minHeight: 56, paddingHorizontal: 10, paddingVertical: 12, alignItems: "center", justifyContent: "center", borderWidth: 1, borderColor: "#FFFFFF66", borderRadius: 4 },
  selectedCount: { backgroundColor: "#FFFFFF33", borderColor: "#FFFFFF", borderWidth: 2 },
  countText: { color: "#FFFFFF", fontFamily: Fonts.medium, fontSize: 18, lineHeight: 28, textAlign: "center" },
  disabled: { opacity: 0.4 },
});
