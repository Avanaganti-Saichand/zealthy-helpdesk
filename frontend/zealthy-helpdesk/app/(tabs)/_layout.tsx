import { Tabs } from "expo-router";
import React from "react";

import { HapticTab } from "@/components/haptic-tab";
import { IconSymbol } from "@/components/ui/icon-symbol";
import { Colors } from "@/constants/theme";
import { useColorScheme } from "@/hooks/use-color-scheme";

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors[colorScheme ?? "light"].tint,
        headerShown: false,
        tabBarButton: HapticTab,
      }}
    >
      {/* Submit tab (app/(tabs)/index.js) */}
      <Tabs.Screen
        name="index"
        options={{
          title: "Submit",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="square.and.pencil" color={color} />
          ),
        }}
      />

      {/* Admin tab (app/(tabs)/admin.js) */}
      <Tabs.Screen
        name="admin"
        options={{
          title: "Admin",
          tabBarIcon: ({ color }) => (
            <IconSymbol size={28} name="wrench.and.screwdriver" color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
