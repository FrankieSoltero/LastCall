import { Stack } from "expo-router";
//You absolutely need an index in every folder including tabs it can be renamed through styling

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index"/>
      <Stack.Screen name="createaccount"/>
    </Stack>
  );
}
