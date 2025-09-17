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
  // ...existing state...
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
  const [selectedWeekDays, setSelectedWeekDays] = useState([]);  // 1=Mon .. 7=Sun
  const [cycleUseDays, setCycleUseDays] = useState('');  // สำหรับกรอกวันใช้ยา
  const [cycleRestDays, setCycleRestDays] = useState('');  // สำหรับกรอกวันหยุดพัก
  // เก็บวันที่ที่เลือกในปฏิทินเป็น object สำหรับ markedDates
  const [selectedMonthDates, setSelectedMonthDates] = useState({});  // { '2025-09-17': {selected:true,...}, ... }
  const [mealTime, setMealTime] = useState({});
  const [time, setTime] = useState({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customFrequencyTime, setCustomFrequencyTime] = useState('');
  const [CustomValue, setCustomValue] = useState('');

  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    // ...existing fetches...
    fetch(`${BASE_URL}/api/groups`)
      .then(res => res.json())
      .then(data => {
        console.log("Groups data: ", data);
        setGroups(data);
      })
      .catch(err => console.error('Error fetching groups:', err));

    fetch(`${BASE_URL}/api/units`)
      .then(res => res.json())
      .then(data => {
        console.log("Units data:", data);
        setUnits(data);
      })
      .catch(err => console.error('Error fetching units:', err));

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

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleConfirm = (time) => { setSelectedTime(time); hideDatePicker(); };

  const toggleTime = (id) => {
    setSelectedTimeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  // Calendar multi-select (สำหรับ monthly) - toggle date selection
  const onMonthDayPress = (day) => {
    const dateStr = day.dateString; // 'YYYY-MM-DD'
    setSelectedMonthDates(prev => {
      const copy = { ...prev };
      if (copy[dateStr]) {
        delete copy[dateStr];
      } else {
        copy[dateStr] = { selected: true, selectedColor: '#4da6ff' };
      }
      return copy;
    });
  };

  const handleSave = async () => {
    // ...existing validations...
    if (!name || !typeID || selectedTimeIds.length === 0 || !groupID) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if ((usageMealID === 2 || usageMealID === 3) && !prePostTime) {
      Alert.alert('กรุณาเลือกเวลาก่อน/หลังอาหาร');
      return;
    }
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

    // frequency-specific validations
    if (frequency === 'weekly' && selectedWeekDays.length === 0) {
      Alert.alert('โปรดเลือกวันในสัปดาห์อย่างน้อย 1 วัน');
      return;
    }
    if (frequency === 'monthly' && Object.keys(selectedMonthDates).length === 0) {
      Alert.alert('โปรดเลือกวันที่ของเดือนอย่างน้อย 1 วัน');
      return;
    }
    if ((frequency === 'every_X_days' || frequency === 'every_X_hours' || frequency === 'every_X_minutes') && (!CustomValue || isNaN(parseInt(CustomValue, 10)))) {
      Alert.alert('โปรดกรอกจำนวนสำหรับความถี่แบบกำหนดเอง');
      return;
    }
    if (frequency === 'cycle' && (!cycleUseDays || !cycleRestDays || isNaN(parseInt(cycleUseDays, 10)) || isNaN(parseInt(cycleRestDays, 10)))) {
      Alert.alert('โปรดกรอกจำนวนวันสำหรับวงจรการใช้/หยุดพัก');
      return;
    }

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

    const selectedFrequency = frequencyOptions.find(option => option.value === frequency);
    const FrequencyID = selectedFrequency ? selectedFrequency.id : null;
    if (!FrequencyID) {
      console.error('❌ FrequencyID is not defined');
      return;
    }

    const prePostMinutes =
      (usageMealID === 2 || usageMealID === 3)
        ? (prePostTime === 'custom'
          ? parseInt(customTime, 10)
          : prePostTime)
        : null;

    // สร้าง array ของวันที่ของเดือนจาก selectedMonthDates (unique day numbers)
    const monthDayNumbers = Object.keys(selectedMonthDates)
      .map(d => new Date(d).getDate())
      .filter(n => Number.isFinite(n));
    const uniqueMonthDays = Array.from(new Set(monthDayNumbers)).sort((a,b) => a-b);

    const medicationData = {
      UserID: userId,
      Name: name,
      Note: note,
      GroupID: parseInt(groupID, 10),
      TypeID: parseInt(typeID, 10),
      Dosage: dosage ? parseInt(dosage, 10) : null,
      UnitID: unitID ? parseInt(unitID, 10) : null,
      UsageMealID: usageMealID ?? null,
      Priority: priority === 'สูง' ? 2 : 1,
      Frequency: frequency,
      PrePostTime: prePostMinutes,
      StartDate: startDate.toISOString().split('T')[0],
      EndDate: endDate.toISOString().split('T')[0],
      CustomValue: CustomValue || null,
      FrequencyID,
      ...defaultTimeFields,
      WeekDays: selectedWeekDays.length ? selectedWeekDays : null, // สำหรับ weekly (array of 1..7)
      MonthDays: uniqueMonthDays.length ? uniqueMonthDays : null,  // สำหรับ monthly -> ส่งเป็น array ของตัวเลขวันที่ในเดือน
      Cycle_Use_Days: cycleUseDays ? parseInt(cycleUseDays, 10) : null,
      Cycle_Rest_Days: cycleRestDays ? parseInt(cycleRestDays, 10) : null,
      OnDemand: frequency === 'on_demand' ? true : false
    };

    try {
      console.log('🔔 medicationData ->', medicationData);
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
      setIsFrequencyWithCustomTime(true);
    } else {
      setIsFrequencyWithCustomTime(false);
    }
  };

  return (
    <ScrollView style={styles.container}>
      {/* ...existing UI fields (name, group, note, type, dosage, unit) ... */}
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>กลุ่มโรค</Text>
      <Picker selectedValue={groupID} onValueChange={setGroupID} mode="dropdown">
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
      <Picker selectedValue={unitID} onValueChange={setUnitID} mode="dropdown">
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
        onValueChange={handleFrequencyChange}
        mode="dropdown"
      >
        {frequencyOptions.map((option) => (
          <Picker.Item key={option.value} label={option.label} value={option.value} />
        ))}
      </Picker>

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

      {frequency === 'monthly' && (
        <View>
          <Text style={styles.label}>เลือกวันที่ของเดือน (แตะเพื่อเลือก/ยกเลิก)</Text>
          <Calendar
            markedDates={selectedMonthDates}
            onDayPress={onMonthDayPress}
            monthFormat={'yyyy MM'}
            markingType={'simple'}
          />
          <Text style={{ marginTop: 8 }}>
            {Object.keys(selectedMonthDates).length > 0
              ? `วันที่ที่เลือก: ${Array.from(new Set(Object.keys(selectedMonthDates).map(d => new Date(d).getDate()))).sort((a,b) => a-b).join(', ')}`
              : 'ยังไม่ได้เลือกวันที่'}
          </Text>
        </View>
      )}

      {/* ...remaining UI: usage meal, pre/post time, default times, date pickers, priority, save/cancel buttons ... */}
      <Text style={styles.label}>วิธีกินยา</Text>
      <View style={styles.toggleRow}>
        {[{ label: 'พร้อมอาหาร', id: 1 }, { label: 'ก่อนอาหาร', id: 2 }, { label: 'หลังอาหาร', id: 3 }].map(opt => (
          <TouchableOpacity
            key={opt.id}
            style={[styles.toggleButton, usageMealID === opt.id && styles.toggleActive]}
            onPress={() => {
              setUsageMealID(opt.id);
              setPrePostTime(null);
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
                onPress={() => { setPrePostTime(min); setCustomTime(''); }}
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
          style={[ styles.timeButton, selectedTimeIds.includes(time.DefaultTime_ID) && styles.selected ]}
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
            if (selectedDate) setStartDate(selectedDate);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={endDate}
          mode="date"
          onChange={(e, selectedDate) => {
            setShowEndPicker(false);
            if (selectedDate) setEndDate(selectedDate);
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

// ...existing styles...
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
// ...existing code...
export default AddMedicationScreen;