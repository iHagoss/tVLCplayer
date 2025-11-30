import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { RootStackParamList } from "@/types";
import PlayerScreen from "@/screens/PlayerScreen";
import SettingsScreen from "@/screens/SettingsScreen";
import SkipConfigurationScreen from "@/screens/SkipConfigurationScreen";
import TraktAuthScreen from "@/screens/TraktAuthScreen";
import { HeaderTitle } from "@/components/HeaderTitle";
import { useTheme } from "@/hooks/useTheme";
import { getCommonScreenOptions } from "@/navigation/screenOptions";

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function RootNavigator() {
  const { theme, isDark } = useTheme();

  return (
    <Stack.Navigator
      initialRouteName="Player"
      screenOptions={{
        ...getCommonScreenOptions({ theme, isDark, transparent: false }),
        headerShown: false,
        animation: "fade",
        contentStyle: {
          backgroundColor: theme.backgroundRoot,
        },
      }}
    >
      <Stack.Screen
        name="Player"
        component={PlayerScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Settings"
        component={SettingsScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: "dark",
          headerTitle: "Settings",
          headerTintColor: theme.text,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
      <Stack.Screen
        name="SkipConfiguration"
        component={SkipConfigurationScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: "dark",
          headerTitle: "Manual Skip Times",
          headerTintColor: theme.text,
          presentation: "modal",
          animation: "slide_from_right",
        }}
      />
      <Stack.Screen
        name="TraktAuth"
        component={TraktAuthScreen}
        options={{
          headerShown: true,
          headerTransparent: true,
          headerBlurEffect: "dark",
          headerTitle: "Connect to Trakt",
          headerTintColor: theme.text,
          presentation: "modal",
          animation: "slide_from_bottom",
        }}
      />
    </Stack.Navigator>
  );
}
