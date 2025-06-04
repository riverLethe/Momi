import React from "react";
import { Stack } from "expo-router";

export default function ChatLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: "slide_from_bottom",
      }}
    />
  );
}
