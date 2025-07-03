import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity,Button } from 'react-native';

const MedicationList = ({ navigation }) => {
  const [medications, setMedications] = useState([]);

  useEffect(() => {
    fetchMedications();
  }, []);

  const fetchMedications = async () => {
    try {
      const response = await fetch('http://192.168.1.219:3000/api/medications'); // เปลี่ยนเป็น URL backend จริง
      const data = await response.json();
      setMedications(data);
    } catch (error) {
      console.error("Error fetching medications:", error);
    }
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MedicationDetail', { item })}>
      <Text style={styles.name}>{item.name}</Text>
      <Text>กลุ่มโรค: {item.diseaseGroup}</Text>
      <Text>กิน: {item.meals.join(', ')}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={medications}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderItem}
      />
      <View style={styles.buttonContainer}>
        <Button title="➕ เพิ่มยา" onPress={() => navigation.navigate('AddMedication')} />
        <Button title="⚙️ ตั้งค่า" onPress={() => navigation.navigate('Settings')} />
      </View>

    </View>
  );
};

export default MedicationList;

const styles = StyleSheet.create({
  container: { flex: 1, padding: 10 },
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
});