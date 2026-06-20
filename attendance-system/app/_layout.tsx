import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { COLORS } from '../constants/colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar style="light" />
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: COLORS.background },
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" />
        <Stack.Screen name="hod" />
        <Stack.Screen name="faculty" />
        <Stack.Screen name="student" />
        <Stack.Screen name="class-detail" />
        <Stack.Screen name="add-student" />
        <Stack.Screen name="add-faculty" />
        <Stack.Screen name="assign-role" />
        <Stack.Screen name="report" />
        <Stack.Screen name="profile" />
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  );
}
