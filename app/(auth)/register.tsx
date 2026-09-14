import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { useAuth } from "../../services/auth/AuthProvider";

export default function RegisterScreen() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async () => {
    setError("");

    if (!name || !email || !password) {
      setError("Please complete all fields.");
      return;
    }

    if (password.length < 6) {
      setError("Password must contain at least 6 characters.");
      return;
    }

    try {
      setLoading(true);
      await register(email.trim(), password, name.trim());
      router.replace("/");
    } catch {
      setError("Unable to create account. Check the details and try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.back}>← BACK</Text>
        </Pressable>

        <Text style={styles.logo}>VAULT1</Text>
        <Text style={styles.tagline}>CREATE YOUR ACCOUNT</Text>

        <View style={styles.divider} />

        <Text style={styles.heading}>Create account.</Text>
        <Text style={styles.description}>
          Your financial operating system starts here.
        </Text>

        <TextInput
          style={styles.input}
          placeholder="Full name"
          placeholderTextColor="#666"
          value={name}
          onChangeText={setName}
        />

        <TextInput
          style={styles.input}
          placeholder="Email address"
          placeholderTextColor="#666"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          placeholderTextColor="#666"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={styles.button}
          onPress={handleRegister}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Text style={styles.buttonText}>CREATE ACCOUNT</Text>
          )}
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#060606",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },

  card: {
    width: "100%",
    maxWidth: 460,
    padding: 42,
    backgroundColor: "#0D0D0D",
    borderWidth: 1,
    borderColor: "#202020",
    borderRadius: 20,
  },

  back: {
    color: "#777777",
    fontSize: 11,
    fontWeight: "700",
    letterSpacing: 1.5,
    marginBottom: 30,
  },

  logo: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "800",
    letterSpacing: 5,
  },

  tagline: {
    color: "#666666",
    fontSize: 10,
    fontWeight: "600",
    letterSpacing: 2.5,
    marginTop: 8,
  },

  divider: {
    height: 1,
    backgroundColor: "#222222",
    marginVertical: 32,
  },

  heading: {
    color: "#FFFFFF",
    fontSize: 28,
    fontWeight: "700",
  },

  description: {
    color: "#777777",
    fontSize: 14,
    marginTop: 8,
    marginBottom: 28,
    lineHeight: 21,
  },

  input: {
    height: 54,
    backgroundColor: "#141414",
    borderWidth: 1,
    borderColor: "#252525",
    borderRadius: 10,
    paddingHorizontal: 16,
    color: "#FFFFFF",
    fontSize: 15,
    marginBottom: 12,
  },

  error: {
    color: "#FF6B6B",
    fontSize: 13,
    marginBottom: 14,
  },

  button: {
    height: 54,
    backgroundColor: "#FFFFFF",
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 8,
  },

  buttonText: {
    color: "#000000",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 1.5,
  },
});