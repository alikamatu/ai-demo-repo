import { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from "react-native";
import { Redirect } from "expo-router";
import { useSession } from "@/src/providers/session-provider";
import { useDashboard } from "@/src/hooks/use-dashboard";
import type { LlmMode } from "@/src/types/lifeos";

function readableTime(value: string | null | undefined): string {
  if (!value) return "Not synced yet";

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Not synced yet";
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

export default function AppHomeScreen() {
  const { token, user, signOut } = useSession();

  if (!token || !user) {
    return <Redirect href="/(auth)/login" />;
  }

  const {
    dashboard,
    livePulse,
    loading,
    refreshing,
    queueCount,
    offlineMode,
    llmStatus,
    llmLoading,
    llmSwitching,
    lastOrchestration,
    lastProviderCheckAt,
    providerCheckRunning,
    pendingApprovals,
    quickActions,
    refresh,
    refreshLlmStatus,
    changeLlmMode,
    runProviderCheck,
    runAction,
    updateApproval,
    toggleAutomation,
    sendPushTest,
  } = useDashboard(token, user.id);

  const [pushing, setPushing] = useState(false);

  const activeAutomationCount = useMemo(
    () => dashboard?.automations.filter((item) => item.status === "active").length ?? 0,
    [dashboard]
  );

  const llmModeLabel: Record<LlmMode, string> = {
    mock: "Demo",
    openai: "OpenAI",
    ollama: "Ollama",
    llamacpp: "Local",
  };

  if (loading && !dashboard) {
    return (
      <View style={{ flex: 1, backgroundColor: "#F6EFE6", alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator size="large" color="#10263B" />
      </View>
    );
  }

  return (
    <ScrollView
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={{
        backgroundColor: "#F6EFE6",
        padding: 16,
        gap: 12,
      }}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor="#10263B" />}
    >
      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 6 }}>
        <Text selectable style={{ fontSize: 22, fontWeight: "900", color: "#10263B" }}>Welcome back, {user.name}</Text>
        <Text selectable style={{ color: "#4D6379" }}>{user.email}</Text>
        <Text selectable style={{ color: "#4D6379" }}>Last sync: {readableTime(dashboard?.updatedAt)}</Text>
        <Text selectable style={{ color: offlineMode ? "#9A2F2B" : "#267351", fontWeight: "700" }}>
          {offlineMode ? `Offline queue active (${queueCount} pending)` : `All synced (${queueCount} queued)`}
        </Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable onPress={signOut} style={{ marginTop: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, backgroundColor: "#10263B" }}>
            <Text selectable style={{ color: "#F6F9FB", fontWeight: "700" }}>Logout</Text>
          </Pressable>
          <Pressable
            onPress={async () => {
              setPushing(true);
              await sendPushTest();
              setPushing(false);
            }}
            style={{ marginTop: 6, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, borderWidth: 1, borderColor: "#C9D4DF", backgroundColor: "#FFF" }}
          >
            <Text selectable style={{ color: "#10263B", fontWeight: "700" }}>
              {pushing ? "Sending..." : "Test Push"}
            </Text>
          </Pressable>
        </View>
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 10 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#10263B" }}>AI Engine</Text>
        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#CAD5DF", padding: 10, backgroundColor: "#FFF", gap: 6 }}>
          <Text selectable style={{ color: "#4D6379" }}>
            Mode: <Text style={{ fontWeight: "800", color: "#10263B" }}>{llmStatus ? llmModeLabel[llmStatus.mode] : "Unknown"}</Text>
          </Text>
          <Text selectable style={{ color: llmStatus?.ready ? "#267351" : "#9A2F2B", fontWeight: "700" }}>
            {llmStatus?.ready ? "Provider ready" : "Provider unavailable"}
          </Text>
          <Text selectable style={{ color: "#4D6379" }}>{llmStatus?.reason ?? "Checking provider status..."}</Text>
          <Text selectable style={{ color: "#4D6379" }}>Model: {llmStatus?.model ?? "n/a"}</Text>
        </View>

        <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 8 }}>
          {(llmStatus?.options ?? ["mock", "openai", "ollama", "llamacpp"]).map((mode) => {
            const active = mode === llmStatus?.mode;
            return (
              <Pressable
                key={mode}
                onPress={() => {
                  void changeLlmMode(mode);
                }}
                disabled={active || llmSwitching}
                style={{
                  borderRadius: 10,
                  paddingHorizontal: 10,
                  paddingVertical: 7,
                  borderWidth: 1,
                  borderColor: active ? "#0AA789" : "#C9D4DF",
                  backgroundColor: active ? "#D8F6EF" : "#FFF",
                }}
              >
                <Text selectable style={{ color: active ? "#0B6F5D" : "#10263B", fontWeight: "700" }}>
                  {llmSwitching && !active ? "Switching..." : llmModeLabel[mode]}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            onPress={() => {
              void refreshLlmStatus();
            }}
            disabled={llmLoading || llmSwitching}
            style={{ borderRadius: 10, borderWidth: 1, borderColor: "#C9D4DF", backgroundColor: "#FFF", paddingHorizontal: 10, paddingVertical: 7 }}
          >
            <Text selectable style={{ color: "#10263B", fontWeight: "700" }}>
              {llmLoading ? "Refreshing..." : "Refresh"}
            </Text>
          </Pressable>
          <Pressable
            onPress={() => {
              void runProviderCheck();
            }}
            disabled={providerCheckRunning}
            style={{ borderRadius: 10, borderWidth: 1, borderColor: "#C9D4DF", backgroundColor: "#10263B", paddingHorizontal: 10, paddingVertical: 7 }}
          >
            <Text selectable style={{ color: "#F6F9FB", fontWeight: "700" }}>
              {providerCheckRunning ? "Checking..." : "Run Provider Check"}
            </Text>
          </Pressable>
        </View>

        <View style={{ borderRadius: 12, borderWidth: 1, borderColor: "#CAD5DF", padding: 10, backgroundColor: "#FFF", gap: 4 }}>
          <Text selectable style={{ color: "#4D6379" }}>
            Last check: {readableTime(lastProviderCheckAt)}
          </Text>
          <Text selectable style={{ color: "#10263B", fontWeight: "700" }}>
            Provider: {lastOrchestration?.provider ?? "No run yet"}
          </Text>
          <Text selectable style={{ color: "#4D6379" }}>
            Model: {lastOrchestration?.model ?? "n/a"}
          </Text>
        </View>
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 10 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#10263B" }}>Quick Actions</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {quickActions.map((action) => (
            <Pressable
              key={action.id}
              onPress={() => {
                void runAction(action.id);
              }}
              style={{
                width: "48%",
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#C6D3DE",
                backgroundColor: "#10263B",
                paddingVertical: 11,
                paddingHorizontal: 10,
              }}
            >
              <Text selectable style={{ color: "#EFF5FA", fontWeight: "700", textAlign: "center" }}>{action.label}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 10 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#10263B" }}>Mission Status</Text>
        <Text selectable style={{ color: "#4D6379", lineHeight: 22 }}>{dashboard?.assistantText ?? "No assistant status yet."}</Text>
        <View style={{ flexDirection: "row", gap: 8, flexWrap: "wrap" }}>
          {(dashboard?.stats ?? []).map((stat) => (
            <View key={stat.id} style={{ minWidth: "48%", borderWidth: 1, borderColor: "#CCD6E0", borderRadius: 14, padding: 10, backgroundColor: "#FFFFFF" }}>
              <Text selectable style={{ fontSize: 22, fontWeight: "900", color: "#10263B", fontVariant: ["tabular-nums"] }}>{stat.value}</Text>
              <Text selectable style={{ color: "#5A6E81" }}>{stat.label}</Text>
            </View>
          ))}
        </View>
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 8 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#10263B" }}>
          Automations ({activeAutomationCount} active)
        </Text>
        {(dashboard?.automations ?? []).map((automation) => (
          <View key={automation.id} style={{ borderRadius: 12, borderWidth: 1, borderColor: "#CAD5DF", padding: 10, backgroundColor: "#FFF", gap: 6 }}>
            <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>{automation.name}</Text>
            <Text selectable style={{ color: "#4D6379" }}>{automation.trigger}</Text>
            <Text selectable style={{ color: "#4D6379" }}>{automation.effect}</Text>
            <Pressable
              onPress={() => {
                void toggleAutomation(automation);
              }}
              style={{ alignSelf: "flex-start", borderRadius: 10, borderWidth: 1, borderColor: "#C9D4DF", paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "#FFF" }}
            >
              <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>
                {automation.status === "active" ? "Pause" : "Activate"}
              </Text>
            </Pressable>
          </View>
        ))}
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 8 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#10263B" }}>
          Pending approvals ({pendingApprovals.length})
        </Text>
        {pendingApprovals.length === 0 && (
          <Text selectable style={{ color: "#4D6379" }}>No pending approvals.</Text>
        )}
        {pendingApprovals.map((item) => (
          <View key={item.id} style={{ borderRadius: 12, borderWidth: 1, borderColor: "#CAD5DF", padding: 10, backgroundColor: "#FFF", gap: 6 }}>
            <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>{item.title}</Text>
            <Text selectable style={{ color: "#4D6379" }}>{item.note}</Text>
            <View style={{ flexDirection: "row", gap: 8 }}>
              <Pressable
                onPress={() => {
                  void updateApproval(item.id, "approved");
                }}
                style={{ borderRadius: 10, backgroundColor: "#10263B", paddingHorizontal: 10, paddingVertical: 7 }}
              >
                <Text selectable style={{ color: "#F6F9FB", fontWeight: "700" }}>Approve</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void updateApproval(item.id, "rejected");
                }}
                style={{ borderRadius: 10, borderWidth: 1, borderColor: "#C9D4DF", backgroundColor: "#FFF", paddingHorizontal: 10, paddingVertical: 7 }}
              >
                <Text selectable style={{ color: "#10263B", fontWeight: "700" }}>Reject</Text>
              </Pressable>
            </View>
          </View>
        ))}
      </View>

      <View style={{ borderRadius: 20, borderWidth: 1, borderColor: "#B7C4D1", backgroundColor: "#FFFFFFD8", padding: 14, gap: 8 }}>
        <Text selectable style={{ fontSize: 18, fontWeight: "800", color: "#10263B" }}>Live Pulse</Text>
        <Text selectable style={{ color: "#4D6379" }}>
          Weather: {livePulse ? `${livePulse.weather.city}, ${livePulse.weather.temperatureC}°C, ${livePulse.weather.condition}` : "Loading"}
        </Text>
        <Pressable
          onPress={() => {
            if (livePulse?.jobs.url) {
              void Linking.openURL(livePulse.jobs.url);
            }
          }}
          style={{ borderRadius: 12, borderWidth: 1, borderColor: "#CBD5DF", backgroundColor: "#FFF", padding: 10 }}
        >
          <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>
            Job: {livePulse ? `${livePulse.jobs.role} @ ${livePulse.jobs.company}` : "Loading"}
          </Text>
          <Text selectable style={{ color: "#4D6379" }}>{livePulse?.jobs.location ?? ""}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            if (livePulse?.news.url) {
              void Linking.openURL(livePulse.news.url);
            }
          }}
          style={{ borderRadius: 12, borderWidth: 1, borderColor: "#CBD5DF", backgroundColor: "#FFF", padding: 10 }}
        >
          <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>
            News: {livePulse?.news.headline ?? "Loading"}
          </Text>
          <Text selectable style={{ color: "#4D6379" }}>
            {livePulse ? `${livePulse.news.source} · ${livePulse.news.points} points` : ""}
          </Text>
        </Pressable>
      </View>
    </ScrollView>
  );
}
