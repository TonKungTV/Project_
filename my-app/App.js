import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen'; // หน้าหลัก
import MedicationListScreen from './screens/MedicationListScreen'; 
import AddMedicationScreen from './screens/AddMedicationScreen';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';  

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="HomeScreen">
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: 'หน้าหลัก' }} />
        <Stack.Screen name="MedicationList" component={MedicationListScreen} options={{ title: 'รายการยา' }} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'เพิ่มยา' }} />
        <Stack.Screen name="Settings" component={SettingsScreen} options={{ title: 'การตั้งค่า' }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'ข้อมูลส่วนตัว' }} />

      </Stack.Navigator>
    </NavigationContainer>
  );
}
