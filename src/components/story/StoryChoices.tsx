import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

import { Colors } from "@/src/constants/theme";
import {
  STORY_ROUTE_UNLOCK_COST_NT,
  StoryRoute,
} from "@/src/domain/common/types";

type StoryChoicesProps = {
  routes: readonly StoryRoute[];
  onSelect: (routeId: string) => void;
  lockedRouteIds?: readonly string[];
  disabled?: boolean;
};

export default function StoryChoices({
  routes,
  onSelect,
  lockedRouteIds = [],
  disabled = false,
}: StoryChoicesProps) {
  return (
    <View style={styles.messageBox} accessibilityRole="radiogroup">
      <Text style={styles.prompt}>返信を選ぶ</Text>
      {routes.map((route) => {
        const isLocked = lockedRouteIds.includes(route.id);
        return (
          <TouchableOpacity
            key={route.id}
            style={[
              styles.choice,
              isLocked && styles.lockedChoice,
              disabled && styles.choiceDisabled,
            ]}
            onPress={() => onSelect(route.id)}
            disabled={disabled}
            accessibilityRole="button"
            accessibilityLabel={
              isLocked
                ? `${route.label}、鍵付き、${STORY_ROUTE_UNLOCK_COST_NT} NTで解放`
                : route.label
            }
            accessibilityState={{ disabled }}
          >
            <Text style={[styles.choiceText, isLocked && styles.lockedText]}>
              {route.label}
            </Text>
            {isLocked ? (
              <Text style={styles.cost}>🔒 {STORY_ROUTE_UNLOCK_COST_NT} NT</Text>
            ) : null}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  messageBox: {
    backgroundColor: Colors.surface,
    borderColor: Colors.border,
    borderRadius: 16,
    borderWidth: 2,
    elevation: 4,
    margin: 18,
    minHeight: 190,
    padding: 18,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  prompt: {
    color: Colors.primary,
    fontSize: 15,
    fontWeight: "800",
    marginBottom: 6,
  },
  choice: {
    alignItems: "center",
    backgroundColor: Colors.primary,
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
    flex: 1,
    fontSize: 15,
    fontWeight: "700",
  },
  lockedText: {
    color: Colors.textSub,
  },
  cost: {
    color: Colors.textSub,
    fontSize: 12,
    fontWeight: "800",
    marginLeft: 8,
  },
});
