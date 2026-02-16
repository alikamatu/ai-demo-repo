import { useState } from "react";
import { Alert, Pressable, ScrollView, Text, TextInput, View } from "react-native";
import { router } from "expo-router";
import { useSession } from "@/src/providers/session-provider";
import { getApiBaseUrl, healthCheck } from "@/src/services/api";

export default function LoginScreen() {
  const { signIn, signUp } = useSession();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [name, setName] = useState("New User");
  const [email, setEmail] = useState("alex@lifeos.dev");
  const [password, setPassword] = useState("demo1234");
  const [submitting, setSubmitting] = useState(false);
  const [checking, setChecking] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<null | {
    ok: boolean;
    message: string;
  }>(null);

  async function handleLogin() {
    setSubmitting(true);
    const ok =
      mode === "signin" ? await signIn(email, password) : await signUp(name, email, password);
    setSubmitting(false);

    if (!ok) {
      Alert.alert("Authentication failed", "Check your details and try again.");
      return;
    }

    router.replace("/(app)");
  }

  async function handleConnectionTest() {
    setChecking(true);
    const response = await healthCheck();
    setChecking(false);

    if (!response?.ok) {
      setConnectionStatus({
        ok: false,
        message: "Health check failed. Verify API URL, backend process, and network.",
      });
      return;
    }

    setConnectionStatus({
      ok: true,
      message: `Connected to ${response.service} (${response.llmMode ?? "unknown-llm"})`,
    });
  }

  return (
    <ScrollView contentInsetAdjustmentBehavior="automatic" contentContainerStyle={{ flexGrow: 1, padding: 18, gap: 14, backgroundColor: "#F6EFE6" }}>
      <View style={{ gap: 4 }}>
        <Text selectable style={{ fontSize: 12, fontWeight: "700", letterSpacing: 1.2, color: "#4D6379" }}>
          Personal AI Operating System
        </Text>
        <Text selectable style={{ fontSize: 42, fontWeight: "900", color: "#10263B" }}>
          LIFEOS
        </Text>
        <Text selectable style={{ fontSize: 16, lineHeight: 24, color: "#4D6379" }}>
          Sign in to access your private assistant workspace on mobile.
        </Text>
      </View>

      <View style={{ borderRadius: 24, borderWidth: 1, borderColor: "#BFC8D1", backgroundColor: "#FFFFFFD9", padding: 16, gap: 12 }}>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <Pressable
            onPress={() => setMode("signin")}
            style={{
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 7,
              backgroundColor: mode === "signin" ? "#10263B" : "#FFF",
              borderWidth: 1,
              borderColor: "#BBC4CE",
            }}
          >
            <Text selectable style={{ color: mode === "signin" ? "#F6F9FB" : "#10263B", fontWeight: "700" }}>
              Sign in
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("signup")}
            style={{
              borderRadius: 10,
              paddingHorizontal: 10,
              paddingVertical: 7,
              backgroundColor: mode === "signup" ? "#10263B" : "#FFF",
              borderWidth: 1,
              borderColor: "#BBC4CE",
            }}
          >
            <Text selectable style={{ color: mode === "signup" ? "#F6F9FB" : "#10263B", fontWeight: "700" }}>
              Create account
            </Text>
          </Pressable>
        </View>

        {mode === "signup" ? (
          <View style={{ gap: 6 }}>
            <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              style={{ borderWidth: 1, borderColor: "#BBC4CE", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, backgroundColor: "#FFF" }}
            />
          </View>
        ) : null}

        <View style={{ gap: 6 }}>
          <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>Email</Text>
          <TextInput
            value={email}
            onChangeText={setEmail}
            autoCapitalize="none"
            keyboardType="email-address"
            style={{ borderWidth: 1, borderColor: "#BBC4CE", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, backgroundColor: "#FFF" }}
          />
        </View>

        <View style={{ gap: 6 }}>
          <Text selectable style={{ fontWeight: "700", color: "#10263B" }}>Password</Text>
          <TextInput
            value={password}
            onChangeText={setPassword}
            secureTextEntry
            style={{ borderWidth: 1, borderColor: "#BBC4CE", borderRadius: 14, paddingHorizontal: 12, paddingVertical: 11, fontSize: 16, backgroundColor: "#FFF" }}
          />
        </View>

        <Pressable
          onPress={handleLogin}
          disabled={submitting}
          style={{ borderRadius: 14, backgroundColor: "#10263B", alignItems: "center", justifyContent: "center", paddingVertical: 13, opacity: submitting ? 0.7 : 1 }}
        >
          <Text selectable style={{ color: "#F6F9FB", fontWeight: "800", fontSize: 16 }}>
            {submitting
              ? mode === "signin"
                ? "Signing in..."
                : "Creating account..."
              : mode === "signin"
                ? "Sign in"
                : "Create account"}
          </Text>
        </Pressable>

        <Pressable
          onPress={handleConnectionTest}
          disabled={checking}
          style={{
            borderRadius: 14,
            borderWidth: 1,
            borderColor: "#BCC8D5",
            backgroundColor: "#FFF",
            alignItems: "center",
            justifyContent: "center",
            paddingVertical: 12,
            opacity: checking ? 0.7 : 1,
          }}
        >
          <Text selectable style={{ color: "#10263B", fontWeight: "800", fontSize: 15 }}>
            {checking ? "Testing..." : "Connection Test"}
          </Text>
        </Pressable>

        {connectionStatus ? (
          <View
            style={{
              borderRadius: 12,
              borderWidth: 1,
              borderColor: connectionStatus.ok ? "#BDE9DE" : "#F3C1C0",
              backgroundColor: connectionStatus.ok ? "#EAFBF5" : "#FFF1F1",
              padding: 10,
            }}
          >
            <Text selectable style={{ color: connectionStatus.ok ? "#1E6B55" : "#9A2F2B", fontWeight: "700" }}>
              {connectionStatus.message}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ borderRadius: 16, borderWidth: 1, borderColor: "#BCC8D5", backgroundColor: "#FFFFFFC2", padding: 12, gap: 4 }}>
        <Text selectable style={{ color: "#4D6379" }}>API: {getApiBaseUrl()}</Text>
        <Text selectable style={{ fontWeight: "800", color: "#10263B" }}>Demo users</Text>
        <Text selectable style={{ color: "#4D6379" }}>alex@lifeos.dev / demo1234</Text>
        <Text selectable style={{ color: "#4D6379" }}>career@lifeos.dev / demo1234</Text>
        <Text selectable style={{ color: "#4D6379" }}>family@lifeos.dev / demo1234</Text>
      </View>
    </ScrollView>
  );
}
