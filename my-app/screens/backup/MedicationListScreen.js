// import React, { useEffect, useState } from 'react';
// import { View, Text, FlatList, StyleSheet, TouchableOpacity,Button } from 'react-native';

// const MedicationList = ({ navigation }) => {
//   const [medications, setMedications] = useState([]);

//   useEffect(() => {
//     fetchMedications();
//   }, []);

//   const fetchMedications = async () => {
//     try {
//       const response = await fetch('http://192.168.1.219:3000/api/medications'); // เปลี่ยนเป็น URL backend จริง
//       const data = await response.json();
//       setMedications(data);
//     } catch (error) {
//       console.error("Error fetching medications:", error);
//     }
//   };

//   const renderItem = ({ item }) => (
//     <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MedicationDetail', { item })}>
//       <Text style={styles.name}>{item.name}</Text>
//       <Text>กลุ่มโรค: {item.diseaseGroup}</Text>
//       <Text>กิน: {item.meals.join(', ')}</Text>
//     </TouchableOpacity>
//   );

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={medications}
//         keyExtractor={(item) => item.id.toString()}
//         renderItem={renderItem}
//       />
//       <View style={styles.buttonContainer}>
//         <Button title="➕ เพิ่มยา" onPress={() => navigation.navigate('AddMedication')} />
//         <Button title="⚙️ ตั้งค่า" onPress={() => navigation.navigate('Settings')} />
//       </View>

//     </View>
//   );
// };

// export default MedicationList;

// const styles = StyleSheet.create({
//   container: { flex: 1, padding: 10 },
//   card: {
//     backgroundColor: '#f0f8ff',
//     padding: 12,
//     marginBottom: 10,
//     borderRadius: 10,
//     shadowColor: '#000',
//     elevation: 3,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     color: '#333',
//   },
// });


import React, { useEffect, useState } from 'react';
import {
<<<<<<< HEAD
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
=======
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Button, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // ใช้ไอคอน + ที่ดูดีขึ้น
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e

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
<<<<<<< HEAD
      const storedUserId = await AsyncStorage.getItem('userId');
      if (!storedUserId) {
        console.warn('❌ ไม่พบ userId ใน AsyncStorage');
        return;
      }

      const userId = parseInt(storedUserId);
      const response = await fetch(`${BASE_URL}/api/medications?userId=${userId}`);
=======
      const response = await fetch('http://192.168.1.219:3000/api/medications');
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
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

<<<<<<< HEAD
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

=======
  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => navigation.navigate('MedicationDetail', { item })}
    >
      <Text style={styles.name}>{item.name}</Text>
      <Text>กลุ่มโรค: {item.diseaseGroup}</Text>
      <Text>กิน: {item.meals.join(', ')}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {medications.length === 0 ? (
        <View style={styles.emptyContainer}>
          <TouchableOpacity
            style={styles.addButtonCircle}
            onPress={() => navigation.navigate('AddMedication')}
          >
            <Ionicons name="add" size={36} color="#fff" />
          </TouchableOpacity>
          <Text style={styles.emptyTextTitle}>ไม่มีรายการยา</Text>
          <Text style={styles.emptyTextSub}>เพิ่มรายการยา กดปุ่ม +</Text>
        </View>
      ) : (
        <FlatList
          data={medications}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
        />
      )}
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
    </View>
  );
};

export default MedicationListScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
<<<<<<< HEAD
=======
    backgroundColor: '#fff',
    padding: 20,
  },
  list: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#f0f8ff',
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
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
<<<<<<< HEAD
  buttonContainer: {
    marginTop: 10,
    marginBottom: 30,
    position: 'static',
    bottom: 20,
    left: 20,
    right: 20,
  },
  loading: {
=======
  emptyContainer: {
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
<<<<<<< HEAD
});
=======
  addButtonCircle: {
    backgroundColor: '#3399ff',
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  emptyTextTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyTextSub: {
    fontSize: 14,
    color: '#888',
    marginTop: 4,
  },
});


>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
