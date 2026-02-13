/**
 * Home screen — API health status + quick stats.
 */

import React, { useEffect } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { useHealth, useRuns } from '../api/hooks';
import useAppStore from '../store/useAppStore';
import LoadingScreen from '../components/LoadingScreen';
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

export default function HomeScreen({ navigation }: Props) {
  const { data: health, isLoading: healthLoading, error: healthError } = useHealth();
  const { data: runs } = useRuns();
  const setConnected = useAppStore((s) => s.setConnected);

  useEffect(() => {
    setConnected(!!health && !healthError);
  }, [health, healthError, setConnected]);

  if (healthLoading) return <LoadingScreen />;

  const totalRuns = runs?.length ?? 0;
  const activeRuns = runs?.filter((r) => r.state === 'executing').length ?? 0;
  const completedRuns = runs?.filter((r) => r.state === 'completed').length ?? 0;

  return (
    <View style={styles.container}>
      {/* ── Status banner ────────────────────────── */}
      <View style={[styles.banner, healthError ? styles.bannerError : styles.bannerOk]}>
        <View style={[styles.statusDot, { backgroundColor: healthError ? colors.error : colors.success }]} />
        <Text style={styles.bannerText}>
          {healthError ? 'API Unreachable' : 'API Connected'}
        </Text>
      </View>

      {/* ── Stats cards ──────────────────────────── */}
      <Text style={styles.sectionTitle}>Dashboard</Text>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, { borderColor: colors.primary }]}>
          <Text style={styles.statNumber}>{totalRuns}</Text>
          <Text style={styles.statLabel}>Total Runs</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.info }]}>
          <Text style={[styles.statNumber, { color: colors.info }]}>{activeRuns}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
        <View style={[styles.statCard, { borderColor: colors.success }]}>
          <Text style={[styles.statNumber, { color: colors.success }]}>{completedRuns}</Text>
          <Text style={styles.statLabel}>Done</Text>
        </View>
      </View>

      {/* ── Quick actions ────────────────────────── */}
      <Pressable
        style={({ pressed }) => [styles.button, pressed && styles.buttonPressed]}
        onPress={() => navigation.navigate('WorkflowList')}
      >
        <Text style={styles.buttonText}>View All Workflows</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    paddingTop: spacing.xl,
  },
  banner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.lg,
  },
  bannerOk: {
    backgroundColor: colors.success + '15',
    borderWidth: 1,
    borderColor: colors.success + '30',
  },
  bannerError: {
    backgroundColor: colors.error + '15',
    borderWidth: 1,
    borderColor: colors.error + '30',
  },
  statusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    marginRight: spacing.sm,
  },
  bannerText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '600',
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    alignItems: 'center',
    borderWidth: 1,
  },
  statNumber: {
    fontSize: fontSizes.xxl,
    fontWeight: '700',
    color: colors.primary,
    marginBottom: spacing.xs,
  },
  statLabel: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  button: {
    backgroundColor: colors.primary,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  buttonPressed: {
    opacity: 0.85,
  },
  buttonText: {
    color: colors.textPrimary,
    fontSize: fontSizes.md,
    fontWeight: '700',
  },
});
