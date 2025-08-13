<<<<<<< HEAD
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const settings = [
  { id: 1, label: 'ข้อมูลส่วนตัว', icon: 'person-circle-outline' },
  { id: 2, label: 'เวลามื้ออาหาร', icon: 'restaurant-outline' },
];

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>การตั้งค่า</Text>
      </View>

      {settings.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardContent}>
            <Ionicons name={item.icon} size={22} color="#3b3b3b" style={styles.leftIcon} />
            <Text style={styles.cardText}>{item.label}</Text>
            <Ionicons name="create-outline" size={20} color="#555" style={styles.rightIcon} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6fd',
    padding: 16,
  },
  headerBox: {
    backgroundColor: '#4dabf7',
    paddingVertical: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 16,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SettingsScreen;
=======
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

const settings = [
  { id: 1, label: 'ข้อมูลส่วนตัว', icon: 'person-circle-outline' },
  { id: 2, label: 'เวลามื้ออาหาร', icon: 'restaurant-outline' },
];

const SettingsScreen = () => {
  return (
    <View style={styles.container}>
      <View style={styles.headerBox}>
        <Text style={styles.headerText}>การตั้งค่า</Text>
      </View>

      {settings.map(item => (
        <View key={item.id} style={styles.card}>
          <View style={styles.cardContent}>
            <Ionicons name={item.icon} size={22} color="#3b3b3b" style={styles.leftIcon} />
            <Text style={styles.cardText}>{item.label}</Text>
            <Ionicons name="create-outline" size={20} color="#555" style={styles.rightIcon} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f2f6fd',
    padding: 16,
  },
  headerBox: {
    backgroundColor: '#4dabf7',
    paddingVertical: 14,
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    marginBottom: 16,
  },
  headerText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
  },
  leftIcon: {
    marginRight: 12,
  },
  rightIcon: {
    marginLeft: 'auto',
  },
  cardText: {
    fontSize: 16,
    color: '#333',
  },
});

export default SettingsScreen;
>>>>>>> 4fc5d0f7cd7c07579a378acb955bcba0b455a97e
