import { StyleSheet, Text, TextInput, View } from "react-native";

import { Spacing } from "@/constants/theme";

type AmountRangeInputsProps = {
  lowText: string;
  highText: string;
  onLowChange: (text: string) => void;
  onHighChange: (text: string) => void;
  activeColor?: string;
};

export function AmountRangeInputs({
  lowText,
  highText,
  onLowChange,
  onHighChange,
  activeColor = "#208AEF",
}: AmountRangeInputsProps) {
  return (
    <View style={styles.row}>
      <View style={styles.field}>
        <Text style={styles.label}>Min RM</Text>
        <TextInput
          value={lowText}
          onChangeText={onLowChange}
          placeholder="0"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          style={[styles.input, { borderColor: `${activeColor}40` }]}
        />
      </View>
      <Text style={styles.separator}>–</Text>
      <View style={styles.field}>
        <Text style={styles.label}>Max RM</Text>
        <TextInput
          value={highText}
          onChangeText={onHighChange}
          placeholder="No limit"
          placeholderTextColor="#9CA3AF"
          keyboardType="numeric"
          style={[styles.input, { borderColor: `${activeColor}40` }]}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: Spacing.two,
  },
  field: {
    flex: 1,
    gap: 4,
  },
  label: {
    fontSize: 10,
    fontWeight: "500",
    color: "#9CA3AF",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: "#F9FAFB",
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 12,
    borderWidth: 1,
    fontSize: 14,
    fontWeight: "600",
    color: "#111827",
  },
  separator: {
    fontSize: 14,
    color: "#9CA3AF",
    paddingBottom: Spacing.two + 4,
  },
});
