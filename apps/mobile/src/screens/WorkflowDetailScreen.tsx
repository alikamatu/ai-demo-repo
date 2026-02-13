/**
 * Workflow detail screen — shows run info and its steps.
 */

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRun, useSteps } from '../api/hooks';
import StatusBadge from '../components/StatusBadge';
import LoadingScreen from '../components/LoadingScreen';
import { colors, fontSizes, spacing, borderRadius } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';
import type { WorkflowStep } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkflowDetail'>;

function StepRow({ step }: { step: WorkflowStep }) {
  return (
    <View style={styles.stepRow}>
      <View style={styles.stepInfo}>
        <Text style={styles.stepName}>{step.name}</Text>
        {step.tool && <Text style={styles.stepTool}>{step.tool}</Text>}
        {step.depends_on.length > 0 && (
          <Text style={styles.stepDeps}>Depends on: {step.depends_on.join(', ')}</Text>
        )}
      </View>
      <StatusBadge state={step.state} />
    </View>
  );
}

export default function WorkflowDetailScreen({ route }: Props) {
  const { runId } = route.params;
  const { data: run, isLoading: runLoading } = useRun(runId);
  const { data: steps, isLoading: stepsLoading } = useSteps(runId);

  if (runLoading || stepsLoading) return <LoadingScreen />;

  if (!run) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Workflow run not found.</Text>
      </View>
    );
  }

  const date = new Date(run.created_at).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.container}>
      {/* ── Run header ───────────────────────────── */}
      <View style={styles.header}>
        <Text style={styles.intent}>{run.intent}</Text>
        <StatusBadge state={run.state} />
      </View>
      <View style={styles.metaRow}>
        <Text style={styles.metaText}>Run #{run.id}</Text>
        <Text style={styles.metaText}>{date}</Text>
        {run.risk_level && (
          <Text style={[styles.metaText, { color: colors.warning }]}>
            Risk: {run.risk_level}
          </Text>
        )}
      </View>

      {/* ── Steps section ────────────────────────── */}
      <Text style={styles.sectionTitle}>
        Steps ({steps?.length ?? 0})
      </Text>

      <FlatList
        data={steps}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => <StepRow step={item} />}
        contentContainerStyle={styles.stepsList}
        ListEmptyComponent={
          <Text style={styles.emptySteps}>No steps yet.</Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  intent: {
    flex: 1,
    fontSize: fontSizes.xl,
    fontWeight: '700',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  metaRow: {
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  metaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  sectionTitle: {
    color: colors.textSecondary,
    fontSize: fontSizes.sm,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: spacing.md,
  },
  stepsList: {
    paddingBottom: spacing.xxl,
  },
  stepRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.surface,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  stepInfo: {
    flex: 1,
    marginRight: spacing.sm,
  },
  stepName: {
    fontSize: fontSizes.md,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  stepTool: {
    fontSize: fontSizes.xs,
    color: colors.primaryLight,
    marginTop: 2,
  },
  stepDeps: {
    fontSize: fontSizes.xs,
    color: colors.textMuted,
    marginTop: 2,
  },
  emptySteps: {
    color: colors.textSecondary,
    fontSize: fontSizes.md,
    textAlign: 'center',
    marginTop: spacing.xl,
  },
  errorText: {
    color: colors.error,
    fontSize: fontSizes.lg,
    textAlign: 'center',
    marginTop: spacing.xxl,
  },
});
