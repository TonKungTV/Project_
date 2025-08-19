import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
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
    morning: { title: 'เช้า (06:00 - 12:00)', items: [], icon: 'sunny' },
    afternoon: { title: 'กลางวัน (12:00 - 18:00)', items: [], icon: 'partly-sunny' },
    evening: { title: 'เย็น (18:00 - 21:00)', items: [], icon: 'moon' },
    night: { title: 'ก่อนนอน (21:00 - 05:00)', items: [], icon: 'bed' }
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
  
  // ✅ เพิ่ม state สำหรับผลข้างเคียงและเวลา
  const [sideEffects, setSideEffects] = useState(''); // ผลข้างเคียง
  const [medTime, setMedTime] = useState(new Date()); // เวลาที่เลือก
  const [showTimePicker, setShowTimePicker] = useState(false); // เปิด/ปิด DateTimePicker
  const [actualTakeTime, setActualTakeTime] = useState(''); // เวลาที่กินจริง (แสดงผล)

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

  // ✅ ฟังก์ชันที่ใช้เปลี่ยนสถานะ (กินแล้ว / ยังไม่กิน) - เพิ่มการส่งข้อมูลผลข้างเคียงและเวลา
  const toggleStatus = async (item, customSideEffects = '', customTime = '') => {
    const next = item.status === 'กินแล้ว' ? 'ยังไม่กิน' : 'กินแล้ว';
    setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: next } : x)));

    if (!item.scheduleId) return;
    try {
      // ✅ ส่งข้อมูลเพิ่มเติมไปยัง backend
      const updateData = {
        status: next,
        sideEffects: customSideEffects || null, // ผลข้างเคียง
        actualTime: customTime || null, // เวลาที่กินจริง
        recordedAt: new Date().toISOString() // เวลาที่บันทึก
      };

      await fetch(`${BASE_URL}/api/schedule/${item.scheduleId}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updateData),
      });

      console.log('✅ บันทึกสำเร็จ:', updateData);
    } catch (e) {
      // ถ้า error ย้อนกลับสถานะ
      setItems((prev) => prev.map((x) => (x.id === item.id ? { ...x, status: item.status } : x)));
      console.error('Error updating status:', e);
      Alert.alert('เกิดข้อผิดพลาด', 'ไม่สามารถบันทึกข้อมูลได้');
    }
  };

  // ✅ เปิด Modal เพื่อให้ผู้ใช้บันทึกการกินยา - เพิ่มการตั้งค่าเริ่มต้น
  const openModal = (item) => {
    setSelectedItem(item);
    setModalVisible(true);
    setSideEffects(''); // รีเซ็ตผลข้างเคียง
    setMedTime(new Date()); // ตั้งเวลาเป็นปัจจุบัน
    setActualTakeTime(new Date().toLocaleTimeString('th-TH', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })); // แสดงเวลาปัจจุบัน
  };

  // ✅ ปิด Modal - เพิ่มการล้างข้อมูล
  const closeModal = () => {
    setModalVisible(false);
    setSelectedItem(null);
    setSideEffects('');
    setShowTimePicker(false);
  };

  // ✅ ฟังก์ชันยืนยันการทานยา - เพิ่มการส่งข้อมูลผลข้างเคียงและเวลา
  const confirmConsumption = () => {
    if (selectedItem) {
      toggleStatus(selectedItem, sideEffects, actualTakeTime);
      Alert.alert(
        'บันทึกสำเร็จ', 
        `บันทึกการกินยา "${selectedItem.name}" เรียบร้อยแล้ว${sideEffects ? '\nรวมถึงผลข้างเคียง' : ''}`,
        [{ text: 'ตกลง' }]
      );
    }
    closeModal();
  };

  // ✅ ฟังก์ชันเปิด TimePicker
  const showTimePickerModal = () => setShowTimePicker(true);

  // ✅ ฟังก์ชันที่จัดการเมื่อผู้ใช้เลือกเวลา
  const handleTimeChange = (event, selectedDate) => {
    setShowTimePicker(false); // ปิด picker เสมอ
    
    if (selectedDate) {
      const currentTime = selectedDate;
      setMedTime(currentTime); // อัปเดตเวลา
      
      // ✅ แปลงเป็นรูปแบบที่แสดงผลให้ผู้ใช้เห็น
      const formattedTime = currentTime.toLocaleTimeString('th-TH', { 
        hour: '2-digit', 
        minute: '2-digit' 
      });
      setActualTakeTime(formattedTime);
    }
  };

  // ✅ จัดกลุ่มยาโดยแบ่งตามช่วงเวลา
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

      {/* ✅ Modal สำหรับยืนยันการกินยา - ปรับปรุงใหม่ */}
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
                  <Text style={styles.modalDetail}>เวลาที่กำหนด: {selectedItem.time}</Text>
                  <Text style={styles.modalDetail}>ขนาดยา: {selectedItem.dose}</Text>
                  <Text style={styles.modalDetail}>ประเภทยา: {selectedItem.medType}</Text>
                </View>

                {/* ✅ ส่วนเลือกเวลาที่กินยาจริง */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>⏰ เวลาที่กินยาจริง:</Text>
                  <TouchableOpacity style={styles.timeSelector} onPress={showTimePickerModal}>
                    <Ionicons name="time" size={20} color="#4dabf7" />
                    <Text style={styles.timeText}>{actualTakeTime}</Text>
                    <Ionicons name="chevron-down" size={16} color="#666" />
                  </TouchableOpacity>
                </View>

                {/* ✅ ช่องกรอกผลข้างเคียง */}
                <View style={styles.inputSection}>
                  <Text style={styles.inputLabel}>💊 ผลข้างเคียง (ถ้ามี):</Text>
                  <TextInput
                    style={styles.textInput}
                    placeholder="เช่น คลื่นไส้, ง่วงนอน, ปวดหัว..."
                    value={sideEffects}
                    onChangeText={setSideEffects}
                    multiline
                    maxLength={200}
                    textAlignVertical="top"
                  />
                  <Text style={styles.characterCount}>{sideEffects.length}/200</Text>
                </View>

                {/* ✅ ปุ่มยืนยัน/ยกเลิก */}
                <View style={styles.modalButtonRow}>
                  <TouchableOpacity style={styles.cancelBtn} onPress={closeModal}>
                    <Ionicons name="close" size={16} color="#fff" />
                    <Text style={styles.cancelText}>ยกเลิก</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.confirmBtn} onPress={confirmConsumption}>
                    <Ionicons name="checkmark" size={16} color="#fff" />
                    <Text style={styles.confirmText}>
                      {selectedItem.status === 'กินแล้ว' ? 'ยกเลิกการกิน' : 'ทานยาแล้ว'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ✅ DateTimePicker - แสดงเมื่อต้องการเลือกเวลา */}
      {showTimePicker && (
        <DateTimePicker
          value={medTime}
          mode="time"
          is24Hour={true}
          display="default"
          onChange={handleTimeChange}
        />
      )}

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
    width: '90%',
    maxWidth: 400,
    maxHeight: '80%',
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
    marginBottom: 16,
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

  // ✅ สไตล์ใหม่สำหรับส่วนกรอกข้อมูล
  inputSection: {
    marginBottom: 16,
  },

  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  timeSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    gap: 8,
  },

  timeText: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },

  textInput: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 14,
    color: '#333',
    minHeight: 80,
  },

  characterCount: {
    fontSize: 12,
    color: '#999',
    textAlign: 'right',
    marginTop: 4,
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
  // backgroundColor: '#4dabf7', 
  // borderRadius: 12, 
  // marginTop: 20, 
  // marginBottom: 20,
  // overflow: 'hidden',
  // elevation: 4,  // เพิ่มเงาเล็กน้อย
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
  paddingHorizontal: 24, // เพิ่มช่องว่างซ้ายขวา
  borderBottomWidth: 0.5, 
  borderColor: '#ffffff30',
  backgroundColor: '#fff', // สีพื้นหลังของปุ่ม
  marginVertical: 10, // เว้นระยะระหว่างปุ่ม
  borderRadius: 10,  // ปรับขอบมนให้มากขึ้น
  elevation: 3, // เพิ่มเงาของปุ่ม
},

menuItemLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 12, // เพิ่มระยะห่างระหว่างไอคอนและข้อความ
},

menuText: { 
  color: '#333',  // เปลี่ยนสีข้อความให้เข้มขึ้น
  fontSize: 16, 
  fontWeight: '600',
},

menuItem: {
  flexDirection: 'row',
  justifyContent: 'space-between',
  alignItems: 'center',
  paddingVertical: 16,
  paddingHorizontal: 24,
  backgroundColor: '#4dabf7', // สีพื้นหลังของปุ่ม
  borderRadius: 8, // ขอบมน
  marginBottom: 10, // ระยะห่างระหว่างปุ่ม
  elevation: 5, // เพิ่มเงาให้ปุ่ม
},

menuItemLeft: {
  flexDirection: 'row',
  alignItems: 'center',
  gap: 8, // เพิ่มช่องว่างระหว่างไอคอนกับข้อความ
},

menuText: {
  fontSize: 16,
  color: '#fff', // สีข้อความให้ตรงกับสีปุ่ม
  fontWeight: '600',
},

});

export default HomeScreen;