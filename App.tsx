import "./src/styles/global.css";
import * as WebBrowser from "expo-web-browser";
import AppNavigator from "./src/navigation/AppNavigator";

// Required for expo-web-browser OAuth sessions to close correctly on Android
WebBrowser.maybeCompleteAuthSession();

export default function App() {
  return <AppNavigator />;
}
