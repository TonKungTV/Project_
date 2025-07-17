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
  View, Text, FlatList, StyleSheet,
  TouchableOpacity, Button, Image
} from 'react-native';
import { Ionicons } from '@expo/vector-icons'; // ใช้ไอคอน + ที่ดูดีขึ้น

const MedicationList = ({ navigation }) => {
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch('http://192.168.1.219:3000/api/medications');
      const data = await response.json();
      setMedications(data);
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

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
    </View>
  );
};

export default MedicationList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
  },
  list: {
    paddingBottom: 80,
  },
  card: {
    backgroundColor: '#f0f8ff',
    padding: 12,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    elevation: 3,
  },
  name: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
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


