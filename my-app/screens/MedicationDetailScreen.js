
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';

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

const MedicationDetailScreen = ({ route, navigation }) => {
  const { id } = route.params;
  const [medication, setMedication] = useState(null);
  const [mealTimes, setMealTimes] = useState([]);

  useEffect(() => {
    fetch(`${BASE_URL}/api/medications/${id}`)
      .then(res => res.json())
      .then(data => setMedication(data))
      .catch(err => console.error('Error fetching medication:', err));

    fetch(`${BASE_URL}/api/medications/${id}/times`)
      .then(res => res.json())
      .then(data => setMealTimes(data))
      .catch(err => console.error('Error fetching times:', err));
  }, [id]);

  const deleteMedication = () => {
    Alert.alert(
      'ยืนยันการลบ',
      'คุณต้องการลบรายการยานี้หรือไม่?',
      [
        {
          text: 'ยกเลิก',
          style: 'cancel',
        },
        {
          text: 'ลบ',
          onPress: async () => {
            try {
              const response = await fetch(`${BASE_URL}/api/medications/${id}`, {
                method: 'DELETE',
              });
              if (response.ok) {
                Alert.alert('ลบรายการยาเรียบร้อย');
                navigation.goBack(); // กลับไปที่หน้าก่อนหน้านี้หลังลบ
              } else {
                Alert.alert('เกิดข้อผิดพลาดในการลบรายการยา');
              }
            } catch (error) {
              console.error('Error deleting medication:', error);
              Alert.alert('ไม่สามารถลบรายการยาได้');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const formatMealOffset = (mealName, timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return mealName || '-';

    const [h, m] = timeStr.split(':').map(Number);
    const minutes = h * 60 + m;

    if (mealName?.includes('ก่อน')) return `${minutes} นาทีก่อนอาหาร`;
    if (mealName?.includes('หลัง')) return `${minutes} นาทีหลังอาหาร`;
    return `พร้อมอาหาร`;
  };

  if (!medication) {
    return <Text style={{ padding: 20 }}>กำลังโหลดข้อมูลยา...</Text>;
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>รายละเอียดยา</Text>

      <Text style={styles.label}>ชื่อยา:</Text>
      <Text style={styles.value}>{medication.Name}</Text>

      <Text style={styles.label}>หมายเหตุ:</Text>
      <Text style={styles.value}>{medication.Note || '-'}</Text>

      <Text style={styles.label}>กลุ่มโรค:</Text>
      <Text style={styles.value}>{medication.GroupName || '-'}</Text>

      <Text style={styles.label}>ชนิดยา:</Text>
      <Text style={styles.value}>{medication.TypeName || '-'}</Text>

      <Text style={styles.label}>ขนาดยา:</Text>
      <Text style={styles.value}>{medication.Dosage} {medication.DosageType}</Text>

      <Text style={styles.label}>การใช้งานกับมื้ออาหาร:</Text>
      <Text style={styles.value}>{formatMealOffset(medication.UsageMealName, medication.UsageMealTimeOffset)}</Text>

      <Text style={styles.label}>เวลาที่ต้องทาน:</Text>
      {mealTimes.length > 0 ? (
        mealTimes.map((item, index) => (
          <Text key={index} style={styles.value}>
            • {item.MealName} ({item.Time.slice(0, 5)})
          </Text>
        ))
      ) : (
        <Text style={styles.value}>ไม่พบข้อมูลเวลา</Text>
      )}

      <Text style={styles.label}>ช่วงเวลาการทาน:</Text>
      <Text style={styles.value}>
        {new Date(medication.StartDate).toLocaleDateString('th-TH')} - {new Date(medication.EndDate).toLocaleDateString('th-TH')}
      </Text>

      <Text style={styles.label}>ความสำคัญ:</Text>
      <Text style={styles.value}>{medication.PriorityName || '-'}</Text>

      {/* ปุ่มแก้ไข */}
      <View style={styles.buttonContainer}>
      {/* <View style={{ marginTop: 20 }}> */}
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => navigation.navigate('EditMedicationScreen', { id: medication.MedicationID })}
        >
          <Ionicons name="create" size={20} color="#fff" />
          <Text style={styles.buttonText}>แก้ไข</Text>
        </TouchableOpacity>

        {/* ปุ่มลบ */}
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={deleteMedication}
        >
          <Ionicons name="trash" size={20} color="#fff" />
          <Text style={styles.buttonText}>ลบ</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10,
  },
  value: {
    marginBottom: 10,
    color: '#333',
  },
buttonContainer: {
    flexDirection: 'row', // จัดเรียงปุ่มในแถว
    justifyContent: 'space-beween', // ให้ปุ่มอยู่ห่างกัน
    marginTop: 20, // ช่องว่างจากด้านบน
  },
  editButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4dabf7',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    flex: 1,
    justifyContent: 'center',
    marginInline: 10,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#e74c3c',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 15,
    flex: 1,
    justifyContent: 'center',
    marginInline: 10,
  },
  buttonText: {
    color: '#fff',
    marginLeft: 10,
    fontWeight: 'bold',
  },
});

export default MedicationDetailScreen;