import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Button, Alert, ScrollView, Platform
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { TimerPickerModal } from "react-native-timer-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";

const frequencyOptions = [
  { label: 'ทุกวัน', value: 'every_day', id: 1 },
  { label: 'ทุก X วัน', value: 'every_X_days', id: 2 },
  { label: 'ทุก X ชั่วโมง', value: 'every_X_hours', id: 3 },
  { label: 'ทุกๆ X นาที', value: 'every_X_minutes', id: 4 },
  { label: 'วันที่เจาะจงของสัปดาห์', value: 'weekly', id: 5 },
  { label: 'วันที่เจาะจงของเดือน', value: 'monthly', id: 6 },
  { label: 'X วันใช้ X วันหยุดพัก', value: 'cycle', id: 7 },
  { label: 'กินเมื่อมีอาการ', value: 'on_demand', id: 8 }
];


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
  const [frequency, setFrequency] = useState('every_day');
  const [frequencyID, setFrequencyID] = useState();
  const [isFrequencyWithCustomTime, setIsFrequencyWithCustomTime] = useState(false);
  const [selectedWeekDays, setSelectedWeekDays] = useState([]);  // สำหรับเลือกวันในสัปดาห์
  const [cycleUseDays, setCycleUseDays] = useState('');  // สำหรับกรอกวันใช้ยา
  const [cycleRestDays, setCycleRestDays] = useState('');  // สำหรับกรอกวันหยุดพัก
  const [selectedMonthDay, setSelectedMonthDay] = useState(new Date());  // สำหรับเลือกวันที่เจาะจงของเดือน
  const [selectedDays, setSelectedDays] = useState({});
  const [mealTime, setMealTime] = useState({});
  const [time, setTime] = useState({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customFrequencyTime, setCustomFrequencyTime] = useState('');
  const [CustomValue, setCustomValue] = useState('');


  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // ดึงข้อมูลจากฐานข้อมูลสำหรับ GroupID
    fetch(`${BASE_URL}/api/groups`)
      .then(res => res.json())
      .then(data => {
        console.log("Groups data:", data);  // ตรวจสอบข้อมูลที่ได้รับจาก API
        setGroups(data);
      })
      .catch(err => console.error('Error fetching groups:', err));

    // ดึงข้อมูลจากฐานข้อมูลสำหรับ UnitID
    fetch(`${BASE_URL}/api/units`)
      .then(res => res.json())
      .then(data => {
        console.log("Units data:", data);  // ตรวจสอบข้อมูลที่ได้รับจาก API
        setUnits(data);
      })
      .catch(err => console.error('Error fetching units:', err));

    // ดึงเวลาทานยาจาก backend
    fetch(`${BASE_URL}/api/userdefaultmealtime`)
      .then(res => res.json())
      .then(data => setDefaultTimes(data))
      .catch(err => console.error('Error fetching user default meal times:', err));
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
  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirm = (time) => {
    setSelectedTime(time);
    hideDatePicker();
  };

  const toggleTime = (id) => {
    setSelectedTimeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };


  // ฟังก์ชันในการเลือกหลายวันจากปฏิทิน
  const onDayPress = (day) => {
    const newSelectedDays = { ...selectedDays };
    const date = day.dateString; // dateString เช่น '2025-08-17'
    if (newSelectedDays[date]) {
      delete newSelectedDays[date]; // ลบวันที่ที่เลือกแล้ว
    } else {
      newSelectedDays[date] = { selected: true, selectedColor: 'blue' }; // เพิ่มวันที่ที่เลือก
    }
    setSelectedDays(newSelectedDays); // update ค่า selectedDays
  };

  const handleSave = async () => {
    console.log('Name:', name);
    console.log('TypeID:', typeID);
    console.log('SelectedTimeIds:', selectedTimeIds);
    console.log('selectedDays:', selectedDays);
    console.log('selectedWeekDays:', selectedWeekDays);
    console.log('selectedMonthDay:', selectedMonthDay);
    console.log('GroupID:', groupID);
    console.log('UnitID: ', unitID);
    console.log('cycleUseDays:', cycleUseDays);
    console.log('cycleRestDays: ', cycleRestDays);
    console.log('customFrequencyTime: ', customFrequencyTime);
    console.log('frequency: ', frequency);
    console.log('CustomValue: ', CustomValue);

    if (!name || !typeID || selectedTimeIds.length === 0 || !groupID) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if ((usageMealID === 2 || usageMealID === 3) && !prePostTime) {
    Alert.alert('กรุณาเลือกเวลาก่อน/หลังอาหาร');
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

    // กำหนด FrequencyID จาก frequencyOptions
    const selectedFrequency = frequencyOptions.find(option => option.value === frequency);
    const FrequencyID = selectedFrequency ? selectedFrequency.id : null;

    // ตรวจสอบว่า FrequencyID ถูกกำหนดหรือไม่
    if (!FrequencyID) {
      console.error('❌ FrequencyID is not defined');
      return;
    }
    
    // แปลง PrePostTime เป็นตัวเลขนาทีที่แน่นอน
    const prePostMinutes =
      (usageMealID === 2 || usageMealID === 3)
        ? (prePostTime === 'custom'
          ? parseInt(customTime, 10)
          : prePostTime)
        : null;

    const medicationData = {
      UserID: userId,
      Name: name,
      Note: note,
      GroupID: parseInt(groupID, 10),
      TypeID: parseInt(typeID, 10),
      Dosage: dosage ? parseInt(dosage, 10) : null,
      UnitID: unitID ? parseInt(unitID, 10) : null,
      UsageMealID: usageMealID ?? null,
      Priority: priority === 'สูง' ? 2 : 1, // ถ้าตาราง priority: 1=ปกติ, 2=สำคัญ/สูง
      Frequency: frequency,
      PrePostTime: prePostTime === 'custom' ? (customTime ? parseInt(customTime, 10) : null) : prePostTime,
      PrePostTime: prePostMinutes,
      StartDate: startDate.toISOString().split('T')[0],
      EndDate: endDate.toISOString().split('T')[0],
      CustomValue: CustomValue,
      FrequencyID,  // ส่ง FrequencyID ที่ได้จากการคำนวณ
      ...defaultTimeFields,
      SelectedWeekDays: selectedWeekDays,  // ส่งวันที่เจาะจงของสัปดาห์
      CycleUseDays: cycleUseDays,  // จำนวนวันที่ใช้ยา
      CycleRestDays: cycleRestDays,  // จำนวนวันที่หยุดพัก
      SelectedMonthDay: selectedMonthDay.getDate(),  // วันที่เลือกในเดือน
      SelectedDays: Object.keys(selectedDays),  // วันที่ที่เลือกจากปฏิทิน
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


  // Logic สำหรับการแสดงผล input เวลา/จำนวนสำหรับ "ทุก X วัน" หรือ "ทุก X ชั่วโมง"
  const handleFrequencyChange = (value) => {
    setFrequency(value);
    if (value === 'every_X_days' || value === 'every_X_hours' || value === 'every_X_minutes') {
      setIsFrequencyWithCustomTime(true);  // แสดงช่องกรอกตัวเลข
    } else if (value === 'weekly') {
      setIsFrequencyWithCustomTime(false);  // แสดงการเลือกวันในสัปดาห์
    } else if (value === 'monthly') {
      setIsFrequencyWithCustomTime(false);  // แสดงการเลือกวันที่ในเดือน
    } else if (value === 'cycle') {
      setIsFrequencyWithCustomTime(false);  // แสดงช่องกรอก X วันใช้ X วันหยุดพัก
    } else {
      setIsFrequencyWithCustomTime(false);  // ซ่อนช่องกรอกตัวเลข
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>กลุ่มโรค</Text>
      <Picker selectedValue={groupID} onValueChange={setGroupID}>
        {groups.length > 0 ? (
          groups.map(group => (
            <Picker.Item key={group.GroupID} label={group.GroupName} value={group.GroupID} />
          ))
        ) : (
          <Picker.Item label="ไม่มีข้อมูล" value="" />
        )}
      </Picker>

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
      </View>
      <Text style={styles.label}>หน่วยยา</Text>
      <Picker selectedValue={unitID} onValueChange={setUnitID}>
        {units.length > 0 ? (
          units.map(unit => (
            <Picker.Item key={unit.UnitID} label={unit.DosageType} value={unit.UnitID} />
          ))
        ) : (
          <Picker.Item label="ไม่มีข้อมูล" value="" />
        )}
      </Picker>

      <Text style={styles.label}>ความถี่</Text>
      <Picker
        selectedValue={frequency}
        onValueChange={handleFrequencyChange}  // เปลี่ยนค่าเมื่อเลือกความถี่
      >
        {frequencyOptions.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>

      {/* กรอกตัวเลขสำหรับ "ทุก X วัน" หรือ "ทุก X ชั่วโมง" */}
      {(isFrequencyWithCustomTime) && (
        <View>
          <Text style={styles.label}>กรอกจำนวน</Text>
          <TextInput
            style={styles.input}
            value={CustomValue}
            onChangeText={setCustomValue}
            keyboardType="numeric"
            placeholder="กรอกจำนวน"
          />
        </View>
      )}

      {/* เลือกวันในสัปดาห์ */}
      {frequency === 'weekly' && (
        <View>
          <Text style={styles.label}>เลือกวันในสัปดาห์</Text>
          {['จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์', 'อาทิตย์'].map((day, index) => (
            <TouchableOpacity
              key={index}
              style={[styles.toggleButton, selectedWeekDays.includes(index + 1) && styles.toggleActive]}
              onPress={() => {
                const newSelectedDays = selectedWeekDays.includes(index + 1)
                  ? selectedWeekDays.filter(item => item !== index + 1)
                  : [...selectedWeekDays, index + 1];
                setSelectedWeekDays(newSelectedDays);
              }}
            >
              <Text>{day}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* สำหรับ X วันใช้ X วันหยุดพัก */}
      {frequency === 'cycle' && (
        <View>
          <Text style={styles.label}>วันใช้ยา</Text>
          <TextInput
            style={styles.input}
            value={cycleUseDays}
            onChangeText={setCycleUseDays}
            keyboardType="numeric"
            placeholder="กรอกจำนวนวันใช้ยา"
          />
          <Text style={styles.label}>วันหยุดพัก</Text>
          <TextInput
            style={styles.input}
            value={cycleRestDays}
            onChangeText={setCycleRestDays}
            keyboardType="numeric"
            placeholder="กรอกจำนวนวันหยุดพัก"
          />
        </View>
      )}

      {/* สำหรับเลือกวันที่เจาะจงของเดือน */}
      {frequency === 'monthly' && (
        <View>
          <Text style={styles.label}>เลือกวันที่เจาะจงของเดือน</Text>
          <Calendar
            // การตั้งค่าปฏิทิน
            markedDates={selectedDays}  // ใช้ข้อมูลวันที่เลือกเพื่อทำเครื่องหมาย
            onDayPress={onDayPress}  // ฟังก์ชันที่ถูกเรียกเมื่อเลือกวัน
            monthFormat={'yyyy MM'}  // รูปแบบเดือนที่แสดง
            markingType={'multi-dot'}  // การแสดงวันที่หลายวัน
          />
        </View>
      )}

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
              style={[styles.toggleButton, prePostTime === 'custom' && styles.toggleActive]}
              onPress={() => setPrePostTime('custom')}
            >
              <Text>เพิ่มเอง</Text>
            </TouchableOpacity>
          </View>

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
        <DateTimePicker
          value={startDate}
          mode="date"
          onChange={(e, selectedDate) => {
            setShowStartPicker(false);
            if (selectedDate) {
              setStartDate(selectedDate);
            }
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
  value={endDate}
  mode="date"
  onChange={(e, selectedDate) => {
    setShowEndPicker(false);
    if (selectedDate) {
      setEndDate(selectedDate);
    }
  }}
/>

      )}

      <Text style={styles.sectionLabel}>ความสำคัญ</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.priorityButton, priority === 'สูง' && styles.priorityHigh]}
          onPress={() => setPriority('สูง')}
        >
          <Text style={styles.priorityText}>สูง</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.priorityButton, priority === 'ปกติ' && styles.priorityNormal]}
          onPress={() => setPriority('ปกติ')}
        >
          <Text style={styles.priorityText}>ปกติ</Text>
        </TouchableOpacity>
      </View>

      <View style={{ marginTop: 0 }}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveText}>บันทึก</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelText}>ยกเลิก</Text>
        </TouchableOpacity>
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
  saveButton: {
    backgroundColor: '#4da6ff',
    padding: 15,
    borderRadius: 25,
    marginTop: 20,
    alignItems: 'center',
  },
  priorityHigh: { backgroundColor: '#f44336' },
  priorityNormal: { backgroundColor: '#4CAF50' },
  priorityText: { color: '#000000ff', fontWeight: 'bold' },
  saveText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  cancelButton: {
    marginTop: 10,
    padding: 15,
    borderRadius: 25,
    backgroundColor: '#ccc',
    alignItems: 'center',
    marginBottom: 60,
  },
  sectionLabel: { fontWeight: 'bold', marginTop: 15, marginBottom: 8 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  priorityButton: {
    flex: 1,
    padding: 12,
    borderRadius: 20,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  timeText: {
    fontSize: 18,
    marginBottom: 20,
  },
  button: {
    backgroundColor: '#4CAF50',
    padding: 15,
    borderRadius: 5,
    marginBottom: 20,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
  },
});


export default AddMedicationScreen;
