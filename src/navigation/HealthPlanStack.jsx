import { createStackNavigator } from "@react-navigation/stack";

import HealthPlanScreen from "../screens/HealthPlan/HealthPlanScreen";
import DiabetesPersonalisationScreen from "../screens/diabetes/DiabetesPersonalisationScreen";

const Stack = createStackNavigator();

export default function HealthPlanStack() {
  return (
    <Stack.Navigator
      initialRouteName="HealthPlanScreen"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen
        name="HealthPlanScreen"
        component={HealthPlanScreen}
      />

      <Stack.Screen
        name="DiabetesPersonalisation"
        component={DiabetesPersonalisationScreen}
      />
    </Stack.Navigator>
  );
}