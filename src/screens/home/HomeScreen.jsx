import { useState } from "react";
import { View, Text, ScrollView } from "react-native";
import { useUser } from "../../context/UserContext";
import WaterTracker from '../../components/WaterTracker';

import BottomSheet from "../../components/common/BottomSheet";
import NavigationHeader from "../../components/common/NavigationHeader";
import Input from "../../components/common/input"; 
import Button from "../../components/common/Button";
import ScreenLayout from "../../components/common/ScreenLayout";
import Card from "../../components/common/Card";
import Badge from "../../components/common/Badge";
import EmptyState from "../../components/common/EmptyState";
import LoadingSpinner from "../../components/common/LoadingSpinner";

export default function HomeScreen() {
  const { user } = useUser();
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false); 

  const handleSubmit = () => {
    if (!email) {
      setError("Email is required");
      return;
    }

    setError("");
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
    }, 2000);
  };

  return (
    <ScreenLayout scrollable>

      {/* Header */}
      <NavigationHeader title="Home" showBackButton={true} />

      <View style={{ padding: 16 }}>
        
        {/* MOB-FE05: Integrated WaterTracker */}
        <View className="mb-6">
          <WaterTracker userId={user?.id} dailyGoal={8} />
        </View>

        <Input
          label="Email"
          value={email}
          onChangeText={setEmail}
          error={error}
          placeholder="Enter email"
        />

        <Button
          label="Submit"
          onPress={handleSubmit}
          loading={loading}
        />

        {/* Bottom Sheet Button */}
        <View style={{ marginTop: 12 }}></View>
        <Button
          label="Open Sheet"
          onPress={() => setOpen(true)}
        />
        <View style={{ marginTop: 12 }}></View>
        <Card>
          <Badge label="Health" />
        </Card>
        <View style={{ marginTop: 12 }}></View>
        <Card>
          <Badge label="Recipe" variant="tag" />
        </Card>

        <EmptyState message="No data available yet" />

        {loading && <LoadingSpinner message="Loading..." />}

      </View>

      {/* Bottom Sheet */}
      <BottomSheet visible={open} onClose={() => setOpen(false)}>
        <Text>This is Bottom Sheet content</Text>
      </BottomSheet>

    </ScreenLayout>
  );
}
