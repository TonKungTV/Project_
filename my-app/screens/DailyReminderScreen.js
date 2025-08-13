import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { requestNotificationPermission, scheduleNotification } from './NotificationHelper';
import { BASE_URL } from './config';

const DailyReminderScreen = () => {
    const [reminders, setReminders] = useState([]);

    useEffect(() => {
        const fetchReminders = async () => {
            const userId = await AsyncStorage.getItem('userId');
            console.log("📦 userId:", userId);  // ✅ ตรวจสอบว่ามีค่า
            fetch(`${BASE_URL}/api/reminders/today?userId=${userId}`)
                .then(res => res.json())
                .then(json => setReminders(json))
                .catch(err => console.error(err));
        };

        fetchReminders();
    }, []);

    return (
        <View style={styles.container}>
            <Text style={styles.title}>📅 รายการแจ้งเตือนวันนี้</Text>
            {reminders.length === 0 ? (
                <Text>ไม่พบรายการแจ้งเตือนวันนี้</Text>
            ) : (
                <FlatList
                    data={reminders}
                    keyExtractor={(item, index) => index.toString()}
                    renderItem={({ item }) => (
                        <View style={styles.card}>
                            <Text>💊 {item.name}</Text>
                            <Text>มื้อ: {item.MealName}</Text>
                            <Text>เวลา: {item.Time}</Text>
                        </View>
                    )}
                />
            )}

        </View>
    );
};

export default DailyReminderScreen;

const styles = StyleSheet.create({
    container: { flex: 1, padding: 20 },
    title: { fontSize: 20, fontWeight: 'bold', marginBottom: 10 },
    card: {
        padding: 14,
        backgroundColor: '#e0f7fa',
        marginBottom: 10,
        borderRadius: 10,
    },
    name: { fontWeight: 'bold', fontSize: 16 },
});
