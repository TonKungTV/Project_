
import React, { useState } from 'react';
import {
  View, Text, TextInput, StyleSheet, TouchableOpacity,
  Button, Alert, ScrollView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import moment from 'moment';
import DropDownPicker from 'react-native-dropdown-picker';

const toggleOptions = (current, setFunc, value) => {
  setFunc(current === value ? null : value);
};

const AddMedicationScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [note, setNote] = useState('');
  const [medType, setMedType] = useState(null);
  const [dosage, setDosage] = useState('');
  const [startDate, setStartDate] = useState(new Date());
  const [endDate, setEndDate] = useState(new Date());
  const [importance, setImportance] = useState(null);
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const [mealTime, setMealTime] = useState([]);
  const toggleMeal = (meal) => {
    setMealTime(prev =>
      prev.includes(meal) ? prev.filter(m => m !== meal) : [...prev, meal]
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
    }
  };

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.label}>ชื่อยา</Text>
      <TextInput style={styles.input} value={name} onChangeText={setName} />

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
    backgroundColor: '#90d4fbff',
  },
  dateButton: {
    backgroundColor: '#afa',
    padding: 10,
    borderRadius: 8,
  },
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

});

export default AddMedicationScreen;
