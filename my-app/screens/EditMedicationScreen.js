import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Button, Alert, ScrollView
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Calendar } from 'react-native-calendars';
import { BASE_URL } from './config';

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

const EditMedicationScreen = ({ navigation, route }) => {
  const medId = route?.params?.medId;
  const [loading, setLoading] = useState(true);

  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [groupID, setGroupID] = useState('');
  const [typeID, setTypeID] = useState(null);
  const [dosage, setDosage] = useState('');
  const [unitID, setUnitID] = useState('');
  const [usageMealID, setUsageMealID] = useState(null);
  const [priority, setPriority] = useState('ปกติ');
  const [prePostTime, setPrePostTime] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [defaultTimes, setDefaultTimes] = useState([]);
  const [selectedTimeIds, setSelectedTimeIds] = useState([]);
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [frequency, setFrequency] = useState('every_day');
  const [isFrequencyWithCustomTime, setIsFrequencyWithCustomTime] = useState(false);
  const [selectedWeekDays, setSelectedWeekDays] = useState([]);  // 1=Mon .. 7=Sun
  const [cycleUseDays, setCycleUseDays] = useState('');
  const [cycleRestDays, setCycleRestDays] = useState('');
  const [selectedMonthDates, setSelectedMonthDates] = useState({});
  const [customValue, setCustomValue] = useState('');
  const [groups, setGroups] = useState([]);
  const [units, setUnits] = useState([]);

  useEffect(() => {
    (async () => {
      try {
        const [gRes, uRes, timesRes] = await Promise.all([
          fetch(`${BASE_URL}/api/groups`).then(r => r.json()),
          fetch(`${BASE_URL}/api/units`).then(r => r.json()),
          fetch(`${BASE_URL}/api/userdefaultmealtime`).then(r => r.json())
        ]);
        setGroups(Array.isArray(gRes) ? gRes : []);
        setUnits(Array.isArray(uRes) ? uRes : []);
        setDefaultTimes(Array.isArray(timesRes) ? timesRes : []);
      } catch (e) {
        console.warn('Failed to load metadata', e);
      }
      if (medId) await loadMedication(medId);
      setLoading(false);
    })();
  }, [medId]);

  const loadMedication = async (id) => {
    try {
      const res = await fetch(`${BASE_URL}/api/medications/${id}`);
      if (!res.ok) {
        console.warn('Failed to fetch medication', await res.text());
        return;
      }
      const data = await res.json();
      // DEBUG: ดู payload ที่ backend คืนมา
     console.log('🔍 loadMedication data:', data);

      setName(data.Name ?? '');
      setNote(data.Note ?? '');
      setGroupID(String(data.GroupID ?? ''));
      setTypeID(data.TypeID ?? null);
      setDosage(data.Dosage ? String(data.Dosage) : '');
      setUnitID(data.UnitID ? String(data.UnitID) : '');
      setUsageMealID(data.UsageMealID ?? null);
      setPriority(data.Priority ? (data.Priority === 2 ? 'สูง' : 'ปกติ') : 'ปกติ');
      setPrePostTime(data.PrePostTime ?? null);
      setCustomTime(data.PrePostTime && typeof data.PrePostTime === 'number' ? String(data.PrePostTime) : '');
      setSelectedTimeIds(Array.isArray(data.defaultTimes) ? data.defaultTimes : (data.DefaultTimeIDs ?? []));
      const defaultTimeIds = Array.isArray(data.defaultTimes) ? data.defaultTimes : (Array.isArray(data.DefaultTimeIDs) ? data.DefaultTimeIDs : []);
      setFrequency(data.Frequency ?? data.FrequencyValue ?? 'every_day');
      setCustomValue(data.CustomValue ?? '');
      setSelectedWeekDays(Array.isArray(data.WeekDays) ? data.WeekDays : []);
      if (Array.isArray(data.MonthDays)) {
        const marked = {};
        const start = data.StartDate ? new Date(data.StartDate) : new Date();
        const end = data.EndDate ? new Date(data.EndDate) : new Date(start);
        for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
          if (data.MonthDays.includes(d.getDate())) {
            marked[d.toISOString().split('T')[0]] = { selected: true, selectedColor: '#4da6ff' };
          }
        }
        setSelectedMonthDates(marked);
      } else setSelectedMonthDates({});
      setCycleUseDays(data.Cycle_Use_Days ? String(data.Cycle_Use_Days) : '');
      setCycleRestDays(data.Cycle_Rest_Days ? String(data.Cycle_Rest_Days) : '');
      if (data.StartDate) setStartDate(new Date(data.StartDate));
      if (data.EndDate) setEndDate(new Date(data.EndDate));
      setIsFrequencyWithCustomTime(['every_X_days','every_X_hours','every_X_minutes'].includes(data.Frequency ?? data.FrequencyValue));
    } catch (e) {
      console.error('Load medication error', e);
    }
  };

  const toggleTime = (id) => {
    setSelectedTimeIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const onMonthDayPress = (day) => {
    const dateStr = day.dateString;
    setSelectedMonthDates(prev => {
      const copy = { ...prev };
      if (copy[dateStr]) delete copy[dateStr];
      else copy[dateStr] = { selected: true, selectedColor: '#4da6ff' };
      return copy;
    });
  };

  const handleFrequencyChange = (value) => {
    setFrequency(value);
    setIsFrequencyWithCustomTime(['every_X_days','every_X_hours','every_X_minutes'].includes(value));
  };

  const handleSave = async () => {
    if (!name || !typeID || selectedTimeIds.length === 0 || !groupID) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
    if (frequency === 'weekly' && selectedWeekDays.length === 0) {
      Alert.alert('โปรดเลือกวันในสัปดาห์อย่างน้อย 1 วัน');
      return;
    }
    if (frequency === 'monthly' && Object.keys(selectedMonthDates).length === 0) {
      Alert.alert('โปรดเลือกวันที่ของเดือนอย่างน้อย 1 วัน');
      return;
    }
    if ((frequency === 'every_X_days' || frequency === 'every_X_hours' || frequency === 'every_X_minutes') && (!customValue || isNaN(parseInt(customValue, 10)))) {
      Alert.alert('โปรดกรอกจำนวนสำหรับความถี่แบบกำหนดเอง');
      return;
    }
    const userIdStr = await AsyncStorage.getItem('userId');
    const userId = userIdStr ? parseInt(userIdStr, 10) : null;
    if (!userId) {
      Alert.alert('กรุณาเข้าสู่ระบบก่อนแก้ไขยา');
      navigation.navigate('LoginScreen');
      return;
    }

    const defaultTimeFields = {};
    selectedTimeIds.forEach((id, index) => {
      defaultTimeFields[`DefaultTime_ID_${index + 1}`] = id;
    });

    const monthDayNumbers = Object.keys(selectedMonthDates)
      .map(d => new Date(d).getDate())
      .filter(n => Number.isFinite(n));
    const uniqueMonthDays = Array.from(new Set(monthDayNumbers)).sort((a,b) => a-b);

    const payload = {
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
      PrePostTime: (usageMealID === 2 || usageMealID === 3) ? (prePostTime === 'custom' ? parseInt(customTime, 10) : prePostTime) : null,
      StartDate: startDate.toISOString().split('T')[0],
      EndDate: endDate.toISOString().split('T')[0],
      CustomValue: customValue || null,
      ...defaultTimeFields,
      WeekDays: selectedWeekDays.length ? selectedWeekDays : null,
      MonthDays: uniqueMonthDays.length ? uniqueMonthDays : null,
      Cycle_Use_Days: cycleUseDays ? parseInt(cycleUseDays, 10) : null,
      Cycle_Rest_Days: cycleRestDays ? parseInt(cycleRestDays, 10) : null,
      OnDemand: frequency === 'on_demand' ? true : false
    };

    try {
      const res = await fetch(`${BASE_URL}/api/medications/${medId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (res.ok) {
        Alert.alert('แก้ไขข้อมูลเรียบร้อย');
        navigation.goBack();
      } else {
        const txt = await res.text();
        console.error('Edit failed', txt);
        Alert.alert('เกิดข้อผิดพลาดในการบันทึก');
      }
    } catch (e) {
      console.error('Save error', e);
      Alert.alert('เชื่อมต่อ backend ไม่ได้');
    }
  };

  if (loading) return (
    <View style={{flex:1,justifyContent:'center',alignItems:'center'}}><Text>กำลังโหลด...</Text></View>
  );

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

      <Text style={styles.label}>กลุ่มโรค</Text>
      <Picker selectedValue={groupID} onValueChange={setGroupID} mode="dropdown">
        {groups.length > 0 ? groups.map(g => (<Picker.Item key={g.GroupID} label={g.GroupName} value={String(g.GroupID)} />)) : <Picker.Item label="ไม่มีข้อมูล" value="" />}
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
      <TextInput style={styles.input} value={dosage} onChangeText={setDosage} keyboardType="numeric" />

      <Text style={styles.label}>หน่วยยา</Text>
      <Picker selectedValue={unitID} onValueChange={setUnitID} mode="dropdown">
        {units.length > 0 ? units.map(u => (<Picker.Item key={u.UnitID} label={u.DosageType} value={String(u.UnitID)} />)) : <Picker.Item label="ไม่มีข้อมูล" value="" />}
      </Picker>

      <Text style={styles.label}>ความถี่</Text>
      <Picker selectedValue={frequency} onValueChange={handleFrequencyChange} mode="dropdown">
        {frequencyOptions.map(opt => (<Picker.Item key={opt.value} label={opt.label} value={opt.value} />))}
      </Picker>

      {isFrequencyWithCustomTime && (
        <View>
          <Text style={styles.label}>กรอกจำนวน</Text>
          <TextInput style={styles.input} value={customValue} onChangeText={setCustomValue} keyboardType="numeric" placeholder="กรอกจำนวน" />
        </View>
      )}

      {frequency === 'weekly' && (
        <View>
          <Text style={styles.label}>เลือกวันในสัปดาห์</Text>
          {['จันทร์','อังคาร','พุธ','พฤหัสบดี','ศุกร์','เสาร์','อาทิตย์'].map((d,i) => (
            <TouchableOpacity key={i} style={[styles.toggleButton, selectedWeekDays.includes(i+1) && styles.toggleActive]} onPress={() => {
              const newSel = selectedWeekDays.includes(i+1) ? selectedWeekDays.filter(x => x !== i+1) : [...selectedWeekDays, i+1];
              setSelectedWeekDays(newSel);
            }}>
              <Text>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {frequency === 'monthly' && (
        <View>
          <Text style={styles.label}>เลือกวันที่ของเดือน (แตะเพื่อเลือก/ยกเลิก)</Text>
          <Calendar markedDates={selectedMonthDates} onDayPress={onMonthDayPress} markingType={'simple'} />
          <Text style={{marginTop:8}}>{Object.keys(selectedMonthDates).length > 0 ? `วันที่ที่เลือก: ${Array.from(new Set(Object.keys(selectedMonthDates).map(d=> new Date(d).getDate()))).sort((a,b)=>a-b).join(', ')}` : 'ยังไม่ได้เลือกวันที่'}</Text>
        </View>
      )}

      {frequency === 'cycle' && (
        <View>
          <Text style={styles.label}>วันใช้ยา</Text>
          <TextInput style={styles.input} value={cycleUseDays} onChangeText={setCycleUseDays} keyboardType="numeric" placeholder="กรอกจำนวนวันใช้ยา" />
          <Text style={styles.label}>วันหยุดพัก</Text>
          <TextInput style={styles.input} value={cycleRestDays} onChangeText={setCycleRestDays} keyboardType="numeric" placeholder="กรอกจำนวนวันหยุดพัก" />
        </View>
      )}

      <Text style={styles.label}>มื้อ/เวลาที่กินยา</Text>
      {defaultTimes.map(t => (
        <TouchableOpacity key={t.DefaultTime_ID} onPress={() => toggleTime(t.DefaultTime_ID)} style={[styles.timeButton, selectedTimeIds.includes(t.DefaultTime_ID) && styles.selected]}>
          <Text>{`${t.MealName || 'มื้อ'} (${t.Time?.slice?.(0,5) ?? ''})`}</Text>
        </TouchableOpacity>
      ))}

      <Text style={styles.label}>ระยะเวลา</Text>
      <View style={{flexDirection:'row',justifyContent:'space-between'}}>
        <Button title={`เริ่มต้น ${startDate.toLocaleDateString('th-TH')}`} onPress={() => setShowStartPicker(true)} />
        <Button title={`สิ้นสุด ${endDate.toLocaleDateString('th-TH')}`} onPress={() => setShowEndPicker(true)} />
      </View>

      {showStartPicker && (
        <DateTimePicker value={startDate} mode="date" onChange={(e, sd) => { setShowStartPicker(false); if (sd) setStartDate(sd); }} />
      )}
      {showEndPicker && (
        <DateTimePicker value={endDate} mode="date" onChange={(e, ed) => { setShowEndPicker(false); if (ed) setEndDate(ed); }} />
      )}

      <Text style={styles.sectionLabel}>ความสำคัญ</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity style={[styles.priorityButton, priority === 'สูง' && styles.priorityHigh]} onPress={() => setPriority('สูง')}><Text style={styles.priorityText}>สูง</Text></TouchableOpacity>
        <TouchableOpacity style={[styles.priorityButton, priority === 'ปกติ' && styles.priorityNormal]} onPress={() => setPriority('ปกติ')}><Text style={styles.priorityText}>ปกติ</Text></TouchableOpacity>
      </View>

      <View style={{marginTop:20}}>
        <TouchableOpacity style={styles.saveButton} onPress={handleSave}><Text style={styles.saveText}>บันทึกการแก้ไข</Text></TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => navigation.goBack()}><Text style={styles.cancelText}>ยกเลิก</Text></TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { padding: 18, backgroundColor: '#fff', flex: 1 },
  label: { fontWeight: 'bold', marginBottom: 6, marginTop: 12 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 10, marginBottom: 10 },
  toggleRow: { flexDirection: 'row', flexWrap: 'wrap' },
  toggleButton: { padding: 10, borderRadius: 20, backgroundColor: '#eee', marginRight: 8, marginBottom: 8 },
  toggleActive: { backgroundColor: '#aef' },
  timeButton: { padding: 10, backgroundColor: '#eee', marginVertical: 6, borderRadius: 8 },
  selected: { backgroundColor: '#aef' },
  saveButton: { backgroundColor: '#4da6ff', padding: 14, borderRadius: 20, alignItems: 'center' },
  saveText: { color: '#fff', fontWeight: 'bold' },
  cancelButton: { marginTop: 10, padding: 12, borderRadius: 20, backgroundColor: '#ccc', alignItems: 'center' },
  cancelText: { color: '#000' },
  sectionLabel: { fontWeight: 'bold', marginTop: 12, marginBottom: 8 },
  priorityButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4 },
  priorityHigh: { backgroundColor: '#f44336' },
  priorityNormal: { backgroundColor: '#4CAF50' },
  priorityText: { color: '#000', fontWeight: 'bold' },
});

export default EditMedicationScreen;