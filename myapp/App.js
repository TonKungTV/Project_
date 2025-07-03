// App.js

import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import MedicationListScreen from './screens/MedicationListScreen';
import AddMedicationScreen from './screens/AddMedicationScreen';
import SettingsScreen from './screens/SettingsScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="MedicationList">
        <Stack.Screen name="MedicationList" component={MedicationListScreen} options={{ title: 'รายการยา' }} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'เพิ่มยา' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'ตั้งค่าผู้ใช้' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
