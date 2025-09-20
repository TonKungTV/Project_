import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from './screens/HomeScreen'; // หน้าหลัก
import MedicationListScreen from './screens/MedicationListScreen';
import AddMedicationScreen from './screens/AddMedicationScreen';
import MedicationDetailScreen from './screens/MedicationDetailScreen';
import TestHomeScreen from './screens/TestHomeScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import DailyReminderScreen from './screens/DailyReminderScreen';
import Home from './screens/Home';
import SettingsScreen from './screens/SettingsScreen';
import ProfileScreen from './screens/ProfileScreen';
import MealTimes from './screens/MealTimes';
import EditMedicationScreen from './screens/EditMedicationScreen';
import AddGroupScreen from './screens/AddGroupScreen';
import AddTypeScreen from './screens/AddTypeScreen';
import AddUnitScreen from './screens/AddUnitScreen';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Home} options={{ title: '' }} />
        <Stack.Screen name="HomeScreen" component={HomeScreen} options={{ title: '' }} />
        <Stack.Screen name="TestHomeScreen" component={TestHomeScreen} options={{ title: '' }} />
        <Stack.Screen name="LoginScreen" component={LoginScreen} options={{ title: 'Login' }} />
        <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ title: 'Register' }} />
        <Stack.Screen name="MedicationListScreen" component={MedicationListScreen} options={{ title: 'รายการยา' }} />
        <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'เพิ่มยา' }} />
        <Stack.Screen name="MedicationDetailScreen" component={MedicationDetailScreen} options={{ title: 'รายละเอียดยา' }} />
        <Stack.Screen name="DailyReminderScreen" component={DailyReminderScreen} options={{ title: 'รายการยาที่ต้องกิน' }} />
        <Stack.Screen name="SettingsScreen" component={SettingsScreen} options={{ title: 'ตั้งค่าผู้ใช้' }} />
        <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'ข้อมูลส่วนตัว' }} />
        <Stack.Screen name="MealTimes" component={MealTimes} options={{ title: 'ตั้งค่าเวลามื้ออาหาร' }} />
        <Stack.Screen name="EditMedicationScreen" component={EditMedicationScreen} options={{ title: 'แก้ไขยา' }} />
        <Stack.Screen name='History' component={require('./screens/HistoryScreen').default} options={{ title: 'ประวัติการกินยา' }} />
        <Stack.Screen name="AddGroup" component={AddGroupScreen} options={{ title: 'เพิ่มกลุ่มโรค' }} />
        <Stack.Screen name="AddType" component={AddTypeScreen} options={{ title: 'เพิ่มประเภทยา' }} />
        <Stack.Screen name="AddUnit" component={AddUnitScreen} options={{ title: 'เพิ่มหน่วยยา' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
