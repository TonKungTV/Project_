// import React, { useEffect, useState } from 'react';
// import {
//   View,
//   Text,
//   FlatList,
//   StyleSheet,
//   TouchableOpacity,
//   Button,
//   ScrollView,
//   //ActivityIndicator,
//   //Alert,
// } from 'react-native';
// import { Picker } from '@react-native-picker/picker';
// import { BASE_URL } from './config';
// import AsyncStorage from '@react-native-async-storage/async-storage';

// const MedicationListScreen = ({ navigation }) => {
//   const [medications, setMedications] = useState([]);
//   const [isloading, setLoading] = useState(true);
//   const [selectedGroup, setSelectedGroup] = useState('ทั้งหมด');
//   const groupNames = ['ทั้งหมด', ...new Set(
//   Array.isArray(medications) ? medications.map(item => item.GroupName).filter(Boolean) : []
// )];


//   //console.log(medications); //เช็ค data จาก backend

// useEffect(() => {
//   const fetchMedications = async () => {
//     try {
//       const storedUserId = await AsyncStorage.getItem('userId');
//       if (!storedUserId) {
//         console.warn('❌ ไม่พบ userId ใน AsyncStorage');
//         return;
//       }

//       const userId = parseInt(storedUserId);
//       const response = await fetch(`${BASE_URL}/api/medications?userId=${userId}`);
//       const data = await response.json();

//       if (Array.isArray(data)) {
//         setMedications(data);
//       } else {
//         console.error('Invalid response:', data);
//         setMedications([]);
//       }
//     } catch (err) {
//       console.error('Error fetching medications:', err);
//     } finally {
//       setLoading(false);
//     }
//   };

//   fetchMedications();
// }, []);



//   const filteredMedications = selectedGroup === 'ทั้งหมด'
//     ? medications
//     : medications.filter(med => med.GroupName === selectedGroup);

//   return (
//     <View style={styles.container}>
//         <Text style={styles.header}>📋 รายการยา</Text>

//         {isloading ? <Text>Loading...</Text> : (
//           <View style={{ flex: 1, flexDirection: 'column', justifyContent: 'space-between' }}>
//             <Text style={{ fontWeight: 'bold' }}>เลือกกลุ่มโรค:</Text>
//             <Picker
//               selectedValue={selectedGroup}
//               onValueChange={(itemValue) => setSelectedGroup(itemValue)}
//             >
//               {groupNames.map(group => (
//                 <Picker.Item label={group} value={group} key={group} />
//               ))}
//             </Picker>
        
//             <FlatList
//               data={filteredMedications}
//               keyExtractor={(item, index) => item.MedicationID?.toString() ?? index.toString()}
//               renderItem={({ item }) => (
//                 <TouchableOpacity
//                   style={styles.card}
//                   onPress={() => navigation.navigate('MedicationDetailScreen', { id: item.MedicationID })}
//                 >
//                   <Text style={styles.name}>{item.Name}</Text>
//                   <Text>หมายเหตุ: {item.Note}</Text>
//                   <Text>กลุ่มโรค: {item.GroupName || '-'}</Text>
//                 </TouchableOpacity>
//               )}
//             />
            

//           </View>
//         )}


//         <View style={styles.buttonContainer}>
//           <Button title="➕ เพิ่มยา" onPress={() => navigation.navigate('AddMedication')} />
//           <View style={{ height: 10 }} />
//           <Button title="⚙️ รายการที่ต้องกิน" onPress={() => navigation.navigate('DailyReminderScreen')} />
//         </View>

//     </View>
//   );
// };

// export default MedicationListScreen;

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 12,
//     backgroundColor: '#fff',
//   },
//   header: {
//     fontSize: 22,
//     fontWeight: 'bold',
//     marginBottom: 12,
//   },
//   card: {
//     backgroundColor: '#e0f7fa',
//     padding: 15,
//     marginBottom: 10,
//     borderRadius: 10,
//     shadowColor: '#000',
//     elevation: 3,
//   },
//   name: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 4,
//     color: '#00796b',
//   },
//   buttonContainer: {
//     marginTop: 10,
//     marginBottom: 30,
//     position: 'static',
//     bottom: 20,
//     left: 20,
//     right: 20,
//   },
//   loading: {
//     flex: 1,
//     justifyContent: 'center',
//     alignItems: 'center',
//   },
// });

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';
import { BASE_URL } from './config';
import AsyncStorage from '@react-native-async-storage/async-storage';

//  Component สำหรับแสดงการ์ดยา 
const MedicationCard = ({ item, onPress }) => {
  //  สร้างสีตาม GroupName หรือชื่อยา
  const getCardColor = (groupName, medicationName) => {
    const colors = ['#f44336', '#4caf50', '#2196f3', '#ff9800', '#9c27b0', '#607d8b'];
    const hash = (groupName || medicationName || '').split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    return colors[Math.abs(hash) % colors.length];
  };

  // สร้างตัวย่อจากชื่อยา
  const getInitials = (name) => {
    if (!name) return '?';
    const words = name.split(' ');
    if (words.length >= 2) {
      return words[0].charAt(0) + words[1].charAt(0);
    }
    return name.substring(0, 2);
  };

  return (
    <TouchableOpacity style={styles.medicationCard} onPress={onPress}>
      {/* วงกลมแสดงตัวย่อของยา */}
      <View style={[styles.medicationIcon, { backgroundColor: getCardColor(item.GroupName, item.Name) }]}>
        <Text style={styles.medicationInitials}>
          {getInitials(item.Name).toUpperCase()}
        </Text>
      </View>
      
      {/* ข้อมูลยา */}
      <View style={styles.medicationInfo}>
        <Text style={styles.medicationName}>{item.Name}</Text>
        <Text style={styles.medicationDetails}>
          {item.Note ? `${item.Note.substring(0, 30)}${item.Note.length > 30 ? '...' : ''}` : 'ไม่มีหมายเหตุ'}
        </Text>
        <Text style={styles.medicationGroup}>กลุ่มโรค: {item.GroupName || 'ไม่ระบุ'}</Text>
      </View>

      {/*  ลูกศรชี้ไปทางขวา */}
      <View style={styles.arrowContainer}>
        <Ionicons name="chevron-forward" size={20} color="#999" />
      </View>
    </TouchableOpacity>
  );
};

//  Component สำหรับหน้าเปล่า (Empty State)
const EmptyState = ({ onAddMedication }) => (
  <View style={styles.emptyContainer}>
    {/* <View style={styles.emptyIconContainer}>
      <Ionicons name="medical" size={60} color="#4dabf7" />
    </View> */}
    <Text style={styles.emptyTitle}>ไม่มีรายการยา</Text>
    <Text style={styles.emptySubtitle}>เพิ่มรายการยาของคุณ กดปุ่ม +</Text>
  </View>
);

const MedicationListScreen = ({ navigation }) => {
  const [medications, setMedications] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState('ทั้งหมด');
  
  //  สร้างรายการกลุ่มโรค
  const groupNames = ['ทั้งหมด', ...new Set(
    Array.isArray(medications) ? medications.map(item => item.GroupName).filter(Boolean) : []
  )];

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

  //  กรองยาตามกลุ่มที่เลือก
  const filteredMedications = selectedGroup === 'ทั้งหมด'
    ? medications
    : medications.filter(med => med.GroupName === selectedGroup);

  return (
    <SafeAreaView style={styles.container}>
      {/*  ตั้งค่า StatusBar ให้เป็นสีฟ้า */}
      <StatusBar barStyle="light-content" backgroundColor="#4dabf7" />
      
      {/* Header แบบใหม่ คล้ายรูป */}
      <View style={styles.header}>
        <TouchableOpacity 
          style={styles.backButton} 
          onPress={() => navigation.goBack()}
        >
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>รายการยา</Text>
        <View style={styles.headerRight} />
      </View>

      {/*  Loading state */}
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <View style={styles.content}>
          {/*  Dropdown สำหรับเลือกกลุ่มโรค - ซ่อนไว้ถ้าไม่มีข้อมูล */}
          {medications.length > 0 && (
            <View style={styles.filterContainer}>
              <Text style={styles.filterLabel}>เลือกโรค:</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={selectedGroup}
                  onValueChange={(itemValue) => setSelectedGroup(itemValue)}
                  style={styles.picker}
                >
                  {groupNames.map(group => (
                    <Picker.Item label={group} value={group} key={group} />
                  ))}
                </Picker>
              </View>
            </View>
          )}

          {/* รายการยา หรือหน้าเปล่า */}
          {filteredMedications.length > 0 ? (
            <FlatList
              data={filteredMedications}
              keyExtractor={(item, index) => item.MedicationID?.toString() ?? index.toString()}
              renderItem={({ item }) => (
                <MedicationCard
                  item={item}
                  onPress={() => navigation.navigate('MedicationDetailScreen', { id: item.MedicationID })}
                />
              )}
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.listContainer}
            />
          ) : (
            <EmptyState onAddMedication={() => navigation.navigate('AddMedication')} />
          )}
        </View>
      )}

      {/*  ปุ่มลอย (FAB) สำหรับเพิ่มยา - คล้ายรูป */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => navigation.navigate('AddMedication')}
      >
        <Ionicons name="add" size={24} color="#fff" />
      </TouchableOpacity>

      {/* ข้อความใต้ปุ่ม FAB */}
      <View style={styles.fabTextContainer}>
        <Text style={styles.fabText}>เพิ่มรายการยา</Text>
      </View>

       {/* ปุ่มเมนูเสริม รายการยาที่ต้องกิน - วางไว้ด้านล่าง */}
      {/* <View style={styles.bottomMenu}>
        <TouchableOpacity
          style={styles.menuButton}
          onPress={() => navigation.navigate('DailyReminderScreen')}
        >
          <Ionicons name="alarm" size={20} color="#fff" />
          <Text style={styles.menuButtonText}>รายการที่ต้องกิน</Text>
        </TouchableOpacity>
      </View> */}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  //  Container หลัก
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },

  //  Header สีฟ้า คล้ายรูป
  header: {
    backgroundColor: '#4dabf7',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  backButton: {
    padding: 8,
  },

  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    flex: 1,
    textAlign: 'center',
    marginRight: 40, //  ชดเชยปุ่มกลับด้านซ้าย
  },

  headerRight: {
    width: 40, //  placeholder สำหรับสมดุล
  },

  //  Loading state
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },

  loadingText: {
    fontSize: 16,
    color: '#666',
  },

  // Content area
  content: {
    flex: 1,
    paddingTop: 16,
  },

  //  Filter/Picker container
  filterContainer: {
    paddingHorizontal: 16,
    marginBottom: 16,
  },

  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },

  pickerContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },

  picker: {
    height: 50,
  },

  //  List container
  listContainer: {
    paddingBottom: 100, //  เว้นที่สำหรับ FAB
  },

  //  การ์ดยา - ดีไซน์ใหม่
  medicationCard: {
    backgroundColor: '#fff',
    marginHorizontal: 16,
    marginBottom: 12,
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },

  // ✅ วงกลมไอคอนยา
  medicationIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },

  medicationInitials: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },

  // ข้อมูลยา
  medicationInfo: {
    flex: 1,
  },

  medicationName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },

  medicationDetails: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },

  medicationGroup: {
    fontSize: 12,
    color: '#999',
  },

  //  ลูกศร
  arrowContainer: {
    padding: 8,
  },

  // Empty state - หน้าเปล่า
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },

  emptyIconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#e3f2fd',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },

  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },

  emptySubtitle: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
    lineHeight: 20,
  },

  //  FAB (Floating Action Button) - คล้ายรูป
  fab: {
    position: 'absolute',
    bottom: 100,
    alignSelf: 'center',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4dabf7',
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },

  //  ข้อความใต้ FAB
  fabTextContainer: {
    position: 'absolute',
    bottom: 75,
    alignSelf: 'center',
  },

  fabText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center',
  },

  //  เมนูด้านล่าง
  bottomMenu: {
    backgroundColor: '#4dabf7',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },

  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.2)',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
  },

  menuButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default MedicationListScreen;