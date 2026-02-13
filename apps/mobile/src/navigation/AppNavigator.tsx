/**
 * Root stack navigator for the app.
 */

import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../screens/HomeScreen';
import WorkflowListScreen from '../screens/WorkflowListScreen';
import WorkflowDetailScreen from '../screens/WorkflowDetailScreen';
import { colors, fontSizes } from '../theme';

export type RootStackParamList = {
  Home: undefined;
  WorkflowList: undefined;
  WorkflowDetail: { runId: number };
};

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Home"
      screenOptions={{
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontSize: fontSizes.lg,
          fontWeight: '600',
        },
        contentStyle: {
          backgroundColor: colors.background,
        },
      }}
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: 'Life OS' }}
      />
      <Stack.Screen
        name="WorkflowList"
        component={WorkflowListScreen}
        options={{ title: 'Workflows' }}
      />
      <Stack.Screen
        name="WorkflowDetail"
        component={WorkflowDetailScreen}
        options={{ title: 'Workflow Detail' }}
      />
    </Stack.Navigator>
  );
}
