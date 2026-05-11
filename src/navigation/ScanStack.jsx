import { createStackNavigator } from "@react-navigation/stack";

import BarcodeScannerScreen from "../screens/scan/BarcodeScannerScreen";
import ProductScanScreen from "../screens/scan/ProductScanScreen";
import ScanProductScreen from "../screens/scan/ScanProductScreen";

const Stack = createStackNavigator();

export default function ScanStack() {
  return (
    <Stack.Navigator initialRouteName="ScanProductScreen">
      <Stack.Screen
        name="ScanProductScreen"
        component={ScanProductScreen}
        initialParams={{ method: "image" }}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="ProductScanScreen"
        component={ProductScanScreen}
        options={{ title: "Product Image" }}
      />
      <Stack.Screen
        name="BarcodeScannerScreen"
        component={BarcodeScannerScreen}
        options={{ title: "Scan Barcode" }}
      />
    </Stack.Navigator>
  );
}
