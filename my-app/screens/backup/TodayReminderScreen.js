import { scheduleNotification, requestNotificationPermission } from './NotificationHelper';

useEffect(() => {
  const fetchReminders = async () => {
    const userId = await AsyncStorage.getItem('userId');
    const granted = await requestNotificationPermission();
    if (!granted) return;

    try {
      const res = await fetch(`${BASE_URL}/api/reminders/today?userId=${userId}`);
      const data = await res.json();
      console.log("✅ Reminder data:", data);
      setReminders(data); // เก็บไว้ใน state
    } catch (err) {
      console.error("❌ Error fetching reminders", err);
    }
  };

  fetchReminders();
}, []);

// useEffect(() => {
//   if (reminders.length === 0) return;

//   reminders.forEach((reminder) => {
//     const [hours, minutes, seconds] = reminder.Time.split(':').map(Number);
//     const now = new Date();
//     const triggerDate = new Date();
//     triggerDate.setHours(hours, minutes, seconds, 0);

//     if (triggerDate < now) return;

//     console.log("🔔 Scheduling:", reminder.name, triggerDate);

//     scheduleNotification(
//       `ถึงเวลาทานยา: ${reminder.name}`,
//       `มื้อ: ${reminder.MealName}`,
//       triggerDate
//     );
//   });
// }, [reminders]);

useEffect(() => {
  (async () => {
    const granted = await requestNotificationPermission();
    if (!granted) return;

    // ตัวอย่าง: แจ้งเตือนอีก 10 วินาที
    const when = new Date(Date.now() + 10 * 1000);
    await scheduleNotification('ทดสอบแจ้งเตือน', 'ถึงเวลาทานยาแล้ว', when);
  })();
}, []);