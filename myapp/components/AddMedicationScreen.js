// screens/AddMedicationScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert, ScrollView } from 'react-native';

const AddMedicationScreen = () => {
  const [name, setName] = useState('');
  const [dosage, setDosage] = useState('');
  const [unit, setUnit] = useState('');
  const [usage, setUsage] = useState('');
  const [time, setTime] = useState('เช้า'); // default เป็น เช้า

  const handleSubmit = () => {
    if (!name || !dosage || !unit || !usage || !time) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    fetch('http://<YOUR_IP>:3000/medications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        MedicationName: name,
        Dosage: dosage,
        Unit: unit,
        Usage: usage,
        Time: time
      })
    })
    .then(res => res.json())
    .then(data => {
      Alert.alert('เพิ่มข้อมูลยาเรียบร้อยแล้ว');
      // ล้างฟอร์ม
      setName('');
      setDosage('');
      setUnit('');
      setUsage('');
      setTime('เช้า');
    })
    .catch(err => {
      Alert.alert('เกิดข้อผิดพลาดในการเชื่อมต่อกับเซิร์ฟเวอร์');
      console.error(err);
    });
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>เพิ่มข้อมูลยา</Text>

      <Text>ชื่อยา:</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text>ปริมาณ:</Text>
      <TextInput style={styles.input} value={dosage} onChangeText={setDosage} keyboardType="numeric" />

      <Text>หน่วย (เช่น เม็ด, ml):</Text>
      <TextInput style={styles.input} value={unit} onChangeText={setUnit} />

      <Text>วิธีใช้:</Text>
      <TextInput style={styles.input} value={usage} onChangeText={setUsage} />

      <Text>เวลากิน:</Text>
      <TextInput style={styles.input} value={time} onChangeText={setTime} />

      <Button title="เพิ่มยา" onPress={handleSubmit} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20 },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc',
    padding: 10, marginBottom: 15, borderRadius: 8
  }
});

export default AddMedicationScreen;
