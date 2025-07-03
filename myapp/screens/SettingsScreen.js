// screens/SettingsScreen.js

import React, { useState } from 'react';
import { View, Text, TextInput, Button, StyleSheet, Alert } from 'react-native';

const SettingsScreen = () => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthdate, setBirthdate] = useState('');
  const [bloodType, setBloodType] = useState('');
  const [meals, setMeals] = useState('');

  const handleSave = () => {
    // TODO: เชื่อม API เพื่อบันทึกค่าลง backend หรือ AsyncStorage ก็ได้
    Alert.alert('บันทึกข้อมูลเรียบร้อย');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>ตั้งค่าข้อมูลส่วนตัว</Text>

      <TextInput style={styles.input} placeholder="ชื่อ" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="อีเมล" value={email} onChangeText={setEmail} />
      <TextInput style={styles.input} placeholder="เบอร์โทรศัพท์" value={phone} onChangeText={setPhone} />
      <TextInput style={styles.input} placeholder="เพศ" value={gender} onChangeText={setGender} />
      <TextInput style={styles.input} placeholder="วันเดือนปีเกิด (yyyy-mm-dd)" value={birthdate} onChangeText={setBirthdate} />
      <TextInput style={styles.input} placeholder="กรุ๊ปเลือด" value={bloodType} onChangeText={setBloodType} />
      <TextInput style={styles.input} placeholder="เวลามื้ออาหาร (เช้า, เที่ยง, เย็น, ก่อนนอน)" value={meals} onChangeText={setMeals} />

      <Button title="บันทึก" onPress={handleSave} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    marginBottom: 10,
  },
});

export default SettingsScreen;
