import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Button, Alert, ScrollView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { TimerPickerModal } from "react-native-timer-picker";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { useFocusEffect } from '@react-navigation/native';

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

const AddMedicationScreen = ({ navigation, route }) => {
  const [userId, setUserId] = useState(null);
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
  const [selectedWeekDays, setSelectedWeekDays] = useState([]);
  const [cycleUseDays, setCycleUseDays] = useState('');
  const [cycleRestDays, setCycleRestDays] = useState('');
  const [selectedMonthDates, setSelectedMonthDates] = useState({});
  const [mealTime, setMealTime] = useState({});
  const [time, setTime] = useState({});
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [selectedTime, setSelectedTime] = useState(null);
  const [customFrequencyTime, setCustomFrequencyTime] = useState('');
  const [CustomValue, setCustomValue] = useState('');

  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);
  const [types, setTypes] = useState([]);

  useEffect(() => {
    const loadUserData = async () => {
      try {
        // ดึง userId จาก AsyncStorage
        const userIdStr = await AsyncStorage.getItem('userId');
        const uid = userIdStr ? parseInt(userIdStr, 10) : null;
        
        if (!uid) {
          Alert.alert('Error', 'กรุณาเข้าสู่ระบบใหม่');
          navigation.navigate('Login');
          return;
        }

        setUserId(uid);
        console.log('👤 User ID:', uid);

        // ✅ ดึง metadata และ meal times พร้อมกัน
        await Promise.all([
          fetchMetadata(),
          fetchUserMealTimes(uid)
        ]);
      } catch (error) {
        console.error('❌ Error loading user data:', error);
        Alert.alert('Error', 'ไม่สามารถโหลดข้อมูลได้');
      }
    };

    loadUserData();
  }, []);

  const extractId = (obj) => {
    if (!obj) return null;
    return obj.GroupID ?? obj.TypeID ?? obj.DosageUnitID ?? obj.UnitID ?? obj.id ?? obj.ID ?? null;
  };
  const extractLabel = (obj) => {
    if (!obj) return '';
    return obj.GroupName ?? obj.TypeName ?? obj.DosageType ?? obj.name ?? obj.Label ?? '';
  };

  const handleAddNavigation = (kind) => {
    switch (kind) {
      case 'group': return navigation.navigate('AddGroup');
      case 'type': return navigation.navigate('AddType');
      case 'unit': return navigation.navigate('AddUnit');
      default: return null;
    }
  };

  const fetchMetadata = async () => {
    try {
      const userId = await AsyncStorage.getItem('userId');
      const q = userId ? `?userId=${userId}` : '';
      const [gRes, uRes, tRes] = await Promise.all([
        fetch(`${BASE_URL}/api/groups${q}`).then(r => r.json()),
        fetch(`${BASE_URL}/api/units${q}`).then(r => r.json()),
        fetch(`${BASE_URL}/api/types${q}`).then(r => r.json()),
      ]);
      console.log('METADATA groups, units, types:', { gRes, uRes, tRes });
      setGroups(Array.isArray(gRes) ? gRes : []);
      setUnits(Array.isArray(uRes) ? uRes : []);
      setTypes(Array.isArray(tRes) ? tRes : []);
    } catch (e) {
      console.warn('fetch metadata error', e);
    }
  };

  // ✅ ฟังก์ชันดึงเวลาอาหารของ user
  const fetchUserMealTimes = async (uid) => {
    try {
      const response = await fetch(`${BASE_URL}/api/userdefaultmealtime/${uid}`);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('📥 User meal times:', data);
      
      setDefaultTimes(data);
    } catch (error) {
      console.error('❌ Error fetching user meal times:', error);
      Alert.alert('Error', 'ไม่สามารถดึงเวลาอาหารได้\n' + error.message);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchMetadata();
      if (userId) {
        fetchUserMealTimes(userId);
      }
    }, [userId])
  );

  useEffect(() => {
    if (!route || !route.params) return;
    const { newGroupId, newGroupName, newUnitId, newUnitName, newTypeId, newTypeName } = route.params;
    if (newGroupId) {
      setGroupID(String(newGroupId));
      navigation.setParams({ newGroupId: undefined, newGroupName: undefined });
    } else if (newGroupName && !newGroupId) {
      fetchMetadata().then(() => {
        const found = groups.find(g => (g.GroupName || g.name) === newGroupName);
        if (found) setGroupID(String(found.GroupID ?? found.id ?? found.GroupID));
        navigation.setParams({ newGroupName: undefined });
      });
    }
    if (newUnitId) {
      setUnitID(String(newUnitId));
      navigation.setParams({ newUnitId: undefined, newUnitName: undefined });
    }
    if (newTypeId) {
      setTypeID(parseInt(newTypeId, 10));
      navigation.setParams({ newTypeId: undefined, newTypeName: undefined });
    }
  }, [route?.params]);

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

  const onMonthDayPress = (day) => {
    const dateStr = day.dateString;
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
    if (!userId) {
      Alert.alert('กรุณาเข้าสู่ระบบก่อนเพิ่มยา');
      navigation.navigate('Login');
      return;
    }
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
        Alert.alert('โปรดเลือกจำนวน "นาที" สำหรับก่อน/หลังอาหาร (เช่น 15 หรือ 30 นาที)');
        return;
      }
    }

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

    const monthDayNumbers = Object.keys(selectedMonthDates)
      .map(d => {
        const parts = String(d).split('-');
        return parts.length >= 3 ? parseInt(parts[2], 10) : NaN;
      })
      .filter(Number.isFinite);
    const uniqueMonthDays = Array.from(new Set(monthDayNumbers)).sort((a, b) => a - b);

    const formatLocalDate = (d) => {
      if (!d) return null;
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${y}-${m}-${day}`;
    };

    const medicationData = {
      UserID: userId, // ✅ ใช้ userId จาก state
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
      StartDate: formatLocalDate(startDate),
      EndDate: formatLocalDate(endDate),
      CustomValue: CustomValue || null,
      FrequencyID,
      ...defaultTimeFields,
      WeekDays: selectedWeekDays.length ? selectedWeekDays : null,
      MonthDays: uniqueMonthDays.length ? uniqueMonthDays : null,
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
        const result = await response.json();
        const newMedicationId = result.medicationId;

        // ✅ บันทึก log เริ่มต้น
        if (newMedicationId) {
          const today = new Date().toISOString().split('T')[0];
          await fetch(`${BASE_URL}/api/medicationlog`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              medicationId: newMedicationId,
              scheduleId: null,
              date: today,
              status: 'รอกิน',
              sideEffects: null
            }),
          }).catch(err => console.warn('Log creation failed:', err));
        }

        Alert.alert('เพิ่มยาเรียบร้อย');
        navigation.replace('HomeScreen');
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
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>เพิ่มยาใหม่</Text>
        <Text style={styles.headerSubtitle}>กรุณากรอกข้อมูลยาให้ครบถ้วน</Text>
      </View>

      {/* Section: ข้อมูลพื้นฐาน */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📋 ข้อมูลพื้นฐาน</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ชื่อยา <Text style={styles.required}>*</Text></Text>
          <TextInput
            style={styles.input}
            value={name}
            onChangeText={setName}
            placeholder="ระบุชื่อยา"
            placeholderTextColor="#999"
          />
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>กลุ่มโรค <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.manageLink}
              onPress={() => navigation.navigate('ManageGroups')}
            >
              <Ionicons name="settings-outline" size={16} color="#4da6ff" />
              <Text style={styles.manageLinkText}>จัดการ</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={groupID}
              onValueChange={(v) => {
                if (v === '__add_group__') return handleAddNavigation('group');
                setGroupID(v === '' ? '' : String(v));
              }}
              style={styles.picker}
            >
              <Picker.Item label="-- เลือกกลุ่มโรค --" value="" />
              {(groups || []).map(g => {
                const id = extractId(g);
                const label = extractLabel(g) || `กลุ่ม ${id ?? ''}`;
                return <Picker.Item key={id ?? JSON.stringify(g)} label={label} value={String(id ?? '')} />;
              })}
              <Picker.Item label="+ เพิ่มกลุ่มโรคใหม่" value="__add_group__" />
            </Picker>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <View style={styles.labelRow}>
            <Text style={styles.label}>ประเภทยา <Text style={styles.required}>*</Text></Text>
            <TouchableOpacity
              style={styles.manageLink}
              onPress={() => navigation.navigate('ManageTypes')}
            >
              <Ionicons name="settings-outline" size={16} color="#4da6ff" />
              <Text style={styles.manageLinkText}>จัดการ</Text>
            </TouchableOpacity>
          </View>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={typeID !== null && typeID !== undefined ? String(typeID) : ''}
              onValueChange={(v) => {
                if (v === '__add_type__') return handleAddNavigation('type');
                if (v === '') return setTypeID(null);
                const num = Number(v);
                setTypeID(!Number.isNaN(num) ? num : v);
              }}
              style={styles.picker}
            >
              <Picker.Item label="-- เลือกประเภทยา --" value="" />
              {(types || []).map(t => {
                const id = extractId(t);
                const label = extractLabel(t) || `ประเภท ${id ?? ''}`;
                return <Picker.Item key={id ?? JSON.stringify(t)} label={label} value={String(id ?? '')} />;
              })}
              <Picker.Item label="+ เพิ่มประเภทใหม่" value="__add_type__" />
            </Picker>
          </View>
        </View>

        <View style={styles.row}>
          <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
            <Text style={styles.label}>ขนาดยา</Text>
            <TextInput
              style={styles.input}
              value={dosage}
              onChangeText={setDosage}
              keyboardType="numeric"
              placeholder="เช่น 500"
              placeholderTextColor="#999"
            />
          </View>

          <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
            <View style={styles.labelRow}>
              <Text style={styles.label}>หน่วยยา</Text>
              <TouchableOpacity
                style={styles.manageLink}
                onPress={() => navigation.navigate('ManageUnits')}
              >
                <Ionicons name="settings-outline" size={16} color="#4da6ff" />
                <Text style={styles.manageLinkText}>จัดการ</Text>
              </TouchableOpacity>
            </View>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={unitID}
                onValueChange={(v) => {
                  if (v === '__add_unit__') return handleAddNavigation('unit');
                  setUnitID(v === '' ? '' : String(v));
                }}
                style={styles.picker}
              >
                <Picker.Item label="หน่วย" value="" />
                {(units || []).map(u => {
                  const id = extractId(u);
                  const label = extractLabel(u) || `หน่วย ${id ?? ''}`;
                  return <Picker.Item key={id ?? JSON.stringify(u)} label={label} value={String(id ?? '')} />;
                })}
                <Picker.Item label="+ เพิ่ม" value="__add_unit__" />
              </Picker>
            </View>
          </View>
        </View>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>หมายเหตุเพิ่มเติม</Text>
          <TextInput
            style={[styles.input, styles.textArea]}
            value={note}
            onChangeText={setNote}
            multiline
            numberOfLines={3}
            placeholder="ระบุหมายเหตุ (ถ้ามี)"
            placeholderTextColor="#999"
          />
        </View>
      </View>

      {/* Section: ความถี่ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⏰ ความถี่การใช้ยา</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>ความถี่ <Text style={styles.required}>*</Text></Text>
          <View style={styles.pickerWrapper}>
            <Picker
              selectedValue={frequency}
              onValueChange={handleFrequencyChange}
              mode="dropdown"
              style={styles.picker}
            >
              {frequencyOptions.map((option) => (
                <Picker.Item key={option.value} label={option.label} value={option.value} />
              ))}
            </Picker>
          </View>
        </View>

        {(isFrequencyWithCustomTime) && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>กรอกจำนวน <Text style={styles.required}>*</Text></Text>
            <TextInput
              style={styles.input}
              value={CustomValue}
              onChangeText={setCustomValue}
              keyboardType="numeric"
              placeholder="กรอกจำนวน"
              placeholderTextColor="#999"
            />
          </View>
        )}

        {frequency === 'weekly' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>เลือกวันในสัปดาห์ <Text style={styles.required}>*</Text></Text>
            <View style={styles.weekDaysContainer}>
              {['จ', 'อ', 'พ', 'พฤ', 'ศ', 'ส', 'อา'].map((day, index) => (
                <TouchableOpacity
                  key={index}
                  style={[
                    styles.dayButton,
                    selectedWeekDays.includes(index + 1) && styles.dayButtonActive
                  ]}
                  onPress={() => {
                    const newSelectedDays = selectedWeekDays.includes(index + 1)
                      ? selectedWeekDays.filter(item => item !== index + 1)
                      : [...selectedWeekDays, index + 1];
                    setSelectedWeekDays(newSelectedDays);
                  }}
                >
                  <Text style={[
                    styles.dayButtonText,
                    selectedWeekDays.includes(index + 1) && styles.dayButtonTextActive
                  ]}>
                    {day}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {frequency === 'cycle' && (
          <View style={styles.row}>
            <View style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}>
              <Text style={styles.label}>วันใช้ยา <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={cycleUseDays}
                onChangeText={setCycleUseDays}
                keyboardType="numeric"
                placeholder="เช่น 7"
                placeholderTextColor="#999"
              />
            </View>

            <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
              <Text style={styles.label}>วันหยุดพัก <Text style={styles.required}>*</Text></Text>
              <TextInput
                style={styles.input}
                value={cycleRestDays}
                onChangeText={setCycleRestDays}
                keyboardType="numeric"
                placeholder="เช่น 7"
                placeholderTextColor="#999"
              />
            </View>
          </View>
        )}

        {frequency === 'monthly' && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>เลือกวันที่ของเดือน <Text style={styles.required}>*</Text></Text>
            <View style={styles.calendarContainer}>
              <Calendar
                markedDates={selectedMonthDates}
                onDayPress={onMonthDayPress}
                monthFormat={'MMMM yyyy'}
                markingType={'simple'}
                theme={{
                  todayTextColor: '#4da6ff',
                  selectedDayBackgroundColor: '#4da6ff',
                  arrowColor: '#4da6ff',
                }}
              />
            </View>
            {Object.keys(selectedMonthDates).length > 0 && (
              <View style={styles.selectedDatesInfo}>
                <Text style={styles.selectedDatesText}>
                  วันที่เลือก: {Array.from(new Set(Object.keys(selectedMonthDates).map(d => new Date(d).getDate()))).sort((a, b) => a - b).join(', ')}
                </Text>
              </View>
            )}
          </View>
        )}
      </View>

      {/* Section: วิธีใช้ยา */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💊 วิธีการใช้ยา</Text>

        <View style={styles.inputContainer}>
          <Text style={styles.label}>วิธีกินยา</Text>
          <View style={styles.toggleRow}>
            {[
              { label: 'พร้อมอาหาร', id: 1, icon: '🍽️' },
              { label: 'ก่อนอาหาร', id: 2, icon: '⏰' },
              { label: 'หลังอาหาร', id: 3, icon: '⏱️' }
            ].map(opt => (
              <TouchableOpacity
                key={opt.id}
                style={[
                  styles.usageButton,
                  usageMealID === opt.id && styles.usageButtonActive
                ]}
                onPress={() => {
                  setUsageMealID(opt.id);
                  setPrePostTime(null);
                  setCustomTime('');
                }}
              >
                <Text style={styles.usageIcon}>{opt.icon}</Text>
                <Text style={[
                  styles.usageButtonText,
                  usageMealID === opt.id && styles.usageButtonTextActive
                ]}>
                  {opt.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {(usageMealID === 2 || usageMealID === 3) && (
          <View style={styles.inputContainer}>
            <Text style={styles.label}>
              เวลา{usageMealID === 2 ? 'ก่อน' : 'หลัง'}อาหาร <Text style={styles.required}>*</Text>
            </Text>
            <View style={styles.toggleRow}>
              {[15, 30].map((min) => (
                <TouchableOpacity
                  key={min}
                  style={[
                    styles.timeOptionButton,
                    prePostTime === min && styles.timeOptionButtonActive
                  ]}
                  onPress={() => { setPrePostTime(min); setCustomTime(''); }}
                >
                  <Text style={[
                    styles.timeOptionText,
                    prePostTime === min && styles.timeOptionTextActive
                  ]}>
                    {min} นาที
                  </Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity
                style={[
                  styles.timeOptionButton,
                  prePostTime === 'custom' && styles.timeOptionButtonActive
                ]}
                onPress={() => setPrePostTime('custom')}
              >
                <Text style={[
                  styles.timeOptionText,
                  prePostTime === 'custom' && styles.timeOptionTextActive
                ]}>
                  กำหนดเอง
                </Text>
              </TouchableOpacity>
            </View>

            {prePostTime === 'custom' && (
              <TextInput
                placeholder="ระบุเวลา (นาที)"
                style={[styles.input, { marginTop: 10 }]}
                keyboardType="numeric"
                value={customTime}
                onChangeText={setCustomTime}
                placeholderTextColor="#999"
              />
            )}
          </View>
        )}

        <View style={styles.inputContainer}>
        <Text style={styles.label}>มื้อ/เวลาที่กินยา <Text style={styles.required}>*</Text></Text>
        {defaultTimes.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateText}>กำลังโหลดเวลาอาหาร...</Text>
          </View>
        ) : (
          <View style={styles.mealTimesContainer}>
            {defaultTimes.map(time => (
              <TouchableOpacity
                key={time.DefaultTime_ID}
                onPress={() => toggleTime(time.DefaultTime_ID)}
                style={[
                  styles.mealTimeButton,
                  selectedTimeIds.includes(time.DefaultTime_ID) && styles.mealTimeButtonActive
                ]}
              >
                <View style={styles.mealTimeContent}>
                  <Text style={[
                    styles.mealTimeLabel,
                    selectedTimeIds.includes(time.DefaultTime_ID) && styles.mealTimeLabelActive
                  ]}>
                    {time.MealName || convertMeal(time.MealID)}
                  </Text>
                  <Text style={[
                    styles.mealTimeTime,
                    selectedTimeIds.includes(time.DefaultTime_ID) && styles.mealTimeTimeActive
                  ]}>
                    {time.Time.slice(0, 5)}
                  </Text>
                </View>
                {selectedTimeIds.includes(time.DefaultTime_ID) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
      </View>

      {/* Section: ระยะเวลา */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📅 ระยะเวลาการใช้ยา</Text>

        <View style={styles.dateRow}>
          <View style={styles.dateItem}>
            <Text style={styles.label}>วันเริ่มต้น</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowStartPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {startDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          </View>

          <View style={styles.dateItem}>
            <Text style={styles.label}>วันสิ้นสุด</Text>
            <TouchableOpacity
              style={styles.dateButton}
              onPress={() => setShowEndPicker(true)}
            >
              <Text style={styles.dateButtonText}>
                {endDate.toLocaleDateString('th-TH', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric'
                })}
              </Text>
            </TouchableOpacity>
          </View>
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
      </View>

      {/* Section: ความสำคัญ */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>⚠️ ระดับความสำคัญ</Text>

        <View style={styles.priorityRow}>
          <TouchableOpacity
            style={[
              styles.priorityButton,
              priority === 'สูง' && styles.priorityHighActive
            ]}
            onPress={() => setPriority('สูง')}
          >
            <Text style={[
              styles.priorityButtonText,
              priority === 'สูง' && styles.priorityButtonTextActive
            ]}>
              🔴 สูง
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.priorityButton,
              priority === 'ปกติ' && styles.priorityNormalActive
            ]}
            onPress={() => setPriority('ปกติ')}
          >
            <Text style={[
              styles.priorityButtonText,
              priority === 'ปกติ' && styles.priorityButtonTextActive
            ]}>
              🟢 ปกติ
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionButtons}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
          <Text style={styles.saveButtonText}>💾 บันทึก</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}>
          <Text style={styles.cancelButtonText}>✕ ยกเลิก</Text>
        </TouchableOpacity>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  header: {
    backgroundColor: '#4da6ff',
    padding: 24,
    paddingTop: 20,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 8,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e6f2ff',
  },
  section: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 16,
    padding: 20,
    borderRadius: 16,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 3,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2c3e50',
    marginBottom: 16,
  },
  inputContainer: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#34495e',
    marginBottom: 8,
  },
  required: {
    color: '#e74c3c',
  },
  input: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: '#2c3e50',
  },
  textArea: {
    height: 80,
    textAlignVertical: 'top',
  },
  pickerWrapper: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    borderRadius: 12,
    overflow: 'hidden',
  },
  picker: {
    height: 50,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  toggleRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  usageButton: {
    flex: 1,
    minWidth: '30%',
    backgroundColor: '#f8f9fa',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  usageButtonActive: {
    backgroundColor: '#e6f2ff',
    borderColor: '#4da6ff',
  },
  usageIcon: {
    fontSize: 24,
    marginBottom: 4,
  },
  usageButtonText: {
    fontSize: 13,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  usageButtonTextActive: {
    color: '#4da6ff',
  },
  timeOptionButton: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  timeOptionButtonActive: {
    backgroundColor: '#e6f2ff',
    borderColor: '#4da6ff',
  },
  timeOptionText: {
    fontSize: 14,
    color: '#7f8c8d',
    fontWeight: '600',
  },
  timeOptionTextActive: {
    color: '#4da6ff',
  },
  weekDaysContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  dayButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dayButtonActive: {
    backgroundColor: '#4da6ff',
    borderColor: '#4da6ff',
  },
  dayButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  dayButtonTextActive: {
    color: '#fff',
  },
  calendarContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e1e8ed',
  },
  selectedDatesInfo: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#e6f2ff',
    borderRadius: 8,
  },
  selectedDatesText: {
    fontSize: 14,
    color: '#2c3e50',
  },
  mealTimesContainer: {
    gap: 10,
  },
  mealTimeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e1e8ed',
  },
  mealTimeButtonActive: {
    backgroundColor: '#e6f2ff',
    borderColor: '#4da6ff',
  },
  mealTimeContent: {
    flex: 1,
  },
  mealTimeLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#2c3e50',
    marginBottom: 4,
  },
  mealTimeLabelActive: {
    color: '#4da6ff',
  },
  mealTimeTime: {
    fontSize: 14,
    color: '#7f8c8d',
  },
  mealTimeTimeActive: {
    color: '#4da6ff',
  },
  checkmark: {
    fontSize: 20,
    color: '#4da6ff',
    fontWeight: 'bold',
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateItem: {
    flex: 1,
  },
  dateButton: {
    backgroundColor: '#f8f9fa',
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 14,
    color: '#2c3e50',
    fontWeight: '600',
  },
  priorityRow: {
    flexDirection: 'row',
    gap: 12,
  },
  priorityButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#f8f9fa',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    alignItems: 'center',
  },
  priorityHighActive: {
    backgroundColor: '#fee',
    borderColor: '#e74c3c',
  },
  priorityNormalActive: {
    backgroundColor: '#efe',
    borderColor: '#27ae60',
  },
  priorityButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#7f8c8d',
  },
  priorityButtonTextActive: {
    color: '#2c3e50',
  },
  actionButtons: {
    marginHorizontal: 16,
    marginBottom: 20,
    gap: 12,
  },
  saveButton: {
    backgroundColor: '#4da6ff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    ...Platform.select({
      ios: {
        shadowColor: '#4da6ff',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  cancelButton: {
    backgroundColor: '#fff',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e1e8ed',
  },
  cancelButtonText: {
    color: '#7f8c8d',
    fontSize: 16,
    fontWeight: '600',
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  manageLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  manageLinkText: {
    fontSize: 13,
    color: '#4da6ff',
    fontWeight: '600',
  },
  emptyState: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
  },
  emptyStateText: {
    fontSize: 14,
    color: '#7f8c8d',
  },
});

export default AddMedicationScreen;