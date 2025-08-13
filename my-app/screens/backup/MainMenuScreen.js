// import React from 'react';
// import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';

// const MainMenuScreen = ({ navigation }) => {
//   const menus = [
//     { label: 'รายการยา', screen: 'MedicationList', icon: 'medkit-outline' },
//     { label: 'ปฏิทิน', screen: 'Calendar', icon: 'calendar-outline' },
//     { label: 'สรุปประวัติการกินยา', screen: 'HistorySummary', icon: 'document-text-outline' },
//     { label: 'การตั้งค่า', screen: 'Settings', icon: 'settings-outline' },
//   ];

//   return (
//     <View style={styles.container}>
//       <Text style={styles.title}>เมนูหลัก</Text>
//       <View style={styles.cardContainer}>
//         {menus.map((menu, index) => (
//           <TouchableOpacity
//             key={index}
//             style={styles.menuItem}
//             onPress={() => navigation.navigate(menu.screen)}
//           >
//             <View style={styles.iconWrapper}>
//               <Ionicons name={menu.icon} size={22} color="#3399ff" />
//             </View>
//             <Text style={styles.menuText}>{menu.label}</Text>
//             <Ionicons name="chevron-forward-outline" size={20} color="#888" />
//           </TouchableOpacity>
//         ))}
//       </View>
//     </View>
//   );
// };

// export default MainMenuScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#e6f0ff',
//     padding: 20,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     marginBottom: 16,
//     textAlign: 'center',
//     color: '#1e90ff',
//   },
//   cardContainer: {
//     backgroundColor: '#fff',
//     borderRadius: 12,
//     paddingVertical: 10,
//     paddingHorizontal: 12,
//     shadowColor: '#000',
//     elevation: 2,
//   },
//   menuItem: {
//     flexDirection: 'row',
//     alignItems: 'center',
//     paddingVertical: 14,
//     borderBottomWidth: 1,
//     borderBottomColor: '#ddd',
//   },
//   iconWrapper: {
//     width: 32,
//     alignItems: 'center',
//     marginRight: 14,
//   },
//   menuText: {
//     flex: 1,
//     fontSize: 16,
//     color: '#333',
//   },
// });

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
  {
    id: 1,
    time: 'เช้า 7:30 น.',
    name: 'Metformin',
    dose: '1 เม็ด, ก่อนอาหาร',
    importance: 'สูง',
    status: 'กินแล้ว',
  },
  {
    id: 2,
    time: 'เช้า 7:30 น.',
    name: 'Paracetamol',
    dose: '1 เม็ด, หลังอาหาร',
    importance: 'ปกติ',
    status: 'กินแล้ว',
  },
  {
    id: 3,
    time: 'เที่ยง 11:45 น.',
    name: 'Metformin',
    dose: '1 เม็ด, ก่อนอาหาร',
    importance: 'สูง',
    status: 'บันทึกการกิน',
  },
  {
    id: 4,
    time: 'เย็น 17:45 น.',
    name: 'Metformin',
    dose: '1 เม็ด, ก่อนอาหาร',
    importance: 'สูง',
    status: 'ยังไม่กิน',
  },
];

const StatusBadge = ({ status }) => {
  const colorMap = {
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
    'ปกติ': '#4caf50',
  };
  return (
    <View style={[styles.importanceBadge, { backgroundColor: colorMap[level] || '#ccc' }]}>
      <Text style={styles.importanceText}>{level}</Text>
    </View>
  );
};

const HomeScreen = () => {
  return (
    <ScrollView style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.header}>รายการยาที่ต้องกิน</Text>
        <Text style={styles.date}>วันศุกร์ 15 มีนาคม 2567</Text>
      </View>

      {medications.map((med) => (
        <View key={med.id} style={styles.card}>
          <View style={styles.cardRow}>
            <ImportanceBadge level={med.importance} />
            <Text style={styles.time}>{med.time}</Text>
            <StatusBadge status={med.status} />
          </View>
          <Text style={styles.name}>{med.name}</Text>
          <Text style={styles.dose}>{med.dose}</Text>
        </View>
      ))}

      <View style={styles.menu}>
        {['รายการยา', 'ปฏิทิน', 'สรุปประวัติการกินยา', 'การตั้งค่า'].map((menu, index) => (
          <TouchableOpacity key={index} style={styles.menuItem}>
            <Text style={styles.menuText}>{menu}</Text>
            <Ionicons name="chevron-forward" size={20} color="#fff" />
          </TouchableOpacity>
        ))}
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
    paddingVertical: 6,
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
  cardRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  time: {
    fontWeight: 'bold',
    fontSize: 14,
    color: '#333',
  },
  name: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
  },
  dose: {
    color: '#666',
    fontSize: 14,
  },
  importanceBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  importanceText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
  statusBadge: {
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 14,
  },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
