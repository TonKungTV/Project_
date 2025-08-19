import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    SafeAreaView,
    StatusBar,
    Alert,
} from 'react-native';
import { BASE_URL } from './config';

const MealTimes = ({ navigation }) => {
    const [mealTimes, setMealTimes] = useState({
    });

    const [editingMeal, setEditingMeal] = useState(null);
    const [tempTime, setTempTime] = useState('');

    // ดึงข้อมูลเวลาอาหารจาก Backend (โดยใช้ fetch)
    
    useEffect(() => {
  fetch(`${BASE_URL}/api/meal-times${id}`) // เปลี่ยน URL ให้ถูกต้อง
    .then(response => {
      if (!response.ok) {
        throw new Error('Failed to fetch meal times');  // เพิ่มการตรวจสอบ error
      }
      return response.json();
    })
    .then(data => {
      console.log('Meal times fetched successfully:', data);  // ตรวจสอบข้อมูลที่ได้รับ
      setMealTimes({
        breakfast: data.breakfast,
        lunch: data.lunch,
        dinner: data.dinner,
        snack: data.snack,
      });
    })
    .catch(error => {
      console.error('Error fetching meal times:', error); // เพิ่มการแสดงข้อผิดพลาด
      Alert.alert('Error', 'ไม่สามารถดึงข้อมูลเวลาอาหาร');
    });
}, []);


    const handleTimePress = (mealType) => {
        setEditingMeal(mealType);
        setTempTime(mealTimes[mealType]);
    };

    const handleTimeSubmit = () => {
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (timeRegex.test(tempTime)) {
            setMealTimes(prev => ({
                ...prev,
                [editingMeal]: tempTime,
            }));
            setEditingMeal(null);
        } else {
            Alert.alert('Error', 'กรุณากรอกเวลาในรูปแบบ HH:MM (24-hour)');
        }
    };

    const handleSave = () => {
        fetch(`${BASE_URL}/api/meal-times`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(mealTimes),
        })
            .then(response => {
                if (!response.ok) {
                    throw new Error('Failed to save meal times');
                }
                return response.json();
            })
            .then(data => {
                Alert.alert('Success', 'บันทึกเวลาอาหารสำเร็จ!');
                navigation.goBack();
            })
            .catch(error => {
                console.error('Error saving meal times:', error);
                Alert.alert('Error', 'ไม่สามารถบันทึกเวลาอาหาร');
            });

    };

    const handleCancel = () => {
        navigation.goBack();
    };

    const renderTimeInput = (label, mealType, time) => (
        <View style={styles.inputContainer} key={mealType}>
            <Text style={styles.label}>{label}</Text>
            {editingMeal === mealType ? (
                <View style={styles.editContainer}>
                    <TextInput
                        style={styles.textInput}
                        value={tempTime}
                        onChangeText={setTempTime}
                        placeholder="HH:MM"
                        keyboardType="numeric"
                        maxLength={5}
                        autoFocus
                        onBlur={handleTimeSubmit}
                        onSubmitEditing={handleTimeSubmit}
                    />
                </View>
            ) : (
                <TouchableOpacity
                    style={styles.timeInput}
                    onPress={() => handleTimePress(mealType)}
                >
                    <Text style={styles.timeText}>{time}</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    return (
        <SafeAreaView style={styles.container}>
            <StatusBar backgroundColor="#3B82F6" barStyle="light-content" />
            <View style={styles.mainContent}>
                <View style={styles.iconContainer}>
                    <View style={styles.bowlIcon}>
                        <Text style={styles.bowlEmoji}>🍜</Text>
                    </View>
                </View>
                <View style={styles.inputsContainer}>
                    {renderTimeInput('เช้า', 'breakfast', mealTimes.breakfast)}
                    {renderTimeInput('เที่ยง', 'lunch', mealTimes.lunch)}
                    {renderTimeInput('เย็น', 'dinner', mealTimes.dinner)}
                    {renderTimeInput('ก่อนนอน', 'snack', mealTimes.snack)}
                </View>
                <View style={styles.buttonContainer}>
                    <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                        <Text style={styles.saveButtonText}>บันทึก</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
                        <Text style={styles.cancelButtonText}>ยกเลิก</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#3B82F6' },
    mainContent: {
        flex: 1,
        backgroundColor: '#FFFFFF',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        marginTop: 8,
        paddingHorizontal: 24,
        paddingTop: 32,
        paddingBottom: 32,
    },
    iconContainer: { alignItems: 'center', marginBottom: 32 },
    bowlIcon: { width: 64, height: 64, backgroundColor: '#6B7280', borderRadius: 32, justifyContent: 'center', alignItems: 'center' },
    bowlEmoji: { fontSize: 28 },
    inputsContainer: { flex: 1 },
    inputContainer: { marginBottom: 24 },
    label: { fontSize: 16, fontWeight: '500', color: '#374151', marginBottom: 8 },
    timeInput: { backgroundColor: '#F3F4F6', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 8, justifyContent: 'center', minHeight: 48 },
    timeText: { fontSize: 16, color: '#6B7280' },
    editContainer: { backgroundColor: '#F3F4F6', borderRadius: 8, overflow: 'hidden' },
    textInput: { paddingHorizontal: 16, paddingVertical: 12, fontSize: 16, color: '#374151', backgroundColor: '#FFFFFF', borderWidth: 2, borderColor: '#3B82F6', borderRadius: 8 },
    buttonContainer: { flexDirection: 'row', gap: 16, marginTop: 24 },
    saveButton: { flex: 1, backgroundColor: '#3B82F6', paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
    saveButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
    cancelButton: { flex: 1, backgroundColor: '#6B7280', paddingVertical: 12, borderRadius: 24, alignItems: 'center' },
    cancelButtonText: { color: '#FFFFFF', fontSize: 16, fontWeight: '500' },
});

export default MealTimes;
