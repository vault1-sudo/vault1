import React from "react";
import { Stack } from "expo-router";
import { AuthProvider } from "../services/auth/AuthProvider";

import "../styles/vault1.css";

export default function RootLayout() {
  return (
    <AuthProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          animation: "none",
          contentStyle: {
            backgroundColor: "#09090B",
          },
        }}
      />
    </AuthProvider>
  );
}