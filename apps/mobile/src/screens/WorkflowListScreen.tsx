/**
 * Workflow list screen — displays all workflow runs.
 */

import React from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';
import { useRuns } from '../api/hooks';
import WorkflowCard from '../components/WorkflowCard';
import LoadingScreen from '../components/LoadingScreen';
import { colors, fontSizes, spacing } from '../theme';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/AppNavigator';

type Props = NativeStackScreenProps<RootStackParamList, 'WorkflowList'>;

export default function WorkflowListScreen({ navigation }: Props) {
  const { data: runs, isLoading, refetch } = useRuns();

  if (isLoading) return <LoadingScreen />;

  return (
    <View style={styles.container}>
      <FlatList
        data={runs}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <WorkflowCard
            run={item}
            onPress={() => navigation.navigate('WorkflowDetail', { runId: item.id })}
          />
        )}
        contentContainerStyle={styles.list}
        onRefresh={refetch}
        refreshing={isLoading}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyTitle}>No Workflows Yet</Text>
            <Text style={styles.emptySubtitle}>
              Create a workflow run via the API to see it here.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  list: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  empty: {
    alignItems: 'center',
    marginTop: spacing.xxl * 2,
    paddingHorizontal: spacing.xl,
  },
  emptyTitle: {
    fontSize: fontSizes.xl,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  emptySubtitle: {
    fontSize: fontSizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
});
