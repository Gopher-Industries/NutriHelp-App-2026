import { View, Text, TextInput } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import FieldError from "./FieldError";

export default function Input({
  label,
  value,
  onChangeText,
  error,
  secureTextEntry = false,
  placeholder,
  keyboardType = "default",
  icon, 
}) {
  return (
    <View style={{ marginBottom: 16 }}>
      
      {label && (
        <Text style={{ marginBottom: 6, color: "#000", fontWeight: "500" }}>
          {label}
        </Text>
      )}

      <View style={{ flexDirection: "row", alignItems: "center" }}>
        
        {/* Icon */}
        {icon && (
          <Ionicons name={icon} size={20} color="#666" style={{ marginRight: 8 }} />
        )}

        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholderTextColor="#999"
          style={{
            flex: 1,
            borderWidth: 1,
            borderColor: error ? "red" : "#ccc",
            padding: 12,
            borderRadius: 6,
            color: "#000",
          }}
        />
      </View>
      <FieldError message={error} />
    </View>
  );
}