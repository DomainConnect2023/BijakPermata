import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, type ViewProps } from 'react-native';

import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { Spacing } from '@/constants/theme';
import { useTheme } from '@/hooks/use-theme';

type ReportScreenProps = ViewProps & {
  title: string;
};

export function ReportScreen({ title, style, children, ...rest }: ReportScreenProps) {
  const theme = useTheme();

  return (
    <ThemedView style={[styles.container, style]} {...rest}>
      <ThemedText type="subtitle" style={styles.title}>
        {title}
      </ThemedText>
      {children ?? (
        <ThemedView type="backgroundElement" style={styles.placeholder}>
          <Ionicons name="construct-outline" size={40} color={theme.textSecondary} />
          <ThemedText type="smallBold" style={styles.placeholderTitle}>
            Coming Soon
          </ThemedText>
          <ThemedText type="small" themeColor="textSecondary" style={styles.placeholderSubtitle}>
            This report is being worked on and will be available in a future update.
          </ThemedText>
        </ThemedView>
      )}
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  title: {
    marginBottom: Spacing.one,
  },
  placeholder: {
    flex: 1,
    borderRadius: Spacing.three,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.four,
    gap: Spacing.two,
  },
  placeholderTitle: {
    marginTop: Spacing.one,
  },
  placeholderSubtitle: {
    textAlign: 'center',
    maxWidth: 260,
  },
});
