import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';

const UsersScreen = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('http://192.168.1.219:8081/users') // เปลี่ยนจาก localhost เป็น IP เครื่องคุณ
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(error => console.error('❌ Error fetching users:', error));
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.header}>รายชื่อผู้ใช้</Text>
      <FlatList
        data={users}
        keyExtractor={item => item.UserID.toString()}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text>👤 {item.Name}</Text>
            <Text>📧 {item.Email}</Text>
            <Text>📞 {item.Phone}</Text>
          </View>
        )}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: '#fff' },
  header: { fontSize: 24, fontWeight: 'bold', marginBottom: 20 },
  card: { backgroundColor: '#f2f2f2', padding: 15, marginBottom: 10, borderRadius: 10 }
});

export default UsersScreen;
