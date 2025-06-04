import { useEffect } from "react";
import { Redirect } from "expo-router";
import * as SecureStore from "expo-secure-store";

export default function Index() {
  // This page redirects to the main app or onboarding
  // In a real app, you would check if the user has completed onboarding

  // For now, simply redirect to the tabs
  return <Redirect href="/(tabs)" />;
}
