<<<<<<< HEAD
import React, { useState, useEffect } from 'react';
=======

import React, { useState } from 'react';
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Button, Alert, ScrollView, Platform
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
<<<<<<< HEAD
import { BASE_URL } from './config';
=======
import moment from 'moment';
import DropDownPicker from 'react-native-dropdown-picker';

const toggleOptions = (current, setFunc, value) => {
  setFunc(current === value ? null : value);
};
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e

const AddMedicationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [groupID, setGroupID] = useState('');
  const [typeID, setTypeID] = useState(null);
  const [dosage, setDosage] = useState('');
<<<<<<< HEAD
  const [unitID, setUnitID] = useState('');
  const [usageMealID, setUsageMealID] = useState(null);
  const [priority, setPriority] = useState(null);
  const [prePostTime, setPrePostTime] = useState(null);
  const [customTime, setCustomTime] = useState('');
  const [defaultTimes, setDefaultTimes] = useState([]);
  const [selectedTimeIds, setSelectedTimeIds] = useState([]);
=======
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

<<<<<<< HEAD
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
=======
  const [mealTime, setMealTime] = useState([]);
  const toggleMeal = (meal) => {
    setMealTime(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
    );
  };

  // 🔹 Mock Data
  const [groupOpen, setGroupOpen] = useState(false);
  const [group, setGroup] = useState(null);
  const [groupItems, setGroupItems] = useState([
      { label: 'โรคเบาหวาน', value: 'โรคเบาหวาน' },
      { label: 'โรคความดัน', value: 'โรคความดัน' },
      { label: 'โรคหัวใจ', value: 'โรคหัวใจ' },
      { label: 'โรคไขมันในเลือดสูง', value: 'โรคไขมันในเลือดสูง' },
      { label: 'โรคหอบหืด', value: 'โรคหอบหืด' },
      // { label: 'เพิ่มข้อมูล', value: 'เพิ่มข้อมูล' },
  ]);

  const handleAddGroupItem = (item) => {
    if (item && !groupItems.find(i => i.value === item)) {
      const newItem = { label: item, value: item };
      setGroupItems(prev => [...prev, newItem]);
      setGroup(item); // เลือก item ที่เพิ่มทันที
    }
  };

  const [unitOpen, setUnitOpen] = useState(false);
  const [unit, setUnit] = useState(null);
  const [unitItems, setUnitItems] = useState([
    { label: 'มิลลิกรัม (mg)', value: 'มิลลิกรัม (mg)' },
    { label: 'มิลลิลิตร (mL)', value: 'มิลลิลิตร (mL)' },
    { label: 'ช้อนชา', value: 'ช้อนชา' },
    { label: 'กรัม (g)', value: 'กรัม (g)' },
    { label: 'เม็ด', value: 'เม็ด' },
    { label: 'แคปซูล', value: 'แคปซูล' },
    { label: 'ซีซี (cc)', value: 'ซีซี (cc)' },
  ]);



  const [withFoodOpen, setWithFoodOpen] = useState(false);
  const [withFood, setWithFood] = useState(null);
  const [withFoodItems] = useState([
    { label: 'ก่อนอาหาร', value: 'ก่อนอาหาร' },
    { label: 'พร้อมอาหาร', value: 'พร้อมอาหาร' },
    { label: 'หลังอาหาร', value: 'หลังอาหาร' },
  ]);

  const [timeOpen, setTimeOpen] = useState(false);
  const [time, setTime] = useState(null);
  const [timeItems, setTimeItems] = useState([
    { label: '15 นาที', value: '15 นาที' },
    { label: '30 นาที', value: '30 นาที' },
  ]);

  const handleSave = async () => {
    if (!name || !typeID || selectedTimeIds.length === 0 || !groupID) {
      Alert.alert('กรุณากรอกข้อมูลให้ครบ');
      return;
    }
<<<<<<< HEAD
    const defaultTimeFields = {};
    selectedTimeIds.forEach((id, index) => {
      defaultTimeFields[`DefaultTime_ID_${index + 1}`] = id;
    });
    const medicationData = {
      Name: name,
      Note: note,
      GroupID: parseInt(groupID),
      TypeID: typeID,
      Dosage: parseInt(dosage),
      UnitID: parseInt(unitID),
      UsageMealID: usageMealID,
      Priority: priority === 'สูง' ? 1 : 2,
      PrePostTime: prePostTime === 'custom' ? parseInt(customTime) : prePostTime,
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
=======

    const newMedication = {
      name,
      group,
      note,
      medType,
      dosage,
      unit,
      withFood,
      mealTime,
      time,
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
      Alert.alert('เพิ่มยาสำเร็จ');
      navigation.goBack();
    } catch (e) {
      console.error(e);
      Alert.alert('เกิดข้อผิดพลาด');
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

<<<<<<< HEAD
      <Text style={styles.label}>กลุ่มโรค (GroupID)</Text>
      <TextInput style={styles.input} value={groupID} onChangeText={setGroupID} keyboardType="numeric" />
=======
      <Text style={styles.label}>โรคประจำตัว</Text>
      <View style={{ zIndex: 2500 }}>
        {/* <DropDownPicker
          open={groupOpen}
          value={group}
          items={groupItems}
          setOpen={setGroupOpen}
          setValue={setGroup}
          setItems={setGroupItems}
          placeholder="เลือกโรคประจำตัว"
          listMode="MODAL"
          searchable={true}
          searchPlaceholder="ค้นหาโรคประจำตัว..."
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          labelStyle={styles.dropdownLabel}
          selectedItemLabelStyle={styles.selectedLabel}
        /> */}
      <DropDownPicker
        open={groupOpen}
        value={group}
        items={groupItems}
        setOpen={setGroupOpen}
        setValue={setGroup}
        setItems={setGroupItems}
        placeholder="เลือกหรือเพิ่มกลุ่มโรค"
        searchable={true}
        listMode="MODAL"
        addCustomItem={true}
        customItemLabel="➕ Add item"
        onAddItem={(value) => {
          if (value && !groupItems.find(i => i.value === value)) {
            const newItem = { label: value, value: value };
            setGroupItems(prev => [...prev, newItem]);
            setGroup(value);
          }
        }}
        searchPlaceholder="ค้นหากลุ่มโรค..."
        style={styles.dropdown}
        dropDownContainerStyle={styles.dropdownContainer}
        labelStyle={styles.dropdownLabel}
        selectedItemLabelStyle={styles.selectedLabel}
      />
      </View>
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e

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
<<<<<<< HEAD
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
=======
      <TextInput
        style={styles.input}
        value={dosage}
        onChangeText={setDosage}
        keyboardType="numeric"
      />

      <Text style={styles.label}>หน่วยยา</Text>
      <View style={{ zIndex: 2500 }}>
        {/* <DropDownPicker
          open={unitOpen}
          value={unit}
          items={unitItems}
          setOpen={setUnitOpen}
          setValue={setUnit}
          setItems={setUnitItems}
          placeholder="เลือกหน่วยยา"
          listMode="MODAL"
          searchable={true}
          searchPlaceholder="ค้นหาหน่วย..."
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          labelStyle={styles.dropdownLabel}
          selectedItemLabelStyle={styles.selectedLabel}
        /> */}
        {/* สามารถเพิ่มเองได้นอกเหนือจากค่าเริ่มต้น */}
        <DropDownPicker
          open={unitOpen}
          value={unit}
          items={unitItems}
          setOpen={setUnitOpen}
          setValue={setUnit}
          setItems={setUnitItems}
          placeholder="เลือกหรือเพิ่มหน่วยยา"
          searchable={true}
          listMode="MODAL"
          addCustomItem={true}
          customItemLabel="➕ เพิ่มหน่วยยา"
          onAddItem={(val) => {
            if (val && !unitItems.find(i => i.value === val)) {
              const newItem = { label: val, value: val };
              setUnitItems(prev => [...prev, newItem]);
              setUnit(val);
            }
          }}
          style={styles.dropdown}
        />
      </View>

      <Text style={styles.label}>พร้อมอาหาร</Text>
      <View style={{ zIndex: 2000 }}>
        <DropDownPicker
          open={withFoodOpen}
          value={withFood}
          items={withFoodItems}
          setOpen={setWithFoodOpen}
          setValue={setWithFood}
          placeholder="เลือกวิธีการกิน"
          listMode="MODAL"
          searchable={true}
          searchPlaceholder="ค้นหาวิธีกินยา..."
          style={styles.dropdown}
          dropDownContainerStyle={styles.dropdownContainer}
          labelStyle={styles.dropdownLabel}
          selectedItemLabelStyle={styles.selectedLabel}
        />
      </View>

            <Text style={styles.label}>ช่วงเวลา</Text>
            <View style={{ zIndex: 1500 }}>
              {/* <DropDownPicker
                open={timeOpen}
                value={time}
                items={timeItems}
                setOpen={setTimeOpen}
                setValue={setTime}
                placeholder="เลือกช่วงเวลา"
                listMode="MODAL"
                searchable={true}
                searchPlaceholder="ค้นหาเวลา..."
                style={styles.dropdown}
                dropDownContainerStyle={styles.dropdownContainer}
                labelStyle={styles.dropdownLabel}
                selectedItemLabelStyle={styles.selectedLabel}
              /> */}
              {/* เพิ่มได้นอกเหนือจากค่าเริ่มต้น */}
              <DropDownPicker
                open={timeOpen}
                value={time}
                items={timeItems}
                setOpen={setTimeOpen}
                setValue={setTime}
                setItems={setTimeItems}
                placeholder="เลือกหรือเพิ่มช่วงเวลา"
                searchable={true}
                listMode="MODAL"
                addCustomItem={true}
                customItemLabel="➕ เพิ่มช่วงเวลา"
                onAddItem={(val) => {
                  if (val && !timeItems.find(i => i.value === val)) {
                    const newItem = { label: val, value: val };
                    setTimeItems(prev => [...prev, newItem]);
                    setTime(val);
                  }
                }}
                style={styles.dropdown}
              />
            </View>

            <Text style={styles.label}>มื้ออาหาร</Text>
            <View style={styles.toggleRow}>
              {['เช้า', 'เที่ยง', 'เย็น', 'ก่อนนอน'].map(meal => (
                <TouchableOpacity
                  key={meal}
                  style={[styles.toggleButton, mealTime.includes(meal) && styles.toggleActive]}
                  onPress={() => toggleMeal(meal)}>
                  <Text>{meal}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <Text style={styles.label}>ระยะเวลา</Text>
            <View style={styles.dateRow}>
            <Text style={styles.dateLabel}>เริ่มต้น</Text>
            <TouchableOpacity
              style={styles.dateButtonGreen}
              onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateText}>{moment(startDate).format('DD MMM YY')}</Text>
            </TouchableOpacity>

            <Text style={styles.dateLabel}>สิ้นสุด</Text>
            <TouchableOpacity
              style={styles.dateButtonRed}
              onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateText}>{moment(endDate).format('DD MMM YY')}</Text>
            </TouchableOpacity>
            </View>
      
            {showStartPicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="default"
                onChange={(e, selectedDate) => {
                  setShowStartPicker(false);
                  if (selectedDate) {
                    setStartDate(selectedDate);
                    // ตรวจสอบกรณีเลือกวันเริ่มใหม่ แล้ววันสิ้นสุดเก่าน้อยกว่า → ปรับให้เท่ากัน
                    if (selectedDate > endDate) {
                      setEndDate(selectedDate);
                    }
                  }
                }}
              />
            )}

            {showEndPicker && (
              <DateTimePicker
                value={endDate}
                mode="date"
                display="default"
                minimumDate={startDate} // สำคัญ!
                onChange={(e, selectedDate) => {
                  setShowEndPicker(false);
                  if (selectedDate) setEndDate(selectedDate);
                }}
              />
            )}

      <Text style={styles.label}>ความสำคัญ</Text>
      <View style={styles.toggleRow}>
        <TouchableOpacity
        style={[
                styles.importanceButton,
                importance === 'สูง' && styles.redActive,
              ]}
          onPress={() => setImportance('สูง')}>
      <Text style={importance === 'สูง' ? styles.whiteText : styles.blackText}>สูง</Text>
        </TouchableOpacity>

      <TouchableOpacity
        style={[
                styles.importanceButton,
                importance === 'ปกติ' && styles.blueActive,
              ]}
        onPress={() => setImportance('ปกติ')}>
      <Text style={importance === 'ปกติ' ? styles.whiteText : styles.blackText}>ปกติ</Text>
      </TouchableOpacity>
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
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
<<<<<<< HEAD
  toggleActive: { backgroundColor: '#aef' },
  timeButton: {
=======
  toggleActive: {
    backgroundColor: '#90d4fbff',
  },
  dateButton: {
    backgroundColor: '#afa',
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
    padding: 10,
    backgroundColor: '#eee',
    marginVertical: 5,
    borderRadius: 8,
  },
<<<<<<< HEAD
  selected: { backgroundColor: '#aef' },
=======
  dropdown: {
    borderColor: '#ccc',
    borderRadius: 10,
    marginBottom: 10,
  },
  dropdownContainer: {
    borderColor: '#ccc',
  },
  dropdownLabel: {
    fontSize: 16,
  },
  selectedLabel: {
    fontWeight: 'bold',
    color: '#007aff',
  },

  dateRow: {
  flexDirection: 'row',
  alignItems: 'center',
  flexWrap: 'wrap',
  gap: 10,
  marginBottom: 10,
},
dateLabel: {
  fontWeight: '500',
  marginRight: 4,
},
dateButtonGreen: {
  backgroundColor: '#a3ffa3ff',
  borderRadius: 20,
  paddingVertical: 8,
  paddingHorizontal: 15,
},
dateButtonRed: {
  backgroundColor: '#f88',
  borderRadius: 20,
  paddingVertical: 8,
  paddingHorizontal: 15,
},
dateText: {
  fontWeight: 'bold',
},
importanceButton: {
  paddingVertical: 10,
  paddingHorizontal: 25,
  borderRadius: 30,
  backgroundColor: '#eee',
  marginRight: 10,
},
redActive: {
  backgroundColor: '#f44',
},
blueActive: {
  backgroundColor: '#4aa6ff',
},
whiteText: {
  color: 'white',
  fontWeight: 'bold',
},
blackText: {
  color: '#333',
},

>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
});

export default AddMedicationScreen;
