import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Button,
  ScrollView,
  //ActivityIndicator,
  //Alert,
} from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

const MedicationListScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [isloading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('ทั้งหมด');
  const groupNames = ['ทั้งหมด', ...new Set(
  Array.isArray(medications) ? medications.map(item => item.GroupName).filter(Boolean) : []
)];


  //console.log(medications); //เช็ค data จาก backend

useEffect(() => {
  const fetchMedications = async () => {
    try {
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        console.warn('❌ ไม่พบ userId ใน AsyncStorage');
        return;
      }

      const userId = parseInt(storedUserId);
      const response = await fetch(`${BASE_URL}/api/medications?userId=${userId}`);
      const data = await response.json();

      if (Array.isArray(data)) {
        setMedications(data);
      } else {
        console.error('Invalid response:', data);
        setMedications([]);
      }
    } catch (err) {
      console.error('Error fetching medications:', err);
    } finally {
      setLoading(false);
    }
  };

  fetchMedications();
}, []);



  const filteredMedications = selectedGroup === 'ทั้งหมด'
    ? medications
    : medications.filter(med => med.GroupName === selectedGroup);

  return (
    <View style={styles.container}>
        <Text style={styles.header}>📋 รายการยาasdsda</Text>

        {isloading ? <Text>Loading...</Text> : (
          <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
            <Text style={{ fontWeight: 'bold' }}>เลือกกลุ่มโรค:</Text>
            <Picker
              selectedValue={selectedGroup}
              onValueChange={(itemValue) => setSelectedGroup(itemValue)}
            >
              {groupNames.map(group => (
                <Picker.Item label={group} value={group} key={group} />
              ))}
            </Picker>
        
            <FlatList
              data={filteredMedications}
              keyExtractor={(item, index) => item.MedicationID?.toString() ?? index.toString()}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate('MedicationDetailScreen', { id: item.MedicationID })}
                >
                  <Text style={styles.name}>{item.Name}</Text>
                  <Text>หมายเหตุ: {item.Note}</Text>
                  <Text>กลุ่มโรค: {item.GroupName || '-'}</Text>
                </TouchableOpacity>
              )}
            />
            

          </View>
        )}


        <View style={styles.buttonContainer}>
          <Button title="➕ เพิ่มยา" onPress={() => navigation.navigate('AddMedication')} />
          <View style={{ height: 10 }} />
          <Button title="⚙️ รายการที่ต้องกิน" onPress={() => navigation.navigate('DailyReminderScreen')} />
        </View>

    </View>
  );
};

export default MedicationListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 12,
    backgroundColor: '#fff',
  },
  header: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  card: {
    backgroundColor: '#e0f7fa',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#00796b',
  },
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
    position: 'static',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
