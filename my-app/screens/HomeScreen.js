// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   StyleSheet,
//   ScrollView,
//   TouchableOpacity,
//   Modal, // ✅ เพิ่ม Modal
//   Button, // ✅ เพิ่ม Button
// } from 'react-native';
// import { Ionicons } from '@expo/vector-icons';
// import AsyncStorage from '@react-native-async-storage/async-storage';
// import { BASE_URL } from './config';

// // ✅ สร้าง Component สำหรับแสดงสถานะ (กินแล้ว, ยังไม่กิน, บันทึกการกิน)
// const StatusBadge = ({ status }) => {
//   const colorMap = {
//     'กินแล้ว': '#69db7c',  // สีเขียวเมื่อบันทึกการกินแล้ว
//     'ยังไม่กิน': '#fa5252',  // สีแดงเมื่อยังไม่บันทึกการกิน
//     'บันทึกการกิน': '#339af0',  // สีน้ำเงินเมื่อเป็นบันทึกการกิน
//   };
//   return (
//     <View style={[styles.statusBadge, { backgroundColor: colorMap[status] || '#ccc' }]}>
//       <Text style={styles.statusText}>{status || 'ยังไม่กิน'}</Text>
//     </View>
//   );
// };

// // ✅ สร้าง Component สำหรับแสดงความสำคัญ (สูง, ปกติ)
// const ImportanceBadge = ({ level }) => {
//   const colorMap = { 'สูง': '#f03e3e', 'ปกติ': '#007aff' };
//   return (
//     <View style={[styles.importanceBadge, { backgroundColor: colorMap[level] || '#ccc' }]}>
//       <Text style={styles.importanceText}>{level}</Text>
//     </View>
//   );
// };

// // ✅ ฟังก์ชันแปลงเวลาเป็นรูปแบบชั่วโมงและนาที
// const formatHM = (timeStr) => {
//   if (!timeStr) return '';
//   const [h, m] = timeStr.split(':');
//   return `${h}:${m}`;
// };

// const HomeScreen = ({ navigation }) => {
//   const [items, setItems] = useState([]);
//   const [modalVisible, setModalVisible] = useState(false);  // ✅ สถานะการแสดงผลของ Modal
//   const [selectedItem, setSelectedItem] = useState(null);  // ✅ ตัวแปรเก็บข้อมูลยาเมื่อเลือกจากรายการ

//   const load = async () => {
//     const userId = await AsyncStorage.getItem('userId');
//     if (!userId) return;

//     const res = await fetch(`${BASE_URL}/api/reminders/today?userId=${userId}`);
//     const data = await res.json();
//     const mapped = data.map((r, i) => ({
//       id: r.ScheduleID || `${r.MedicationID}-${i}`,
//       scheduleId: r.ScheduleID || null,
//       time: `${r.MealName} ${formatHM(r.Time)} น.`,
//       name: r.name,
//       dose: r.Dosage != null && r.DosageType ? `${r.Dosage} ${r.DosageType}` : '-',
//       medType: r.TypeName || '-', // ประเภทยา
//       importance: r.PriorityLabel || 'ปกติ',
//       status: r.Status || 'ยังไม่กิน',
//     }));
//     setItems(mapped);
//   };

//   useEffect(() => {
//     load();
//   }, []);

//   const toggleStatus = async (item) => {
//     // toggle local
//     const next = item.status === 'กินแล้ว' ? 'ยังไม่กิน' : 'กินแล้ว';
//     setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: next } : x)));

//     // call backend (ถ้าไม่มี scheduleId จะไม่ยิง)
//     if (!item.scheduleId) return;
//     try {
//       await fetch(`${BASE_URL}/api/schedule/${item.scheduleId}/status`, {
//         method: 'PATCH',
//         headers: { 'Content-Type': 'application/json' },
//         body: JSON.stringify({ status: next }),
//       });
//     } catch (e) {
//       // ถ้า error ย้อนกลับสถานะ
//       setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: item.status } : x)));
//     }
//   };

//   // ✅ ฟังก์ชันเปิด Modal เพื่อยืนยันการกินยา
//   const openModal = (item) => {
//     setSelectedItem(item);
//     setModalVisible(true);
//   };

//   // ✅ ฟังก์ชันปิด Modal
//   const closeModal = () => {
//     setModalVisible(false);
//     setSelectedItem(null);
//   };

//   // ✅ ฟังก์ชันยืนยันการกินยา
//   const confirmConsumption = () => {
//     // Save status update
//     toggleStatus(selectedItem);
//     closeModal();
//   };

//   return (
//     <ScrollView style={styles.container}>
//       <View style={styles.headerBox}>
//         <Text style={styles.header}>รายการยาที่ต้องกิน</Text>
//         <Text style={styles.date}>
//           {new Date().toLocaleDateString('th-TH', {
//             weekday: 'long',
//             day: 'numeric',
//             month: 'long',
//             year: 'numeric',
//           })}
//         </Text>
//       </View>

//       {items.map((med) => (
//         <View key={med.id} style={styles.card}>
//           <View style={styles.rowTop}>
//             <ImportanceBadge level={med.importance} />
//             <View style={{ flex: 1, paddingHorizontal: 10 }}>
//               <Text style={styles.time}>{med.time}</Text>
//               <Text style={styles.name}>{med.name}</Text>
//               <Text style={styles.dose}>ประเภทยา: {med.medType}</Text>
//               <Text style={styles.dose}>ขนาดยา: {med.dose}</Text>
              
//             </View>
//             <StatusBadge status={med.status} />
//           </View>

//           <View style={{ marginTop: 10, flexDirection: 'row', justifyContent: 'flex-end' }}>
//             <TouchableOpacity
//               style={styles.toggleBtn}
//               onPress={() => openModal(med)} // ✅ เปิด modal สำหรับยืนยันการกินยา
//             >
//               {/* <Ionicons name="checkmark-done" size={18} color="#fff" />
//               <Text style={{ color: '#fff', marginLeft: 6 }}>
//                 {med.status === 'กินแล้ว' ? 'ทำเป็นยังไม่กิน' : 'ทำเป็นกินแล้ว'}
//               </Text> */}
//             </TouchableOpacity>
//           </View>
//         </View>
//       ))}

//       {/* Modal for Confirming the Medication Consumption */}
//       <Modal visible={modalVisible} animationType="slide" transparent={true}>
//         <View style={styles.modalBackground}>
//           <View style={styles.modalContent}>
//             <Text style={styles.modalTitle}>{selectedItem?.name}</Text>
//             <Text>วันที่: {selectedItem?.time}</Text>
//             <Text>ขนาดยา: {selectedItem?.dose}</Text>
//             <Text>ประเภทยา: {selectedItem?.medType}</Text>


//             <View style={styles.modalButtonRow}>
//               <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
//                 <Text style={styles.cancelText}>ยกเลิก</Text>
//               </TouchableOpacity>
//               <TouchableOpacity style={styles.confirmBtn} onPress={confirmConsumption}>
//                 <Text style={styles.confirmText}>ทานยาแล้ว</Text>
//               </TouchableOpacity>
//             </View>
//           </View>
//         </View>
//       </Modal>

//       <View style={styles.menu}>
//         <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MedicationListScreen')}>
//           <Text style={styles.menuText}>รายการยา</Text>
//           <Ionicons name="chevron-forward" size={20} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Calendar')}>
//           <Text style={styles.menuText}>ปฏิทิน</Text>
//           <Ionicons name="chevron-forward" size={20} color="#fff" />
//         </TouchableOpacity> 
//         <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
//           <Text style={styles.menuText}>สรุปประวัติการกินยา</Text>
//           <Ionicons name="chevron-forward" size={20} color="#fff" />
//         </TouchableOpacity>
//         <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsScreen')}>
//           <Text style={styles.menuText}>การตั้งค่า</Text>
//           <Ionicons name="chevron-forward" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View>

//       {/* <View style={styles.menu1}>
//         <TouchableOpacity style={styles.menuItem1} onPress={() => navigation.navigate('Calendar')}>
//           <Text style={styles.menuText}>ปฏิทิน</Text>
//           <Ionicons name="chevron-forward" size={20} color="#fff" />
//         </TouchableOpacity>
//       </View> */}
//     </ScrollView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { 
//     flex: 1, 
//     backgroundColor: '#e3f2fd', 
//     padding: 15 },

//   headerBox: { 
//     backgroundColor: '#4dabf7', 
//     borderRadius: 12, 
//     marginBottom: 15, 
//     overflow: 'hidden' },
    
//   header: { 
//     fontSize: 18, 
//     fontWeight: 'bold', 
//     textAlign: 'center', 
//     color: '#fff', 
//     paddingVertical: 10 },

//   date: { 
//     backgroundColor: '#fff', 
//     paddingVertical: 10, 
//     textAlign: 'center',
//     color: '#333' },

//   card: { 
//     backgroundColor: '#fff', 
//     padding: 12, 
//     borderRadius: 10, 
//     marginBottom: 12, 
//     elevation: 2 },

//   rowTop: { 
//     flexDirection: 'row', 
//     alignItems: 'center', 
//     justifyContent: 'space-between' },

//   time: { 
//     fontWeight: 'bold',
//     fontSize: 14, 
//     color: '#333' },

//   name: { 
//     fontSize: 16, 
//     fontWeight: 'bold', 
//     color: '#222' },

//   dose: { 
//     color: '#666', 
//     fontSize: 14 },

//   importanceBadge: { 
//     paddingVertical: 15, 
//     paddingHorizontal: 20, 
//     borderRadius: 15 },

//   importanceText: { 
//     color: '#fff', 
//     fontWeight: 'bold', 
//     fontSize: 14 },

//   statusBadge: { 
//     paddingVertical: 6, 
//     paddingHorizontal: 10, 
//     borderRadius: 14 },

//   statusText: { 
//     color: '#fff', 
//     fontWeight: 'bold', 
//     fontSize: 14 },

//   toggleBtn: { 
//     backgroundColor: '#339af0', 
//     paddingVertical: 8, 
//     paddingHorizontal: 12, 
//     borderRadius: 10, 
//     flexDirection: 'row', 
//     alignItems: 'center' },

//   modalBackground: { 
//     flex: 1, 
//     justifyContent: 'center', 
//     alignItems: 'center', 
//     backgroundColor: 'rgba(0,0,0,0.5)' },

//   modalContent: { 
//     backgroundColor: '#fff', 
//     padding: 20, 
//     borderRadius: 10, 
//     alignItems: 'center' },

//   modalTitle: { 
//     fontSize: 18, 
//     fontWeight: 'bold', 
//     marginBottom: 10 },

//   modalButtonRow: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between',
//      width: '80%', 
//      marginTop: 15 },

//   cancelBtn: { 
//     backgroundColor: '#ccc', 
//     padding: 10, 
//     borderRadius: 10 },

//   confirmBtn: { 
//     backgroundColor: '#4dabf7', 
//     padding: 10, 
//     borderRadius: 10 },

//   cancelText: { 
//     color: '#fff' },

//   confirmText: { 
//     color: '#fff' },

//   menu: { 
//     backgroundColor: '#4dabf7', 
//     borderRadius: 10, 
//     marginTop: 20, 
//     paddingVertical: 5 },

//     // menu1: { 
//     // backgroundColor: '#4dabf7', 
//     // borderRadius: 10, 
//     // marginTop: 20, 
//     // paddingVertical: 5 },

//   menuItem: { 
//     flexDirection: 'row', 
//     justifyContent: 'space-between', 
//     alignItems: 'center', 
//     paddingVertical: 14, 
//     paddingHorizontal: 20, 
//     borderBottomWidth: 0.5, 
//     borderColor: '#ffffff50' },

//     // menuItem1: { 
//     // flexDirection: 'row', 
//     // justifyContent: 'space-between', 
//     // alignItems: 'center', 
//     // paddingVertical: 14, 
//     // paddingHorizontal: 20, 
//     // borderBottomWidth: 0.5, 
//     // borderColor: '#ffffff50' },

//     // menuItem2: { 
//     // flexDirection: 'row', 
//     // justifyContent: 'space-between', 
//     // alignItems: 'center', 
//     // paddingVertical: 14, 
//     // paddingHorizontal: 20, 
//     // borderBottomWidth: 0.5, 
//     // borderColor: '#ffffff50' },

//     // menuItem3: { 
//     // flexDirection: 'row', 
//     // justifyContent: 'space-between', 
//     // alignItems: 'center', 
//     // paddingVertical: 14, 
//     // paddingHorizontal: 20, 
//     // borderBottomWidth: 0.5, 
//     // borderColor: '#ffffff50' },

//   menuText: { 
//     color: '#fff', 
//     fontSize: 16, 
//     fontWeight: 'bold' },
  
// });

// export default HomeScreen;


import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

// ✅ Component สำหรับแสดงสถานะ (กินแล้ว, ยังไม่กิน, บันทึกการกิน)
const StatusBadge = ({ status, onPress }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'กินแล้ว':
        return { color: '#28a745', icon: 'checkmark-circle', text: 'กินแล้ว' };
      case 'ยังไม่กิน':
        return { color: '#dc3545', icon: 'close-circle', text: 'ยังไม่กิน' };
      default:
        return { color: '#6c757d', icon: 'time', text: 'ยังไม่กิน' };
    }
  };

  const config = getStatusConfig(status);
  
  return (
    <TouchableOpacity 
      style={[styles.statusBadge, { backgroundColor: config.color }]}
      onPress={onPress}
    >
      <Ionicons name={config.icon} size={16} color="#fff" />
      <Text style={styles.statusText}>{config.text}</Text>
    </TouchableOpacity>
  );
};

// ✅ Component สำหรับแสดงความสำคัญ
const ImportanceBadge = ({ level }) => {
  const colorMap = { 'สูง': '#f03e3e', 'ปกติ': '#007aff' };
  return (
    <View style={[styles.importanceBadge, { backgroundColor: colorMap[level] || '#ccc' }]}>
      <Text style={styles.importanceText}>{level}</Text>
    </View>
  );
};

// ✅ Component สำหรับแสดงหัวข้อช่วงเวลา
const TimeSection = ({ title, count, icon }) => (
  <View style={styles.timeSectionHeader}>
    <View style={styles.timeSectionLeft}>
      <Ionicons name={icon} size={24} color="#4dabf7" />
      <Text style={styles.timeSectionTitle}>{title}</Text>
    </View>
    <View style={styles.medicationCount}>
      <Text style={styles.medicationCountText}>{count} รายการ</Text>
    </View>
  </View>
);

// ✅ ฟังก์ชันแปลงเวลาเป็นรูปแบบชั่วโมงและนาที
const formatHM = (timeStr) => {
  if (!timeStr) return '';
  const [h, m] = timeStr.split(':');
  return `${h}:${m}`;
};

// ✅ ฟังก์ชันจัดกลุ่มยาตามช่วงเวลา
const groupMedicationsByTime = (items) => {
  const groups = {
    morning: { title: 'เช้า (06:00 - 11:59)', items: [], icon: 'sunny' },
    afternoon: { title: 'กลางวัน (12:00 - 17:59)', items: [], icon: 'partly-sunny' },
    evening: { title: 'เย็น (18:00 - 20:59)', items: [], icon: 'moon' },
    night: { title: 'ก่อนนอน (21:00 - 05:59)', items: [], icon: 'bed' }
  };

  items.forEach(item => {
    // สมมติว่า item.rawTime มีเวลาในรูปแบบ "HH:MM"
    const timeStr = item.rawTime || '12:00';
    const hour = parseInt(timeStr.split(':')[0]);
    
    if (hour >= 6 && hour < 12) {
      groups.morning.items.push(item);
    } else if (hour >= 12 && hour < 18) {
      groups.afternoon.items.push(item);
    } else if (hour >= 18 && hour < 21) {
      groups.evening.items.push(item);
    } else {
      groups.night.items.push(item);
    }
  });

  return groups;
};

const HomeScreen = ({ navigation }) => {
  const [items, setItems] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  const load = async () => {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) return;

    try {
      const res = await fetch(`${BASE_URL}/api/reminders/today?userId=${userId}`);
      const data = await res.json();
      const mapped = data.map((r, i) => ({
        id: r.ScheduleID || `${r.MedicationID}-${i}`,
        scheduleId: r.ScheduleID || null,
        time: `${r.MealName} ${formatHM(r.Time)} น.`,
        rawTime: r.Time, // เก็บเวลาดิบไว้สำหรับจัดกลุ่ม
        name: r.name,
        dose: r.Dosage != null && r.DosageType ? `${r.Dosage} ${r.DosageType}` : '-',
        medType: r.TypeName || '-',
        importance: r.PriorityLabel || 'ปกติ',
        status: r.Status || 'ยังไม่กิน',
      }));
      setItems(mapped);
    } catch (error) {
      console.error('Error loading medications:', error);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const toggleStatus = async (item) => {
    const next = item.status === 'กินแล้ว' ? 'ยังไม่กิน' : 'กินแล้ว';
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: next } : x)));

    if (!item.scheduleId) return;
    try {
      await fetch(`${BASE_URL}/api/schedule/${item.scheduleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: next }),
      });
    } catch (e) {
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: item.status } : x)));
      console.error('Error updating status:', e);
    }
  };

  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
  };

  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
  };

  const confirmConsumption = () => {
    if (selectedItem) {
      toggleStatus(selectedItem);
    }
    closeModal();
  };

  const medicationGroups = groupMedicationsByTime(items);

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.headerBox}>
        <Text style={styles.header}>รายการยาที่ต้องกิน</Text>
        <Text style={styles.date}>
          {new Date().toLocaleDateString('th-TH', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric',
          })}
        </Text>
      </View>

      {/* สรุปรายการยาทั้งหมด */}
      <View style={styles.summaryCard}>
        <Text style={styles.summaryTitle}>สรุปวันนี้</Text>
        <View style={styles.summaryRow}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryNumber}>{items.length}</Text>
            <Text style={styles.summaryLabel}>ทั้งหมด</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#28a745' }]}>
              {items.filter(item => item.status === 'กินแล้ว').length}
            </Text>
            <Text style={styles.summaryLabel}>กินแล้ว</Text>
          </View>
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryNumber, { color: '#dc3545' }]}>
              {items.filter(item => item.status === 'ยังไม่กิน').length}
            </Text>
            <Text style={styles.summaryLabel}>ยังไม่กิน</Text>
          </View>
        </View>
      </View>

      {/* รายการยาแบ่งตามช่วงเวลา */}
      {Object.entries(medicationGroups).map(([key, group]) => {
        if (group.items.length === 0) return null;
        
        return (
          <View key={key} style={styles.timeGroup}>
            <TimeSection 
              title={group.title} 
              count={group.items.length} 
              icon={group.icon}
            />
            
            {group.items.map((med) => (
              <View key={med.id} style={styles.card}>
                <View style={styles.cardHeader}>
                  <ImportanceBadge level={med.importance} />
                  <StatusBadge 
                    status={med.status} 
                    onPress={() => openModal(med)}
                  />
                </View>
                
                <View style={styles.cardContent}>
                  <Text style={styles.time}>{med.time}</Text>
                  <Text style={styles.name}>{med.name}</Text>
                  <View style={styles.detailsRow}>
                    <Text style={styles.dose}>ประเภทยา: {med.medType}</Text>
                    <Text style={styles.dose}>ขนาดยา: {med.dose}</Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.recordButton}
                  onPress={() => openModal(med)}
                >
                  <Ionicons name="create" size={16} color="#4dabf7" />
                  <Text style={styles.recordButtonText}>บันทึกการกิน</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        );
      })}

      {/* Modal สำหรับยืนยันการกินยา */}
      <Modal visible={modalVisible} animationType="slide" transparent={true}>
        <View style={styles.modalBackground}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Ionicons name="medical" size={30} color="#4dabf7" />
              <Text style={styles.modalTitle}>บันทึกการกินยา</Text>
            </View>
            
            {selectedItem && (
              <>
                <View style={styles.modalInfo}>
                  <Text style={styles.modalMedName}>{selectedItem.name}</Text>
                  <Text style={styles.modalDetail}>เวลา: {selectedItem.time}</Text>
                  <Text style={styles.modalDetail}>ขนาดยา: {selectedItem.dose}</Text>
                  <Text style={styles.modalDetail}>ประเภทยา: {selectedItem.medType}</Text>
                </View>

                <View style={styles.modalButtonRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                    <Text style={styles.cancelText}>ยกเลิก</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={confirmConsumption}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.confirmText}>
                      {selectedItem.status === 'กินแล้ว' ? 'ทำเป็นยังไม่กิน' : 'ทานยาแล้ว'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* เมนูด้านล่าง */}
      <View style={styles.menu}>
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('MedicationListScreen')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="medical" size={20} color="#fff" />
            <Text style={styles.menuText}>รายการยา</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('Calendar')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="calendar" size={20} color="#fff" />
            <Text style={styles.menuText}>ปฏิทิน</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('History')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="stats-chart" size={20} color="#fff" />
            <Text style={styles.menuText}>สรุปประวัติการกินยา</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity style={styles.menuItem} onPress={() => navigation.navigate('SettingsScreen')}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="settings" size={20} color="#fff" />
            <Text style={styles.menuText}>การตั้งค่า</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#fff" />
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#f8f9fa', 
    padding: 15 
  },

  headerBox: { 
    backgroundColor: '#4dabf7', 
    borderRadius: 16, 
    marginBottom: 15, 
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
    
  header: { 
    fontSize: 20, 
    fontWeight: 'bold', 
    textAlign: 'center', 
    color: '#fff', 
    paddingVertical: 15 
  },

  date: { 
    backgroundColor: '#fff', 
    paddingVertical: 12, 
    textAlign: 'center',
    color: '#333',
    fontSize: 16,
  },

  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  summaryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 12,
    textAlign: 'center',
  },

  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },

  summaryItem: {
    alignItems: 'center',
  },

  summaryNumber: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4dabf7',
  },

  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
  },

  timeGroup: {
    marginBottom: 24,
  },

  timeSectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    marginBottom: 8,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },

  timeSectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },

  timeSectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },

  medicationCount: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },

  medicationCountText: {
    fontSize: 12,
    color: '#4dabf7',
    fontWeight: '600',
  },

  card: { 
    backgroundColor: '#fff', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 8, 
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    marginLeft: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4dabf7',
  },

  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },

  cardContent: {
    marginBottom: 12,
  },

  time: { 
    fontSize: 14, 
    color: '#666',
    marginBottom: 4,
  },

  name: { 
    fontSize: 18, 
    fontWeight: 'bold', 
    color: '#222',
    marginBottom: 8,
  },

  detailsRow: {
    gap: 4,
  },

  dose: { 
    color: '#666', 
    fontSize: 14,
    marginBottom: 2,
  },

  importanceBadge: { 
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 16,
  },

  importanceText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 12,
  },

  statusBadge: { 
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6, 
    paddingHorizontal: 12, 
    borderRadius: 16,
    gap: 4,
  },

  statusText: { 
    color: '#fff', 
    fontWeight: 'bold', 
    fontSize: 12,
  },

  recordButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#e3f2fd',
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },

  recordButtonText: {
    color: '#4dabf7',
    fontWeight: '600',
    fontSize: 14,
  },

  modalBackground: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: 'rgba(0,0,0,0.5)',
  },

  modalContent: { 
    backgroundColor: '#fff', 
    padding: 24, 
    borderRadius: 16, 
    width: '85%',
    maxWidth: 400,
  },

  modalHeader: {
    alignItems: 'center',
    marginBottom: 20,
  },

  modalTitle: { 
    fontSize: 18, 
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8,
  },

  modalInfo: {
    backgroundColor: '#f8f9fa',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },

  modalMedName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  modalDetail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },

  modalButtonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-between',
    gap: 12,
  },

  cancelBtn: { 
    flex: 1,
    backgroundColor: '#6c757d', 
    padding: 12, 
    borderRadius: 12,
    alignItems: 'center',
  },

  confirmBtn: { 
    flex: 1,
    backgroundColor: '#4dabf7', 
    padding: 12, 
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },

  cancelText: { 
    color: '#fff',
    fontWeight: '600',
  },

  confirmText: { 
    color: '#fff',
    fontWeight: '600',
  },

  menu: { 
    backgroundColor: '#4dabf7', 
    borderRadius: 12, 
    marginTop: 20, 
    marginBottom: 20,
    overflow: 'hidden',
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  menuItem: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    paddingVertical: 16, 
    paddingHorizontal: 20, 
    borderBottomWidth: 0.5, 
    borderColor: '#ffffff30',
  },

  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },

  menuText: { 
    color: '#fff', 
    fontSize: 16, 
    fontWeight: '600',
  },
});

export default HomeScreen;