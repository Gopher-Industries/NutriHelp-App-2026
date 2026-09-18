import { createStackNavigator } from "@react-navigation/stack";

import { CommunityProvider } from "../context/CommunityContext";
import CommunityFeedScreen from "../screens/community/CommunityFeedScreen";
import CreatePostScreen from "../screens/community/CreatePostScreen";
import LeaderboardScreen from "../screens/community/LeaderboardScreen";
import PostDetailScreen from "../screens/community/PostDetailScreen";

const Stack = createStackNavigator();

export default function CommunityStack() {
  return (
    <CommunityProvider>
      <Stack.Navigator
        initialRouteName="FeedScreen"
        screenOptions={{
          headerShown: false,
          cardStyle: {
            backgroundColor: "#F4F7FB",
          },
        }}
      >
        <Stack.Screen
          name="FeedScreen"
          component={CommunityFeedScreen}
        />

        <Stack.Screen
          name="PostDetailScreen"
          component={PostDetailScreen}
        />

        <Stack.Screen
          name="CreatePostScreen"
          component={CreatePostScreen}
        />

        <Stack.Screen
          name="LeaderboardScreen"
          component={LeaderboardScreen}
        />
      </Stack.Navigator>
    </CommunityProvider>
  );
}