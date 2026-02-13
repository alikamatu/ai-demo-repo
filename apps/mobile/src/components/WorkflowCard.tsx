/**
 * Workflow run card for list display.
 */

import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { WorkflowRun } from '../types';
import StatusBadge from './StatusBadge';
import { colors, fontSizes, spacing, borderRadius } from '../theme';

interface WorkflowCardProps {
  run: WorkflowRun;
  onPress: () => void;
}

export default function WorkflowCard({ run, onPress }: WorkflowCardProps) {
  const date = new Date(run.created_at).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <View style={styles.header}>
        <Text style={styles.intent} numberOfLines={1}>
          {run.intent}
        </Text>
        <StatusBadge state={run.state} />
      </View>
      <View style={styles.meta}>
        <Text style={styles.metaText}>#{run.id}</Text>
        <Text style={styles.metaText}>{date}</Text>
        {run.risk_level && (
          <Text style={[styles.metaText, styles.risk]}>
            Risk: {run.risk_level}
          </Text>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: borderRadius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardPressed: {
    opacity: 0.85,
    transform: [{ scale: 0.98 }],
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  intent: {
    flex: 1,
    fontSize: fontSizes.lg,
    fontWeight: '600',
    color: colors.textPrimary,
    marginRight: spacing.sm,
  },
  meta: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  metaText: {
    fontSize: fontSizes.xs,
    color: colors.textSecondary,
  },
  risk: {
    color: colors.warning,
  },
});
