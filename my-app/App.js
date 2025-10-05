import React, { useState, useEffect, useRef } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AppState } from 'react-native';

import { NotificationProvider } from './contexts/NotificationContext';

import HomeScreen from './screens/HomeScreen';
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
import HistoryScreen from './screens/HistoryScreen';
import ManageGroupsScreen from './screens/ManageGroupsScreen';
import ManageTypesScreen from './screens/ManageTypesScreen';
import ManageUnitsScreen from './screens/ManageUnitsScreen';
import CalendarScreen from './screens/CalendarScreen'; // ✅ ใช้สะกดถูก

const Stack = createNativeStackNavigator();

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(null);
  const [showSplash, setShowSplash] = useState(true);
  const isCheckingLogin = useRef(false); // ✅ ป้องกันการเรียกซ้ำ

  useEffect(() => {
    checkLoginStatus();

    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active' && !isCheckingLogin.current && !showSplash) {
        checkLoginStatus();
      }
    });

    return () => {
      subscription.remove();
    };
  }, [showSplash]);

  const checkLoginStatus = async () => {
    if (isCheckingLogin.current) {
      console.log('กำลังตรวจสอบอยู่ ข้าม');
      return;
    }

    isCheckingLogin.current = true;

    try {
      const userId = await AsyncStorage.getItem('userId');
      console.log('🔍 Checking login status:', { userId });
      const loggedIn = !!userId;

      if (!showSplash && loggedIn === isLoggedIn) {
        console.log('State ไม่เปลี่ยน ข้าม');
        isCheckingLogin.current = false;
        return;
      }

      if (!showSplash) {
        console.log('✅ Update isLoggedIn:', loggedIn);
        setIsLoggedIn(loggedIn);
        isCheckingLogin.current = false;
        return;
      }

      setTimeout(() => {
        console.log('✅ Setting isLoggedIn:', loggedIn);
        setIsLoggedIn(loggedIn);
        setShowSplash(false);
        isCheckingLogin.current = false;
      }, 3000);

    } catch (e) {
      console.error('Error checking login status:', e);
      setTimeout(() => {
        setIsLoggedIn(false);
        setShowSplash(false);
        isCheckingLogin.current = false;
      }, 3000);
    }
  };

  const handleLoginSuccess = () => {
    console.log('🎉 handleLoginSuccess called!');
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    console.log('🚪 handleLogout called!');
    await AsyncStorage.removeItem('userId');
    setIsLoggedIn(false);
  };

  if (showSplash || isLoggedIn === null) {
    return <Home />;
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? (
        <NotificationProvider>
          <Stack.Navigator initialRouteName="HomeScreen">
            <Stack.Screen name="HomeScreen" options={{ title: '' }}>
              {(props) => <HomeScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="TestHomeScreen" component={TestHomeScreen} options={{ title: '' }} />
            <Stack.Screen name="MedicationListScreen" component={MedicationListScreen} options={{ title: 'รายการยา' }} />
            <Stack.Screen name="AddMedication" component={AddMedicationScreen} options={{ title: 'เพิ่มยา' }} />
            <Stack.Screen name="MedicationDetailScreen" component={MedicationDetailScreen} options={{ title: 'รายละเอียดยา' }} />
            <Stack.Screen name="DailyReminderScreen" component={DailyReminderScreen} options={{ title: 'รายการยาที่ต้องกิน' }} />
            <Stack.Screen name="SettingsScreen" options={{ title: 'ตั้งค่าผู้ใช้' }}>
              {(props) => <SettingsScreen {...props} onLogout={handleLogout} />}
            </Stack.Screen>
            <Stack.Screen name="ProfileScreen" component={ProfileScreen} options={{ title: 'ข้อมูลส่วนตัว' }} />
            <Stack.Screen name="MealTimes" component={MealTimes} options={{ title: 'ตั้งค่าเวลามื้ออาหาร' }} />
            <Stack.Screen name="EditMedicationScreen" component={EditMedicationScreen} options={{ title: 'แก้ไขยา' }} />
            <Stack.Screen name="History" component={HistoryScreen} options={{ title: 'ประวัติการกินยา' }} />
            <Stack.Screen name="AddGroup" component={AddGroupScreen} options={{ title: 'เพิ่มกลุ่มโรค' }} />
            <Stack.Screen name="AddType" component={AddTypeScreen} options={{ title: 'เพิ่มประเภทยา' }} />
            <Stack.Screen name="AddUnit" component={AddUnitScreen} options={{ title: 'เพิ่มหน่วยยา' }} />
            <Stack.Screen name="ManageGroups" component={ManageGroupsScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ManageTypes" component={ManageTypesScreen} options={{ headerShown: false }} />
            <Stack.Screen name="ManageUnits" component={ManageUnitsScreen} options={{ headerShown: false }} />

            {/* ✅ แก้ชื่อ Screen ให้ตรง: CalendarScreen (สะกดถูก) */}
            <Stack.Screen name="CalendarScreen" component={CalendarScreen} options={{ title: 'ปฏิทิน' }} />
          </Stack.Navigator>
        </NotificationProvider>
      ) : (
        <Stack.Navigator initialRouteName="LoginScreen">
          <Stack.Screen name="LoginScreen" options={{ title: 'Login' }}>
            {(props) => <LoginScreen {...props} onLoginSuccess={handleLoginSuccess} />}
          </Stack.Screen>
          <Stack.Screen name="RegisterScreen" component={RegisterScreen} options={{ title: 'Register' }} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
