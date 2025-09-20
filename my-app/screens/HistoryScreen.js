import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';
import { Ionicons } from '@expo/vector-icons';

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const displayDate = (d) => d.toLocaleDateString('th-TH', { day: 'numeric', month: 'short', year: 'numeric' });

const HistoryScreen = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); d.setDate(d.getDate() - 6); return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null); // 'from' | 'to' | null
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total:0, taken:0, skipped:0 });

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) { setRows([]); setSummary({ total:0, taken:0, skipped:0 }); setLoading(false); return; }
      const url = `${BASE_URL}/api/history?userId=${userId}&from=${from}&to=${to}`;
      const res = await fetch(url);
      if (!res.ok) {
        const text = await res.text().catch(()=>'');
        throw new Error(`Server ${res.status}: ${text}`);
      }
      const json = await res.json();
      setRows(Array.isArray(json.rows) ? json.rows : []);
      const srvSummary = json.summary || { total:0, taken:0, skipped:0 };
      setSummary(srvSummary);
    } catch (e) {
      console.error('fetch history error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // helper to compute pending and percentages
  const derived = (() => {
    const total = summary.total || 0;
    const taken = summary.taken || 0;
    const skipped = summary.skipped || 0;
    const pending = Math.max(0, total - taken - skipped);
    const pct = (n) => total ? Math.round((n / total) * 100) : 0;
    return {
      total, taken, skipped, pending,
      pctTaken: pct(taken),
      pctSkipped: pct(skipped),
      pctPending: pct(pending),
    };
  })();

  useEffect(() => {
    fetchData(formatLocalDate(fromDate), formatLocalDate(toDate));
  }, [fromDate, toDate, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(formatLocalDate(fromDate), formatLocalDate(toDate));
  };

  const renderItem = ({ item }) => (
    <View style={styles.row}>
      <View style={styles.rowLeft}>
        <Text style={styles.rowDate}>{item.Date}</Text>
        <Text style={styles.rowTime}>{item.Time ? item.Time.slice(0,5) : '-'}</Text>
      </View>
      <View style={styles.rowBody}>
        <Text style={styles.medName}>{item.Name}</Text>
        <Text style={styles.meta}>{item.Dosage ? `${item.Dosage} ${item.DosageType || ''}` : ''} • {item.TypeName || ''}</Text>
        <Text style={styles.meta}>สถานะ: {item.Status || '-' } {item.ActualTime ? `• เวลา: ${item.ActualTime.slice(0,5)}` : ''}</Text>
        {item.SideEffects ? <Text style={styles.side}>ผลข้างเคียง: {item.SideEffects}</Text> : null}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>ประวัติการกินยา</Text>
        <View style={styles.dateRow}>
          <TouchableOpacity onPress={() => setFromDate(d => { const n = new Date(d); n.setDate(n.getDate()-1); return n; })} style={styles.navBtn}>
            <Ionicons name="chevron-back" size={20} color="#4dabf7" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setShowPicker('from')} style={styles.dateBtn}>
            <Text style={styles.dateText}>{displayDate(fromDate)}</Text>
          </TouchableOpacity>

          <Text style={{ marginHorizontal: 6 }}>—</Text>

          <TouchableOpacity onPress={() => setShowPicker('to')} style={styles.dateBtn}>
            <Text style={styles.dateText}>{displayDate(toDate)}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setToDate(d => { const n = new Date(d); n.setDate(n.getDate()+1); return n; })} style={styles.navBtn}>
            <Ionicons name="chevron-forward" size={20} color="#4dabf7" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.summary}>
        <Text style={styles.summaryText}>ช่วง: {displayDate(fromDate)} — {displayDate(toDate)}</Text>
        <View style={styles.summaryRow}>
          <Text style={styles.summaryItem}>รวม {derived.total} รายการ</Text>
          <Text style={[styles.summaryItem, { color: '#28a745' }]}>กินแล้ว {derived.taken} ({derived.pctTaken}%)</Text>
          <Text style={[styles.summaryItem, { color: '#ffc107' }]}>รอกิน {derived.pending} ({derived.pctPending}%)</Text>
          <Text style={[styles.summaryItem, { color: '#dc3545' }]}>ข้าม {derived.skipped} ({derived.pctSkipped}%)</Text>
        </View>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 24 }} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(i) => String(i.ScheduleID || `${i.MedicationID}_${i.Date}_${i.Time}`)}
          renderItem={renderItem}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ListEmptyComponent={<View style={{padding:20}}><Text>ไม่พบประวัติในช่วงนี้</Text></View>}
        />
      )}

      {showPicker && (
        <DateTimePicker
          value={showPicker === 'from' ? fromDate : toDate}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowPicker(null);
            if (!date) return;
            if (showPicker === 'from') setFromDate(date);
            else setToDate(date);
          }}
        />
      )}
    </View>
  );
};

export default HistoryScreen;

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:'#f8f9fa' },
  header:{ padding:16, backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#eee' },
  title:{ fontSize:18, fontWeight:'bold' },
  dateRow:{ flexDirection:'row', alignItems:'center', marginTop:8 },
  dateBtn:{ padding:8, backgroundColor:'#fff', borderRadius:8, borderWidth:1, borderColor:'#e0e0e0' },
  dateText:{ color:'#333' },
  navBtn:{ padding:6 },
  summary:{ padding:12, backgroundColor:'#fff', borderBottomWidth:1, borderColor:'#eee' },
  summaryText:{ color:'#666', marginBottom:8 },
  summaryRow:{ flexDirection:'row', justifyContent:'space-between' },
  summaryItem:{ color:'#333', fontWeight:'600' },
  row:{ flexDirection:'row', padding:12, backgroundColor:'#fff', marginTop:8, marginHorizontal:12, borderRadius:8, elevation:1 },
  rowLeft:{ width:80, alignItems:'flex-start' },
  rowDate:{ fontSize:12, color:'#666' },
  rowTime:{ fontSize:14, fontWeight:'700', marginTop:6 },
  rowBody:{ flex:1, paddingLeft:12 },
  medName:{ fontSize:16, fontWeight:'700' },
  meta:{ color:'#666', marginTop:4 },
  side:{ color:'#b02a37', marginTop:6 }
});