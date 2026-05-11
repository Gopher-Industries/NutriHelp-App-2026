import { View, Text, Modal, TouchableOpacity, Pressable } from "react-native";

export default function BottomSheet({
  visible,
  onClose,
  children,
  snapPoints = [0.4], 
}) {
  const sheetHeight = snapPoints[0] * 800; 
  return (
    <Modal
      transparent
      animationType="slide"
      visible={visible}
      onRequestClose={onClose}
    >
      {/* Backdrop */}
      <Pressable
        style={{
          flex: 1,
          backgroundColor: "rgba(0,0,0,0.5)",
        }}
        onPress={onClose}
      />

      {/* Sheet */}
      <View
        style={{
          position: "absolute",
          bottom: 0,
          width: "100%",
          height: sheetHeight, 
          backgroundColor: "#fff",
          borderTopLeftRadius: 20,
          borderTopRightRadius: 20,
          padding: 20,
        }}
      >
        {children}

        {/* Close button */}
        <TouchableOpacity
          onPress={onClose}
          style={{
            marginTop: 20,
            padding: 12,
            backgroundColor: "#eee",
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text>Close</Text>
        </TouchableOpacity>
      </View>
    </Modal>
  );
}