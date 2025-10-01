import React, { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, ScrollView
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { BASE_URL } from './config';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

const formatLocalDate = (d) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const displayDate = (d) => d.toLocaleDateString('th-TH', { 
  day: 'numeric', 
  month: 'short', 
  year: 'numeric' 
});

const HistoryScreen = () => {
  const [fromDate, setFromDate] = useState(() => {
    const d = new Date(); 
    d.setDate(d.getDate() - 6); 
    return d;
  });
  const [toDate, setToDate] = useState(new Date());
  const [showPicker, setShowPicker] = useState(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]);
  const [summary, setSummary] = useState({ total:0, taken:0, skipped:0 });
  const [medStats, setMedStats] = useState([]);
  const [viewMode, setViewMode] = useState('summary'); // 'summary' | 'byMedication' | 'details'

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        setRows([]);
        setSummary({ total:0, taken:0, skipped:0 });
        setMedStats([]);
        setLoading(false);
        return;
      }

      // ดึงข้อมูล history
      const historyUrl = `${BASE_URL}/api/history?userId=${userId}&from=${from}&to=${to}`;
      const historyRes = await fetch(historyUrl);
      if (!historyRes.ok) throw new Error(`Server ${historyRes.status}`);
      const historyJson = await historyRes.json();
      
      setRows(Array.isArray(historyJson.rows) ? historyJson.rows : []);
      setSummary(historyJson.summary || { total:0, taken:0, skipped:0 });

      // ดึงข้อมูล % ของยาแต่ละตัว
      const statsUrl = `${BASE_URL}/api/medicationlog/stats?userId=${userId}&from=${from}&to=${to}`;
      const statsRes = await fetch(statsUrl);
      if (statsRes.ok) {
        const statsJson = await statsRes.json();
        setMedStats(Array.isArray(statsJson) ? statsJson : []);
      }
      
    } catch (e) {
      console.error('fetch history error', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

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

  const renderDetailItem = ({ item }) => (
    <View style={styles.detailCard}>
      <View style={styles.detailHeader}>
        <View style={styles.dateTimeBadge}>
          <Text style={styles.detailDate}>{item.Date}</Text>
          <Text style={styles.detailTime}>{item.Time ? item.Time.slice(0,5) : '-'}</Text>
        </View>
        <View style={[
          styles.statusBadge,
          item.Status === 'กินแล้ว' ? styles.statusTaken :
          item.Status === 'ข้าม' ? styles.statusSkipped : styles.statusPending
        ]}>
          <Text style={styles.statusText}>{item.Status || 'รอกิน'}</Text>
        </View>
      </View>
      
      <Text style={styles.detailMedName}>{item.Name}</Text>
      <View style={styles.detailMeta}>
        <Ionicons name="medical" size={14} color="#666" />
        <Text style={styles.metaText}>
          {item.Dosage ? `${item.Dosage} ${item.DosageType || ''}` : '-'} • {item.TypeName || '-'}
        </Text>
      </View>
      
      {item.ActualTime && (
        <View style={styles.detailMeta}>
          <Ionicons name="time" size={14} color="#28a745" />
          <Text style={styles.metaText}>กินเวลา: {item.ActualTime.slice(0,5)}</Text>
        </View>
      )}
      
      {item.SideEffects && (
        <View style={styles.sideEffectBox}>
          <Ionicons name="warning" size={14} color="#dc3545" />
          <Text style={styles.sideEffectText}>{item.SideEffects}</Text>
        </View>
      )}
    </View>
  );

  const renderMedStatItem = ({ item }) => {
    const percent = parseFloat(item.AvgPerCount || 0);
    const pending = item.TotalScheduled - item.TotalTaken - item.TotalSkipped;
    
    return (
      <View style={styles.medStatCard}>
        <View style={styles.medStatHeader}>
          <Text style={styles.medStatName}>{item.MedicationName}</Text>
          <Text style={[
            styles.medStatPercent,
            percent >= 80 ? styles.percentHigh :
            percent >= 50 ? styles.percentMid : styles.percentLow
          ]}>
            {percent.toFixed(1)}%
          </Text>
        </View>
        
        <View style={styles.progressBarContainer}>
          <View style={[styles.progressBar, { width: `${percent}%` }]} />
        </View>
        
        <View style={styles.medStatDetails}>
          <View style={styles.statItem}>
            <Ionicons name="checkmark-circle" size={16} color="#28a745" />
            <Text style={styles.statLabel}>กินแล้ว</Text>
            <Text style={styles.statValue}>{item.TotalTaken}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="time" size={16} color="#ffc107" />
            <Text style={styles.statLabel}>รอกิน</Text>
            <Text style={styles.statValue}>{pending}</Text>
          </View>
          <View style={styles.statItem}>
            <Ionicons name="close-circle" size={16} color="#dc3545" />
            <Text style={styles.statLabel}>ข้าม</Text>
            <Text style={styles.statValue}>{item.TotalSkipped}</Text>
          </View>
        </View>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Header with Gradient */}
      <LinearGradient
        colors={['#4facfe', '#00f2fe']}
        style={styles.header}
      >
        <Text style={styles.title}>ประวัติการกินยา</Text>
        
        {/* Date Range Selector */}
        <View style={styles.dateRow}>
          <TouchableOpacity 
            onPress={() => setFromDate(d => { 
              const n = new Date(d); 
              n.setDate(n.getDate()-1); 
              return n; 
            })} 
            style={styles.navBtn}
          >
            <Ionicons name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity onPress={() => setShowPicker('from')} style={styles.dateBtn}>
            <Ionicons name="calendar" size={16} color="#fff" />
            <Text style={styles.dateText}>{displayDate(fromDate)}</Text>
          </TouchableOpacity>

          <Text style={styles.dateSeparator}>—</Text>

          <TouchableOpacity onPress={() => setShowPicker('to')} style={styles.dateBtn}>
            <Ionicons name="calendar" size={16} color="#fff" />
            <Text style={styles.dateText}>{displayDate(toDate)}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            onPress={() => setToDate(d => { 
              const n = new Date(d); 
              n.setDate(n.getDate()+1); 
              return n; 
            })} 
            style={styles.navBtn}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>
      </LinearGradient>

      {/* View Mode Tabs */}
      <View style={styles.tabContainer}>
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'summary' && styles.tabActive]}
          onPress={() => setViewMode('summary')}
        >
          <Ionicons name="stats-chart" size={20} color={viewMode === 'summary' ? '#4facfe' : '#999'} />
          <Text style={[styles.tabText, viewMode === 'summary' && styles.tabTextActive]}>
            สรุป
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'byMedication' && styles.tabActive]}
          onPress={() => setViewMode('byMedication')}
        >
          <Ionicons name="medical" size={20} color={viewMode === 'byMedication' ? '#4facfe' : '#999'} />
          <Text style={[styles.tabText, viewMode === 'byMedication' && styles.tabTextActive]}>
            แยกตามยา
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, viewMode === 'details' && styles.tabActive]}
          onPress={() => setViewMode('details')}
        >
          <Ionicons name="list" size={20} color={viewMode === 'details' ? '#4facfe' : '#999'} />
          <Text style={[styles.tabText, viewMode === 'details' && styles.tabTextActive]}>
            รายละเอียด
          </Text>
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <>
          {viewMode === 'summary' && (
            <ScrollView 
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.scrollContent}
            >
              <View style={styles.summaryCard}>
                <Text style={styles.summaryTitle}>สรุปภาพรวม</Text>
                <Text style={styles.summaryPeriod}>
                  {displayDate(fromDate)} — {displayDate(toDate)}
                </Text>
                
                <View style={styles.summaryGrid}>
                  <View style={[styles.summaryItem, styles.summaryTotal]}>
                    <Ionicons name="albums" size={32} color="#4facfe" />
                    <Text style={styles.summaryNumber}>{derived.total}</Text>
                    <Text style={styles.summaryLabel}>รายการทั้งหมด</Text>
                  </View>
                  
                  <View style={[styles.summaryItem, styles.summaryTaken]}>
                    <Ionicons name="checkmark-circle" size={32} color="#28a745" />
                    <Text style={styles.summaryNumber}>{derived.taken}</Text>
                    <Text style={styles.summaryLabel}>กินแล้ว ({derived.pctTaken}%)</Text>
                  </View>
                  
                  <View style={[styles.summaryItem, styles.summaryPending]}>
                    <Ionicons name="time" size={32} color="#ffc107" />
                    <Text style={styles.summaryNumber}>{derived.pending}</Text>
                    <Text style={styles.summaryLabel}>รอกิน ({derived.pctPending}%)</Text>
                  </View>
                  
                  <View style={[styles.summaryItem, styles.summarySkipped]}>
                    <Ionicons name="close-circle" size={32} color="#dc3545" />
                    <Text style={styles.summaryNumber}>{derived.skipped}</Text>
                    <Text style={styles.summaryLabel}>ข้าม ({derived.pctSkipped}%)</Text>
                  </View>
                </View>

                {/* Overall Progress Bar */}
                <View style={styles.overallProgress}>
                  <Text style={styles.overallLabel}>อัตราการกินยา</Text>
                  <View style={styles.overallBar}>
                    <View style={[styles.overallFill, { width: `${derived.pctTaken}%` }]} />
                  </View>
                  <Text style={styles.overallPercent}>{derived.pctTaken}%</Text>
                </View>
              </View>
            </ScrollView>
          )}

          {viewMode === 'byMedication' && (
            <FlatList
              data={medStats}
              keyExtractor={(i) => String(i.MedicationID)}
              renderItem={renderMedStatItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="medical-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>ไม่พบข้อมูลยาในช่วงนี้</Text>
                </View>
              }
            />
          )}

          {viewMode === 'details' && (
            <FlatList
              data={rows}
              keyExtractor={(i) => String(i.ScheduleID || `${i.MedicationID}_${i.Date}_${i.Time}`)}
              renderItem={renderDetailItem}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.listContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Ionicons name="document-text-outline" size={64} color="#ccc" />
                  <Text style={styles.emptyText}>ไม่พบประวัติในช่วงนี้</Text>
                </View>
              }
            />
          )}
        </>
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
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },
  header: {
    padding: 20,
    paddingTop: 16,
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 16
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center'
  },
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    padding: 10,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  dateText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 14
  },
  navBtn: {
    padding: 8,
    marginHorizontal: 4
  },
  dateSeparator: {
    color: '#fff',
    marginHorizontal: 8,
    fontSize: 16
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 4,
    elevation: 2
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 12,
    borderRadius: 8
  },
  tabActive: {
    backgroundColor: '#e3f2fd'
  },
  tabText: {
    color: '#999',
    fontSize: 14,
    fontWeight: '600'
  },
  tabTextActive: {
    color: '#4facfe'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40
  },
  loadingText: {
    marginTop: 12,
    color: '#666',
    fontSize: 14
  },
  scrollContent: {
    padding: 12
  },
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  summaryPeriod: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 24
  },
  summaryItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'transparent'
  },
  summaryTotal: {
    borderColor: '#4facfe',
    backgroundColor: '#e3f2fd'
  },
  summaryTaken: {
    borderColor: '#28a745',
    backgroundColor: '#d4edda'
  },
  summaryPending: {
    borderColor: '#ffc107',
    backgroundColor: '#fff3cd'
  },
  summarySkipped: {
    borderColor: '#dc3545',
    backgroundColor: '#f8d7da'
  },
  summaryNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginTop: 8
  },
  summaryLabel: {
    fontSize: 12,
    color: '#666',
    marginTop: 4,
    textAlign: 'center'
  },
  overallProgress: {
    marginTop: 8
  },
  overallLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8
  },
  overallBar: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 8,
    overflow: 'hidden'
  },
  overallFill: {
    height: '100%',
    backgroundColor: '#28a745',
    borderRadius: 8
  },
  overallPercent: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#28a745',
    textAlign: 'center',
    marginTop: 8
  },
  listContent: {
    padding: 12,
    paddingBottom: 24
  },
  medStatCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  medStatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  medStatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    flex: 1
  },
  medStatPercent: {
    fontSize: 24,
    fontWeight: 'bold'
  },
  percentHigh: {
    color: '#28a745'
  },
  percentMid: {
    color: '#ffc107'
  },
  percentLow: {
    color: '#dc3545'
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 12
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4facfe',
    borderRadius: 4
  },
  medStatDetails: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f0f0f0'
  },
  statItem: {
    alignItems: 'center',
    gap: 4
  },
  statLabel: {
    fontSize: 11,
    color: '#666'
  },
  statValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333'
  },
  detailCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  detailHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  dateTimeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f8f9fa',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8
  },
  detailDate: {
    fontSize: 12,
    color: '#666'
  },
  detailTime: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333'
  },
  statusBadge: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  statusTaken: {
    backgroundColor: '#d4edda'
  },
  statusSkipped: {
    backgroundColor: '#f8d7da'
  },
  statusPending: {
    backgroundColor: '#fff3cd'
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333'
  },
  detailMedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  detailMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4
  },
  metaText: {
    fontSize: 13,
    color: '#666'
  },
  sideEffectBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    padding: 8,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#dc3545'
  },
  sideEffectText: {
    flex: 1,
    fontSize: 13,
    color: '#dc3545'
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999'
  }
});