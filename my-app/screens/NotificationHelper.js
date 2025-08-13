// NotificationHelper.js
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

// ให้แสดง notification เวลาแอปเปิดอยู่
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// ขอ permission
export async function requestNotificationPermission() {
  // SDK 53: ขอสิทธิ์ผ่าน expo-notifications ได้เลย
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

// ตั้งเวลาการแจ้งเตือน
export async function scheduleNotification(title, body, triggerDate) {
  // triggerDate: new Date(...) หรือ object { hour, minute, repeats }
  return await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      // sound: true, // ถ้าต้องการเสียงบน iOS ให้ใส่ไฟล์เสียงหรือใช้ค่าดีฟอลต์
    },
    trigger: triggerDate,
  });
}
