import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Button, Alert, ScrollView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const AddMedicationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [groupID, setGroupID] = useState('');
  const [typeID, setTypeID] = useState(null);
  const [dosage, setDosage] = useState('');
  const [unitID, setUnitID] = useState('');
  const [usageMealID, setUsageMealID] = useState(null);
  const [priority, setPriority] = useState(null);
  const [prePostTime, setPrePostTime] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [defaultTimes, setDefaultTimes] = useState([]);
  const [selectedTimeIds, setSelectedTimeIds] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  // ✅ ดึงเวลาทานยาจาก backend
  useEffect(() => {
    fetch(`${BASE_URL}/api/userdefaultmealtime`)
      .then(res => res.json())
      .then(data => setDefaultTimes(data))
      .catch(err => console.error(err));
  }, []);

  const convertMeal = (mealId) => {
    switch (mealId) {
      case 1: return 'เช้า';
      case 2: return 'กลางวัน';
      case 3: return 'เย็น';
      case 4: return 'ก่อนนอน';
      default: return 'ไม่ระบุ';
    }
  };

  const toggleTime = (id) => {
    setSelectedTimeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSave = async () => {
    if (!name || !typeID || selectedTimeIds.length === 0 || !groupID) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }

// ถ้าเลือกก่อน/หลังอาหาร ต้องเลือกนาทีด้วย  
 if ((usageMealID === 2 || usageMealID === 3)) {
     const needMinutes =
       prePostTime === null ||
       prePostTime === undefined ||
       (prePostTime === 'custom' && (!customTime || isNaN(parseInt(customTime, 10))));
     if (needMinutes) {
       Alert.alert('โปรดเลือกจำนวน “นาที” สำหรับก่อน/หลังอาหาร (เช่น 15 หรือ 30 นาที)');
       return;
     }
   }

      // ✅ ดึง userId จาก AsyncStorage
  const userIdStr = await AsyncStorage.getItem('userId');
  const userId = userIdStr ? parseInt(userIdStr, 10) : null;
  if (!userId) {
    Alert.alert('กรุณาเข้าสู่ระบบก่อนเพิ่มยา');
    navigation.navigate('LoginScreen');
    return;
  }

    const defaultTimeFields = {};
    selectedTimeIds.forEach((id, index) => {
      defaultTimeFields[`DefaultTime_ID_${index + 1}`] = id;
    });

    // แปลง PrePostTime เป็นตัวเลขนาทีที่แน่นอน
   const prePostMinutes =
     (usageMealID === 2 || usageMealID === 3)
       ? (prePostTime === 'custom'
           ? parseInt(customTime, 10)
           : prePostTime)
       : null;

    const medicationData = {
    // ✅ แนบ UserID ไปด้วย
    UserID: userId,
    Name: name,
    Note: note,
    GroupID: parseInt(groupID, 10),
    TypeID: typeID,
    TypeID: parseInt(typeID, 10),
    Dosage: dosage ? parseInt(dosage, 10) : null,
    UnitID: unitID ? parseInt(unitID, 10) : null,
    UsageMealID: usageMealID ?? null,
    Priority: priority === 'สูง' ? 2 : 1, // ถ้าตาราง priority: 1=ปกติ, 2=สำคัญ/สูง
    PrePostTime: prePostTime === 'custom' ? (customTime ? parseInt(customTime, 10) : null) : prePostTime,
    PrePostTime: prePostMinutes,
    StartDate: startDate.toISOString().split('T')[0],
    EndDate: endDate.toISOString().split('T')[0],
    ...defaultTimeFields
  };

  try {
    const response = await fetch(`${BASE_URL}/api/medications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(medicationData),
    });

    if (response.ok) {
      Alert.alert('เพิ่มยาเรียบร้อย');
      navigation.goBack();
    } else {
      const errMsg = await response.text();
      console.log('Error response:', errMsg);
      Alert.alert('เกิดข้อผิดพลาดในการเพิ่ม');
    }
  } catch (error) {
    console.error('ERROR:', error);
    Alert.alert('เชื่อมต่อ backend ไม่ได้');
  }
};

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>กลุ่มโรค (GroupID)</Text>
      <TextInput style={styles.input} value={groupID} onChangeText={setGroupID} keyboardType="numeric" />

      <Text style={styles.label}>หมายเหตุเพิ่มเติม</Text>
      <TextInput style={styles.input} value={note} onChangeText={setNote} multiline />

      <Text style={styles.label}>ประเภทยา</Text>
      <View style={styles.toggleRow}>
        {['เม็ด', 'น้ำ', 'ฉีด', 'ทา'].map((type, index) => (
          <TouchableOpacity
            key={type}
            style={[styles.toggleButton, typeID === index + 1 && styles.toggleActive]}
            onPress={() => setTypeID(index + 1)}
          >
            <Text>{type}</Text>
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
          value={unitID}
          onChangeText={setUnitID}
          placeholder="รหัสหน่วย"
          keyboardType="numeric"
        />
      </View>

      <Text style={styles.label}>วิธีกินยา</Text>
      <View style={styles.toggleRow}>
        {[
          { label: 'พร้อมอาหาร', id: 1 },
          { label: 'ก่อนอาหาร', id: 2 },
          { label: 'หลังอาหาร', id: 3 },
        ].map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.toggleButton, usageMealID === opt.id && styles.toggleActive]}
            onPress={() => {
              setUsageMealID(opt.id);
              setPrePostTime(null); // reset เวลาเมื่อเปลี่ยนประเภท
              setCustomTime('');
            }}
          >
            <Text>{opt.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* หากเลือก "ก่อนอาหาร" หรือ "หลังอาหาร" ให้เลือกเวลา */}
      {(usageMealID === 2 || usageMealID === 3) && (
        <>
          <Text style={styles.label}>เลือกเวลาก่อน/หลังอาหาร</Text>
          <View style={styles.toggleRow}>
            {[15, 30].map((min) => (
              <TouchableOpacity
                key={min}
                style={[styles.toggleButton, prePostTime === min && styles.toggleActive]}
                onPress={() => {
                  setPrePostTime(min);
                  setCustomTime('');
                }}
              >
                <Text>{min} นาที</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.toggleButton,
                prePostTime === 'custom' && styles.toggleActive,
              ]}
              onPress={() => {
                setPrePostTime('custom');
              }}
            >
              <Text>เพิ่มเอง</Text>
            </TouchableOpacity>
          </View>

          {/* ช่องกรอกเวลาที่กำหนดเอง */}
          {prePostTime === 'custom' && (
            <TextInput
              placeholder="ระบุเวลา (นาที)"
              style={styles.input}
              keyboardType="numeric"
              value={customTime}
              onChangeText={setCustomTime}
            />
          )}
        </>
      )}

      <Text style={styles.label}>มื้อ/เวลาที่กินยา</Text>
      {defaultTimes.map(time => (
        <TouchableOpacity
          key={time.DefaultTime_ID}
          onPress={() => toggleTime(time.DefaultTime_ID)}
          style={[
            styles.timeButton,
            selectedTimeIds.includes(time.DefaultTime_ID) && styles.selected
          ]}
        >
          <Text>{`${convertMeal(time.MealID)} (${time.Time.slice(0, 5)})`}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>ระยะเวลา</Text>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Button title={`เริ่มต้น ${startDate.toLocaleDateString('th-TH')}`} onPress={() => setShowStartPicker(true)} />
        <Button title={`สิ้นสุด ${endDate.toLocaleDateString('th-TH')}`} onPress={() => setShowEndPicker(true)} />
      </View>

      {showStartPicker && (
        <DateTimePicker value={startDate} mode="date" onChange={(e, selected) => {
          setShowStartPicker(false);
          if (selected) setStartDate(selected);
        }} />
      )}
      {showEndPicker && (
        <DateTimePicker value={endDate} mode="date" onChange={(e, selected) => {
          setShowEndPicker(false);
          if (selected) setEndDate(selected);
        }} />
      )}

      <Text style={styles.label}>ความสำคัญ</Text>
      <View style={styles.toggleRow}>
        {['สูง', 'ปกติ'].map(level => (
          <TouchableOpacity
            key={level}
            style={[styles.toggleButton, priority === level && styles.toggleActive]}
            onPress={() => setPriority(level)}
          >
            <Text>{level}</Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={{ marginTop: 20 }}>
        <Button title="บันทึก" onPress={handleSave} />
        <View style={{ height: 10 }} />
        <Button title="ยกเลิก" color="gray" onPress={() => navigation.goBack()} />
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 20, backgroundColor: '#fff' },
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
  toggleActive: { backgroundColor: '#aef' },
  timeButton: {
    padding: 10,
    backgroundColor: '#eee',
    marginVertical: 5,
    borderRadius: 8,
  },
  selected: { backgroundColor: '#aef' },
});

export default AddMedicationScreen;
