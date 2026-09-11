import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { Pressable, StyleSheet, Text, View } from "react-native";

import { Spacing } from "@/constants/theme";

// Deliberately not BRAND_COLOR (#208AEF) — that blue is already used
// everywhere for filters/active states, so this switch would read as "just
// another filter". Indigo (already used for the currency badges) plus a
// shadowed card look signal "this navigates to a different report" instead.
const ACTIVE_COLOR = "#6366F1";
const INACTIVE_ICON_COLOR = "#9CA3AF";
const INACTIVE_TEXT_COLOR = "#6B7280";

export type ReportSwitchOption = {
  label: string;
  route: string;
  icon: React.ComponentProps<typeof Ionicons>["name"];
};

type Props = {
  label?: string;
  options: ReportSwitchOption[];
  activeIndex: number;
};

// Compact switcher used in place of a native tab bar to move between
// sibling reports within one section (e.g. Purchase Detail Report <-> Buy
// Cancel). Styled as shadowed nav cards (not the flat bordered look used by
// filter chips elsewhere) so it reads as navigation, not another filter.
export function ReportSectionSwitcher({ label, options, activeIndex }: Props) {
  const router = useRouter();

  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View style={styles.row}>
        {options.map((option, index) => {
          const active = index === activeIndex;
          return (
            <Pressable
              key={option.route}
              onPress={() => {
                if (!active) router.replace(option.route as never);
              }}
              style={({ pressed }) => [
                styles.card,
                active ? styles.cardActive : styles.cardInactive,
                pressed && !active && styles.cardPressed,
              ]}
            >
              <Ionicons
                name={option.icon}
                size={16}
                color={active ? "#FFFFFF" : INACTIVE_ICON_COLOR}
              />
              <Text
                style={[
                  styles.optionText,
                  active ? styles.optionTextActive : styles.optionTextInactive,
                ]}
                numberOfLines={1}
              >
                {option.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    gap: Spacing.two,
  },
  label: {
    fontSize: 11,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.3,
  },
  row: {
    flexDirection: "row",
    gap: Spacing.two,
  },
  card: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingVertical: 10,
    borderRadius: 14,
  },
  cardActive: {
    backgroundColor: ACTIVE_COLOR,
    shadowColor: ACTIVE_COLOR,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 3,
  },
  cardInactive: {
    backgroundColor: "#FFFFFF",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 1,
  },
  cardPressed: {
    opacity: 0.8,
  },
  optionText: {
    fontSize: 12,
    fontWeight: "600",
    textAlign: "center",
  },
  optionTextActive: {
    color: "#FFFFFF",
  },
  optionTextInactive: {
    color: INACTIVE_TEXT_COLOR,
  },
});
