<<<<<<< HEAD
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

const StatusBadge = ({ status }) => {
  const colorMap = {
    'กินแล้ว': '#69db7c',
    'ยังไม่กิน': '#fa5252',
    'บันทึกการกิน': '#339af0',
  };
  return (
    <View style={[styles.statusBadge, { backgroundColor: colorMap[status] || '#ccc' }]}>
      <Text style={styles.statusText}>{status || 'ยังไม่กิน'}</Text>
    </View>
  );
};

const ImportanceBadge = ({ level }) => {
  const colorMap = { 'สูง': '#f03e3e', 'ปกติ': '#007aff' };
  return (
    <View style={[styles.importanceBadge, { backgroundColor: colorMap[level] || '#ccc' }]}>
      <Text style={styles.importanceText}>{level}</Text>
    </View>
  );
};

const formatHM = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
};

const HomeScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);

  const load = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    const res = await fetch(`${BASE_URL}/api/reminders/today?userId=${userId}`);
    const data = await res.json();
    // data: [{ ScheduleID, MedicationID, name, MealName, Time, PriorityLabel, Status, TypeName, Dosage, DosageType }]
    const mapped = data.map((r, i) => ({
      id: r.ScheduleID || `${r.MedicationID}-${i}`,
      scheduleId: r.ScheduleID || null,
      time: `${r.MealName} ${formatHM(r.Time)} น.`,
      name: r.name,
      dose: r.Dosage != null && r.DosageType ? `${r.Dosage} ${r.DosageType}` : '-',
      medType: r.TypeName || '-', // ประเภทยา
      importance: r.PriorityLabel || 'ปกติ',
      status: r.Status || 'ยังไม่กิน',
    }));
    setItems(mapped);
  };

  useEffect(() => { load(); }, []);

  const toggleStatus = async (item) => {
    // toggle local
    const next = item.status === 'กินแล้ว' ? 'ยังไม่กิน' : 'กินแล้ว';
    setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: next } : x));

    // call backend (ถ้าไม่มี scheduleId จะไม่ยิง)
    if (!item.scheduleId) return;
    try {
      await fetch(`${BASE_URL}/api/schedule/${item.scheduleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next })
      });
    } catch (e) {
      // ถ้า error ย้อนกลับสถานะ
      setItems(prev => prev.map(x => x.id === item.id ? { ...x, status: item.status } : x));
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.header}>รายการยาที่ต้องกิน</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('th-TH', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
        </Text>
      </View>

      {items.map((med) => (
        <View key={med.id} style={styles.card}>
          <View style={styles.rowTop}>
            <ImportanceBadge level={med.importance} />
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={styles.time}>{med.time}</Text>
              <Text style={styles.name}>{med.name}</Text>
              <Text style={styles.dose}>ประเภทยา: {med.medType}</Text>
              <Text style={styles.dose}>ขนาดยา: {med.dose}</Text>
            </View>
            <StatusBadge status={med.status} />
          </View>

          <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
            <TouchableOpacity
              style={styles.toggleBtn}
              onPress={() => toggleStatus(med)}
            >
              <Ionicons name="checkmark-done" size={18} color="#fff" />
              <Text style={{ color: '#fff', marginLeft: 6 }}>
                {med.status === 'กินแล้ว' ? 'ทำเป็นยังไม่กิน' : 'ทำเป็นกินแล้ว'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      ))}

      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MedicationListScreen')}>
          <Text style={styles.menuText}>รายการยา</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Calendar')}>
          <Text style={styles.menuText}>ปฏิทิน</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
          <Text style={styles.menuText}>สรุปประวัติการกินยา</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsScreen')}>
          <Text style={styles.menuText}>การตั้งค่า</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default HomeScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#e3f2fd', padding: 15 },
  headerBox: { backgroundColor: '#4dabf7', borderRadius: 12, marginBottom: 15, overflow: 'hidden' },
  header: { fontSize: 18, fontWeight: 'bold', textAlign: 'center', color: '#fff', paddingVertical: 10 },
  date: { backgroundColor: '#fff', paddingVertical: 10, textAlign: 'center', color: '#333' },
  card: { backgroundColor: '#fff', padding: 12, borderRadius: 10, marginBottom: 12, elevation: 2 },
  rowTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  time: { fontWeight: 'bold', fontSize: 14, color: '#333' },
  name: { fontSize: 16, fontWeight: 'bold', color: '#222' },
  dose: { color: '#666', fontSize: 14 },
  importanceBadge: { paddingVertical: 15, paddingHorizontal: 20, borderRadius: 15 },
  importanceText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  statusBadge: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 14 },
  statusText: { color: '#fff', fontWeight: 'bold', fontSize: 14 },
  toggleBtn: { backgroundColor: '#339af0', paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10, flexDirection: 'row', alignItems: 'center' },
  menu: { backgroundColor: '#4dabf7', borderRadius: 20, marginTop: 20, paddingVertical: 10 },
  menuItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 14, paddingHorizontal: 20, borderBottomWidth: 0.5, borderColor: '#ffffff50' },
  menuText: { color: '#fff', fontSize: 16, fontWeight: 'bold' },
});
=======
// หน้าหลัก
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const medications = [
  { id: 1, time: 'เช้า 7:30 น.', name: 'Metformin', dose: '1 เม็ด, ก่อนอาหาร', importance: 'สูง', status: 'กินแล้ว' },
  { id: 2, time: 'เช้า 7:30 น.', name: 'Paracetamol', dose: '1 เม็ด, หลังอาหาร', importance: 'ปกติ', status: 'กินแล้ว' },
  { id: 3, time: 'เที่ยง 11:45 น.', name: 'Metformin', dose: '1 เม็ด, ก่อนอาหาร', importance: 'สูง', status: 'ยังไม่กิน' },
  { id: 4, time: 'เย็น 17:45 น.', name: 'Metformin', dose: '1 เม็ด, ก่อนอาหาร', importance: 'สูง', status: 'บันทึกการกิน' },
];

const StatusBadge = ({ status }) => {
  const colorMap = {
        // #4caf50, #69db7c
    'กินแล้ว': '#69db7c',
    'ยังไม่กิน': '#fa5252',
    'บันทึกการกิน': '#339af0',
  };
  return (
    <View style={[styles.statusBadge, { backgroundColor: colorMap[status] || '#ccc' }]}>
      <Text style={styles.statusText}>{status}</Text>
    </View>
  );
};

const ImportanceBadge = ({ level }) => {
  const colorMap = {
    'สูง': '#f03e3e', 
    'ปกติ': '#007aff',
        // #4caf50
  };
  return (
    <View style={[styles.importanceBadge, { backgroundColor: colorMap[level] || '#ccc' }]}>
      <Text style={styles.importanceText}>{level}</Text>
    </View>
  );
};

const HomeScreen = ({ navigation }) => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.header}>รายการยาที่ต้องกิน</Text>
        <Text style={styles.date}>วันศุกร์ 15 มีนาคม 2567</Text>
      </View>

      {/* {medications.map((med) => (
        <View key={med.id} style={styles.card}>
          <View style={styles.cardRow}>
            <ImportanceBadge level={med.importance} />
            <Text style={styles.time}>{med.time}</Text>
            <StatusBadge status={med.status} />
          </View>
          <Text style={styles.name}>{med.name}</Text>
          <Text style={styles.dose}>{med.dose}</Text>
        </View>
      ))} */}

      {medications.map((med) => (
        <View key={med.id} style={styles.card}>
          <View style={styles.rowTop}>
            <ImportanceBadge level={med.importance} />
            <View style={{ flex: 1, paddingHorizontal: 10 }}>
              <Text style={styles.time}>{med.time}</Text>
              <Text style={styles.name}>{med.name}</Text>
              <Text style={styles.dose}>{med.dose}</Text>
            </View>
            <StatusBadge status={med.status} />
          </View>
        </View>
      ))}


      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MedicationList')}>
          <Text style={styles.menuText}>รายการยา</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Calendar')}>
          <Text style={styles.menuText}>ปฏิทิน</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
          <Text style={styles.menuText}>สรุปประวัติการกินยา</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Settings')}>
          <Text style={styles.menuText}>การตั้งค่า</Text>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#e3f2fd',
    padding: 15,
  },
  headerBox: {
    backgroundColor: '#4dabf7',
    borderRadius: 12,
    marginBottom: 15,
    overflow: 'hidden',
  },
  header: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#fff',
    paddingVertical: 10,
  },
  date: {
    backgroundColor: '#fff',
    paddingVertical: 10,
    textAlign: 'center',
    color: '#333',
  },
  card: {
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 2,
  },
  // cardRow: {
  //   flexDirection: 'row',
  //   justifyContent: 'space-between',
  //   alignItems: 'center',
  //   marginBottom: 6,
  // },

  rowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },

  time: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  // ชื่อยา
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  dose: {
    color: '#666',
    fontSize: 14,
  },

  // สีตรงความสำคัญ
  importanceBadge: {
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderRadius: 15,
  },
  // ข้อความระดับความสำคัญ
  importanceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  // ปุ่มการบันทึก
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  menu: {
    backgroundColor: '#4dabf7',
    borderRadius: 20,
    marginTop: 20,
    paddingVertical: 10,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderColor: '#ffffff50',
  },
  menuText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  
});

export default HomeScreen;
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
