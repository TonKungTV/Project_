import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity, Button, Alert, ScrollView
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';

import moment from 'moment';

const toggleOptions = (current, setFunc, value) => {
  setFunc(current === value ? null : value);
};

const AddMedicationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [group, setGroup] = useState('');
  const [note, setNote] = useState('');
  const [medType, setMedType] = useState(null);
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('');
  const [withFood, setWithFood] = useState(null);
  const [mealTime, setMealTime] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [importance, setImportance] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [date, setDate] = useState(new Date());
  const [show, setShow] = useState(false);

  const onChange = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShow(Platform.OS === 'ios'); // ปิด popup บน Android
    setDate(currentDate);
  };

  const showDatepicker = () => {
    setShow(true);
  };

  const toggleMeal = (meal) => {
    setMealTime(prev =>
      prev.includes(meal)
        ? prev.filter(m => m !== meal)
        : [...prev, meal]
    );
  };

  const handleSave = async () => {
    if (!name || !medType || mealTime.length === 0) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    const newMedication = {
      name,
      group,
      note,
      medType,
      dosage,
      unit,
      withFood,
      mealTime,
      startDate,
      endDate,
      importance,
      createdAt: new Date().toISOString()
    };

    try {
      const existing = await AsyncStorage.getItem('medications');
      const meds = existing ? JSON.parse(existing) : [];
      meds.push(newMedication);
      await AsyncStorage.setItem('medications', JSON.stringify(meds));

      // ส่งไป backend
      await fetch('http://192.168.1.219:3000/medications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newMedication),
      });

      Alert.alert('เพิ่มยาสำเร็จ');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('เกิดข้อผิดพลาด');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>กลุ่มโรค</Text>
      <TextInput style={styles.input} value={group} onChangeText={setGroup} />

      <Text style={styles.label}>หมายเหตุเพิ่มเติม</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} multiline />

      <Text style={styles.label}>ประเภท</Text>
      <View style={styles.toggleRow}>
        {['เม็ด', 'น้ำ', 'ฉีด', 'ทา'].map(t => (
          <TouchableOpacity
            key={t}
            style={[styles.toggleButton, medType === t && styles.toggleActive]}
            onPress={() => toggleOptions(medType, setMedType, t)}>
            <Text>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>ขนาดยา</Text>
      <View style={{ flexDirection: 'row' }}>
        <TextInput
          style={[styles.input, { flex: 1, marginRight: 8 }]}
          value={dosage}
          onChangeText={setDosage}
          keyboardType="numeric"
        />
        <TextInput
          style={[styles.input, { flex: 1 }]}
          value={unit}
          onChangeText={setUnit}
        />
      </View>

      <Text style={styles.label}>พร้อมอาหาร</Text>
      <View style={styles.toggleRow}>
        {['พร้อมอาหาร', 'เวลากินยา'].map(option => (
          <TouchableOpacity
            key={option}
            style={[
              styles.toggleButton,
              withFood === option && styles.toggleActive,
            ]}
            onPress={() => toggleOptions(withFood, setWithFood, option)}>
            <Text>{option}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>มื้ออาหาร</Text>
      <View style={styles.toggleRow}>
        {['เช้า', 'เที่ยง', 'เย็น', 'ก่อนนอน'].map(meal => (
          <TouchableOpacity
            key={meal}
            style={[
              styles.toggleButton,
              mealTime.includes(meal) && styles.toggleActive,
            ]}
            onPress={() => toggleMeal(meal)}>
            <Text>{meal}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.label}>ระยะเวลา</Text>
      <View>
      <Button onPress={showDatepicker} title="เลือกวันที่" />
      {show && (
        <DateTimePicker
          testID="dateTimePicker"
          value={date}
          mode={'date'}
          display="default"
          onChange={onChange}
        />
      )}
    </View>

      {showStartPicker && (
        <DateTimePicker
          value={startDate}
          mode="date"
          display="default"
          onChange={(e, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          display="default"
          onChange={(e, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>ความสำคัญ</Text>
      <View style={styles.toggleRow}>
        {['สูง', 'ปกติ'].map(level => (
          <TouchableOpacity
            key={level}
            style={[
              styles.toggleButton,
              importance === level && styles.toggleActive,
              level === 'สูง' && { backgroundColor: '#faa' },
            ]}
            onPress={() => toggleOptions(importance, setImportance, level)}>
            <Text>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="บันทึก" onPress={handleSave} />
        <View style={{ height: 10 }} />
        <Button title="ลบ" color="gray" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  label: { fontWeight: 'bold', marginBottom: 6, marginTop: 15 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  toggleButton: {
    padding: 10,
    borderRadius: 20,
    backgroundColor: '#eee',
    marginRight: 10,
    marginBottom: 10,
  },
  toggleActive: {
    backgroundColor: '#aef',
  },
  dateButton: {
    backgroundColor: '#afa',
    padding: 10,
    borderRadius: 8,
  },
});

export default AddMedicationScreen;
