import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors, Fonts } from "@/src/constants/theme";
import { StoryChoice } from "@/src/domain/common/types";

type StoryChoicesProps = {
  priceNt: number;
  routes: readonly StoryChoice[];
  onSelect: (routeId: string) => void;
  lockedRouteIds?: readonly string[];
  unmetRequirements?: Readonly<Record<string, string>>;
  disabled?: boolean;
};

export default function StoryChoices({
  priceNt,
  routes,
  onSelect,
  lockedRouteIds = [],
  unmetRequirements = {},
  disabled = false,
}: StoryChoicesProps) {
  return (
    <View style={styles.messageBox} accessibilityRole="radiogroup">
      {routes.map((route) => {
        const isLocked = lockedRouteIds.includes(route.id);
        const requirement = unmetRequirements[route.id];
        const isDisabled = disabled || Boolean(requirement);
        return (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.choice,
              (isLocked || requirement) && styles.lockedChoice,
              isDisabled && styles.choiceDisabled,
            ]}
            onPress={() => onSelect(route.id)}
            disabled={isDisabled}
            accessibilityRole="button"
            accessibilityLabel={
              requirement
                ? `${route.label}、解放条件: ${requirement}`
                : isLocked
                ? `${route.label}、鍵付き、${priceNt} NTで解放`
                : route.label
            }
            accessibilityState={{ disabled: isDisabled }}
          >
            <View style={styles.label}>
              <Text style={[styles.choiceText, (isLocked || requirement) && styles.lockedText]}>
                {route.label}
              </Text>
              {requirement ? <Text style={styles.requirement}>解放条件: {requirement}</Text> : null}
            </View>
            {!requirement && isLocked ? <Text style={styles.cost}>🔒 {priceNt} NT</Text> : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  label: { flex: 1 },
  requirement: { color: Colors.textSub, fontFamily: Fonts.regular, fontSize: 12, lineHeight: 18, marginTop: 4 },
  messageBox: { flexGrow: 1 },
  prompt: {
    color: Colors.text,
    fontSize: 15,
    fontFamily: Fonts.bold,
    marginBottom: 6,
  },
  choice: {
    alignItems: "center",
    backgroundColor: Colors.text,
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 9,
    minHeight: 52,
    paddingHorizontal: 15,
    paddingVertical: 10,
  },
  lockedChoice: {
    backgroundColor: "#E5E8EC",
    borderColor: Colors.border,
    borderWidth: 1,
  },
  choiceDisabled: {
    opacity: 0.6,
  },
  choiceText: {
    color: Colors.surface,
    fontSize: 15,
    fontFamily: Fonts.bold,
  },
  lockedText: {
    color: Colors.textSub,
  },
  cost: {
    color: Colors.textSub,
    fontSize: 12,
    fontFamily: Fonts.bold,
    marginLeft: 8,
  },
});
