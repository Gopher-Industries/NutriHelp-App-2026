import { createStackNavigator } from "@react-navigation/stack";

import PlaceholderScreen from "./_PlaceholderScreen";

const Stack = createStackNavigator();

export default function CommunityStack() {
  return (
    <Stack.Navigator initialRouteName="FeedScreen">
      <Stack.Screen
        name="FeedScreen"
        component={PlaceholderScreen}
        options={{ title: "Community" }}
      />
      <Stack.Screen
        name="PostDetailScreen"
        component={PlaceholderScreen}
        options={{ title: "Post" }}
      />
      <Stack.Screen
        name="CreatePostScreen"
        component={PlaceholderScreen}
        options={{ title: "Create Post" }}
      />
      <Stack.Screen
        name="LeaderboardScreen"
        component={PlaceholderScreen}
        options={{ title: "Leaderboard" }}
      />
    </Stack.Navigator>
  );
}
