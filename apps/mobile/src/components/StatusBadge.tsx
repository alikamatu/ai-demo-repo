/**
 * Colored badge showing run or step state.
 */

import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import type { RunState, StepState } from '../types';
import { colors, fontSizes, borderRadius, spacing } from '../theme';

type BadgeState = RunState | StepState;

const stateColors: Record<string, string> = {
  // Run states
  queued: colors.textMuted,
  planning: colors.info,
  waiting_approval: colors.warning,
  executing: colors.primary,
  completed: colors.success,
  failed: colors.error,
  canceled: colors.textMuted,
  // Step states
  pending: colors.textMuted,
  ready: colors.info,
  running: colors.primary,
  blocked: colors.warning,
  succeeded: colors.success,
  skipped: colors.textSecondary,
};

interface StatusBadgeProps {
  state: BadgeState;
}

export default function StatusBadge({ state }: StatusBadgeProps) {
  const badgeColor = stateColors[state] ?? colors.textMuted;

  return (
    <View style={[styles.badge, { backgroundColor: badgeColor + '22' }]}>
      <View style={[styles.dot, { backgroundColor: badgeColor }]} />
      <Text style={[styles.label, { color: badgeColor }]}>
        {state.replace(/_/g, ' ')}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm + 2,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.full,
    alignSelf: 'flex-start',
  },
  dot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    marginRight: spacing.xs + 2,
  },
  label: {
    fontSize: fontSizes.xs,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
});
