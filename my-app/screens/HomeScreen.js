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
