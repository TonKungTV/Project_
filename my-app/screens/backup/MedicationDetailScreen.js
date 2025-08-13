import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { BASE_URL } from './config';

const MedicationDetailScreen = ({ route }) => {
  const { id } = route.params;
  const [medication, setMedication] = useState(null);
  const [mealTimes, setMealTimes] = useState([]);

  useEffect(() => {
    // ดึงรายละเอียดยา
    fetch(`${BASE_URL}/api/medications/${id}`)
      .then(res => res.json())
      .then(data => setMedication(data))
      .catch(err => console.error('Error fetching medication:', err));

    // ดึงเวลาที่ต้องทาน
    fetch(`${BASE_URL}/api/medications/${id}/times`)
      .then(res => res.json())
      .then(data => setMealTimes(data))
      .catch(err => console.error('Error fetching times:', err));
  }, [id]);

  const formatMealOffset = (mealName, timeStr) => {
    if (!timeStr || typeof timeStr !== 'string') return mealName || '-';

    const [h, m] = timeStr.split(':').map(Number);
    const minutes = h * 60 + m;

    if (mealName?.includes('ก่อน')) return `${minutes} นาทีก่อนอาหาร`;
    if (mealName?.includes('หลัง')) return `${minutes} นาทีหลังอาหาร`;
    return `พร้อมอาหาร`;
  };




  // ยังโหลดไม่เสร็จ
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
    </ScrollView>
  );
};

export default MedicationDetailScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#fff'
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 20
  },
  label: {
    fontWeight: 'bold',
    marginTop: 10
  },
  value: {
    marginBottom: 10
  }
});
