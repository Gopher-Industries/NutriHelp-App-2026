import { createStackNavigator } from "@react-navigation/stack";

import LoginScreen from "../screens/auth/LoginScreen";
import SignupScreen from "../screens/auth/SignupScreen";
import ForgotPasswordStep1Screen from "../screens/auth/ForgotPasswordStep1Screen";
import ForgotPasswordStep2Screen from "../screens/auth/ForgotPasswordStep2Screen";
import ForgotPasswordStep3Screen from "../screens/auth/ForgotPasswordStep3Screen";
import MFAScreen from "../screens/auth/MFAScreen";

const Stack = createStackNavigator();
const ROUTE_BY_GOTO_KEY = {
  login: "LoginScreen",
  signup: "SignupScreen",
  forgot1: "ForgotPasswordStep1Screen",
  forgot2: "ForgotPasswordStep2Screen",
  forgot3: "ForgotPasswordStep3Screen",
  mfa: "MFAScreen",
};

function withGoToBridge(ScreenComponent) {
  return function GoToAdapter({ navigation, route }) {
    const goTo = (nextScreen, params = {}) => {
      const targetRoute = ROUTE_BY_GOTO_KEY[nextScreen] ?? nextScreen;
      navigation.navigate(targetRoute, params);
    };

    return <ScreenComponent goTo={goTo} {...(route?.params ?? {})} />;
  };
}

const LoginRoute = withGoToBridge(LoginScreen);
const SignupRoute = withGoToBridge(SignupScreen);
const ForgotPasswordStep1Route = withGoToBridge(ForgotPasswordStep1Screen);
const ForgotPasswordStep2Route = withGoToBridge(ForgotPasswordStep2Screen);
const ForgotPasswordStep3Route = withGoToBridge(ForgotPasswordStep3Screen);
const MFARoute = withGoToBridge(MFAScreen);

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="LoginScreen"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="LoginScreen" component={LoginRoute} />
      <Stack.Screen name="SignupScreen" component={SignupRoute} />
      <Stack.Screen
        name="ForgotPasswordStep1Screen"
        component={ForgotPasswordStep1Route}
      />
      <Stack.Screen
        name="ForgotPasswordStep2Screen"
        component={ForgotPasswordStep2Route}
      />
      <Stack.Screen
        name="ForgotPasswordStep3Screen"
        component={ForgotPasswordStep3Route}
      />
      <Stack.Screen name="MFAScreen" component={MFARoute} />
    </Stack.Navigator>
  );
}
