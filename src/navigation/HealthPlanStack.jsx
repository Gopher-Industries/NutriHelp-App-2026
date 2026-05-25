import { createStackNavigator } from "@react-navigation/stack";
import HealthPlanScreen from "../screens/HealthPlan/HealthPlanScreen";

const Stack = createStackNavigator();

export default function HealthPlanStack() {
  return (
    <Stack.Navigator>
      <Stack.Screen
        name="HealthPlanScreen"
        component={HealthPlanScreen}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
}
