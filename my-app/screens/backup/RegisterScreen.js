import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Button,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from './config';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [gender, setGender] = useState('');
  const [birthDate, setBirthDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [bloodType, setBloodType] = useState('');
  const [password, setPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');

  const handleRegister = async () => {
    if (!name || !email || !phone || !gender || !birthDate || !bloodType || !password) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

    // if (password !== confirmPassword) {
    //   Alert.alert('รหัสผ่านไม่ตรงกัน');
    //   return;
    // }

    const data = {
      name,
      email,
      phone,
      gender,
      birthDate: birthDate.toISOString().split('T')[0],
      bloodType,
      password
    };

    try {
      const res = await fetch(`${BASE_URL}/api/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        Alert.alert('สมัครสมาชิกสำเร็จ', 'ไปยังหน้าเข้าสู่ระบบ', [
          { text: 'ตกลง', onPress: () => navigation.navigate('LoginScreen') }
        ]);
      } else {
        const err = await res.json();
        Alert.alert('เกิดข้อผิดพลาด', err.error || 'ไม่สามารถสมัครสมาชิกได้');
      }
    } catch (error) {
      console.error(error);
      Alert.alert('ไม่สามารถเชื่อมต่อเซิร์ฟเวอร์');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>สมัครสมาชิก</Text>

      <TextInput placeholder="ชื่อ - นามสกุล" style={styles.input} value={name} onChangeText={setName} />
      <TextInput placeholder="อีเมล" style={styles.input} value={email} onChangeText={setEmail} keyboardType="email-address" />
      <TextInput placeholder="เบอร์โทรศัพท์" style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" />

      <Text style={styles.label}>เพศ</Text>
      <Picker selectedValue={gender} onValueChange={(value) => setGender(value)} style={styles.picker}>
        <Picker.Item label="-- เลือกเพศ --" value="" />
        <Picker.Item label="ชาย" value="Male" />
        <Picker.Item label="หญิง" value="Female" />
      </Picker>

      <Text style={styles.label}>วันเกิด</Text>
      <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.datePicker}>
        <Text>{birthDate.toLocaleDateString('th-TH')}</Text>
      </TouchableOpacity>
      {showDatePicker && (
        <DateTimePicker
          value={birthDate}
          mode="date"
          display="default"
          onChange={(event, selectedDate) => {
            setShowDatePicker(false);
            if (selectedDate) setBirthDate(selectedDate);
          }}
        />
      )}

      <Text style={styles.label}>หมู่เลือด</Text>
      <Picker selectedValue={bloodType} onValueChange={(value) => setBloodType(value)} style={styles.picker}>
        <Picker.Item label="-- เลือกหมู่เลือด --" value="" />
        <Picker.Item label="A" value="A" />
        <Picker.Item label="B" value="B" />
        <Picker.Item label="AB" value="AB" />
        <Picker.Item label="O" value="O" />
      </Picker>

      <TextInput placeholder="รหัสผ่าน" style={styles.input} secureTextEntry value={password} onChangeText={setPassword} />
      {/* <TextInput placeholder="ยืนยันรหัสผ่าน" style={styles.input} secureTextEntry value={confirmPassword} onChangeText={setConfirmPassword} /> */}

      <Button title="สมัครสมาชิก" onPress={handleRegister} />
      <TouchableOpacity onPress={() => navigation.navigate('LoginScreen')}>
        <Text style={styles.link}>← กลับไปหน้าเข้าสู่ระบบ</Text>
      </TouchableOpacity>
    </View>
  );
};

export default RegisterScreen;

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff', flex: 1 },
  title: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  input: {
    borderWidth: 1, borderColor: '#ccc', padding: 10,
    borderRadius: 8, marginBottom: 10
  },
  label: { fontWeight: 'bold', marginTop: 10 },
  picker: { backgroundColor: '#eee', marginBottom: 10 },
  datePicker: {
    padding: 12, borderWidth: 1, borderColor: '#ccc',
    borderRadius: 8, marginBottom: 10
  },
  link: {
    marginTop: 15,
    color: 'blue',
    textAlign: 'center'
  }
});
