import React, { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, StyleSheet, FlatList, RefreshControl,
  TouchableOpacity, ActivityIndicator, ScrollView, TextInput, Alert
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

const formatMinutesToTime = (minutes) => {
  if (!minutes || minutes === 0) return '0 นาที';
  const hours = Math.floor(minutes / 60);
  const mins = Math.round(minutes % 60);
  if (hours > 0) {
    return mins > 0 ? `${hours} ชม. ${mins} นาที` : `${hours} ชั่วโมง`;
  }
  return `${mins} นาที`;
};

const getStatusColor = (status, isLate = false) => {
  if (status === 'กินแล้ว') return isLate ? '#ff9800' : '#28a745';
  if (status === 'ข้าม') return '#dc3545';
  if (status === 'ไม่ระบุ') return '#6c757d';
  return '#ffc107';
};

const getStatusIcon = (status, isLate = false) => {
  if (status === 'กินแล้ว') return isLate ? 'time' : 'checkmark-circle';
  if (status === 'ข้าม') return 'close-circle';
  if (status === 'ไม่ระบุ') return 'help-circle';
  return 'hourglass-outline';
};

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
  const [summary, setSummary] = useState({
    total: 0, onTime: 0, late: 0, taken: 0, skipped: 0, unknown: 0, avgLateMinutes: 0
  });
  const [medStats, setMedStats] = useState([]);
  const [viewMode, setViewMode] = useState('summary');
  const [displayMode, setDisplayMode] = useState('count');
  const [lateThreshold, setLateThreshold] = useState('1');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortBy, setSortBy] = useState('date'); // 'date' | 'name' | 'status'
  const [expandedCards, setExpandedCards] = useState(new Set());

  // ===================================
  // 📅 Quick Date Presets
  // ===================================

  const datePresets = [
    { label: '7 วัน', days: 7 },
    { label: '14 วัน', days: 14 },
    { label: '30 วัน', days: 30 },
    { label: '90 วัน', days: 90 },
  ];

  const applyDatePreset = (days) => {
    const today = new Date();
    const past = new Date();
    past.setDate(today.getDate() - (days - 1));
    setFromDate(past);
    setToDate(today);
  };

  // ===================================
  // 🔄 Data Fetching
  // ===================================

  const fetchData = useCallback(async (from, to) => {
    setLoading(true);
    try {
      const userId = await AsyncStorage.getItem('userId');
      if (!userId) {
        console.warn('⚠️ No userId found');
        setRows([]);
        setSummary({ total: 0, onTime: 0, late: 0, taken: 0, skipped: 0, unknown: 0, avgLateMinutes: 0 });
        setMedStats([]);
        setLoading(false);
        return;
      }

      console.log('🔄 Fetching history data:', { userId, from, to, lateThreshold });


      const [summaryRes, historyRes, statsRes] = await Promise.all([
        fetch(`${BASE_URL}/api/history/summary?userId=${userId}&from=${from}&to=${to}&lateThresholdHours=${lateThreshold}`),
        fetch(`${BASE_URL}/api/history?userId=${userId}&from=${from}&to=${to}`),
        fetch(`${BASE_URL}/api/medicationlog/stats?userId=${userId}&from=${from}&to=${to}`)
      ]);

      // ✅ ตรวจสอบ Response แต่ละตัว
      if (!summaryRes.ok) {
        console.error('❌ Summary API error:', summaryRes.status, summaryRes.statusText);
        const errorText = await summaryRes.text();
        console.error('Error details:', errorText);
      } else {
        const summaryJson = await summaryRes.json();
        console.log('✅ Summary data:', summaryJson);
        setSummary(summaryJson || {
          total: 0, onTime: 0, late: 0, taken: 0, skipped: 0, unknown: 0, avgLateMinutes: 0
        });
      }

      if (!historyRes.ok) {
        console.error('❌ History API error:', historyRes.status, historyRes.statusText);
        const errorText = await historyRes.text();
        console.error('Error details:', errorText);
      } else {
        const historyJson = await historyRes.json();
        console.log('✅ History rows:', historyJson.rows?.length || 0);
        setRows(Array.isArray(historyJson.rows) ? historyJson.rows : []);
      }

      if (!statsRes.ok) {
        console.error('❌ Stats API error:', statsRes.status, statsRes.statusText);
        const errorText = await statsRes.text();
        console.error('Error details:', errorText);
      } else {
        const statsJson = await statsRes.json();
        console.log('✅ Med stats:', statsJson);
        console.log('✅ Med stats count:', statsJson?.length || 0);
        setMedStats(Array.isArray(statsJson) ? statsJson : []);
      }

    } catch (e) {
      console.error('❌ Fetch history error:', e);
      Alert.alert('ข้อผิดพลาด', `ไม่สามารถโหลดข้อมูลได้: ${e.message}`);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [lateThreshold]);

  useEffect(() => {
    fetchData(formatLocalDate(fromDate), formatLocalDate(toDate));
  }, [fromDate, toDate, fetchData]);

  const onRefresh = () => {
    setRefreshing(true);
    fetchData(formatLocalDate(fromDate), formatLocalDate(toDate));
  };

  // ===================================
  // 🔍 Search & Filter Logic
  // ===================================

  const filteredRows = useMemo(() => {
    let filtered = [...rows];

    // Search by medication name
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(item =>
        item.Name?.toLowerCase().includes(query)
      );
    }

    // Filter by status
    if (filterStatus !== 'all') {
      filtered = filtered.filter(item => {
        if (filterStatus === 'late') {
          return item.Status === 'กินแล้ว' && item.LateMinutes > 0;
        }
        return item.Status === filterStatus;
      });
    }

    // Sort
    filtered.sort((a, b) => {
      if (sortBy === 'date') {
        const dateA = new Date(`${a.Date} ${a.Time}`);
        const dateB = new Date(`${b.Date} ${b.Time}`);
        return dateB - dateA;
      } else if (sortBy === 'name') {
        return (a.Name || '').localeCompare(b.Name || '');
      } else if (sortBy === 'status') {
        return (a.Status || '').localeCompare(b.Status || '');
      }
      return 0;
    });

    return filtered;
  }, [rows, searchQuery, filterStatus, sortBy]);

  const filteredMedStats = useMemo(() => {
    if (!searchQuery.trim()) return medStats;
    const query = searchQuery.toLowerCase();
    return medStats.filter(item =>
      item.MedicationName?.toLowerCase().includes(query)
    );
  }, [medStats, searchQuery]);

  // ===================================
  // 📊 Calculated Stats
  // ===================================

  const dayCount = Math.ceil((toDate - fromDate) / (1000 * 60 * 60 * 24)) + 1;
  const avgPerDay = summary.total > 0 ? (summary.total / dayCount).toFixed(1) : 0;
  const complianceRate = summary.total > 0 ? ((summary.taken / summary.total) * 100).toFixed(1) : 0;
  const onTimeRate = summary.taken > 0 ? ((summary.onTime / summary.taken) * 100).toFixed(1) : 0;

  // ===================================
  // 🎯 Toggle Expand Card
  // ===================================

  const toggleExpand = (id) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  // ===================================
  // 🎨 Render Functions
  // ===================================

  const renderMedStatItem = ({ item }) => {
    // ✅ ป้องกัน NaN และ Infinity
    const totalScheduled = parseInt(item.TotalScheduled) || 0;
    const totalTaken = parseInt(item.TotalTaken) || 0;
    const totalOnTime = parseInt(item.TotalOnTime) || 0;
    const totalLate = parseInt(item.TotalLate) || 0;
    const totalSkipped = parseInt(item.TotalSkipped) || 0;
    const totalUnknown = parseInt(item.TotalUnknown) || 0;
    const avgLateMinutes = parseFloat(item.AvgLateMinutes) || 0;

    // ✅ คำนวณ percentage อย่างปลอดภัย
    const percent = totalScheduled > 0
      ? parseFloat(((totalTaken / totalScheduled) * 100).toFixed(1))
      : 0;

    const isExpanded = expandedCards.has(item.MedicationID);

    return (
      <TouchableOpacity
        style={styles.medStatCard}
        onPress={() => toggleExpand(item.MedicationID)}
        activeOpacity={0.7}
      >
        <View style={styles.medStatHeader}>
          <View style={styles.medStatHeaderLeft}>
            <Text style={styles.medStatName}>{item.MedicationName}</Text>
            <Text style={styles.medStatSubtext}>
              กิน {totalTaken} จาก {totalScheduled} ครั้ง
            </Text>
          </View>
          <View style={styles.medStatHeaderRight}>
            <Text style={[
              styles.medStatPercent,
              percent >= 80 ? styles.percentHigh :
                percent >= 50 ? styles.percentMid : styles.percentLow
            ]}>
              {percent.toFixed(1)}%
            </Text>
            <Ionicons
              name={isExpanded ? 'chevron-up' : 'chevron-down'}
              size={20}
              color="#999"
            />
          </View>
        </View>

        <View style={styles.progressBarContainer}>
          <View style={[
            styles.progressBar,
            {
              width: `${Math.min(percent, 100)}%`,
              backgroundColor: percent >= 80 ? '#28a745' : percent >= 50 ? '#ffc107' : '#dc3545'
            }
          ]} />
        </View>

        {isExpanded && (
          <>
            <View style={styles.medStatDetails}>
              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="checkmark-circle" size={16} color="#28a745" />
                  <Text style={styles.statLabel}>กินตรงเวลา</Text>
                  <Text style={styles.statValue}>
                    {displayMode === 'count'
                      ? totalOnTime
                      : totalScheduled > 0
                        ? `${((totalOnTime / totalScheduled) * 100).toFixed(1)}%`
                        : '0%'}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="time" size={16} color="#ff9800" />
                  <Text style={styles.statLabel}>กินช้า</Text>
                  <Text style={styles.statValue}>
                    {displayMode === 'count'
                      ? totalLate
                      : totalScheduled > 0
                        ? `${((totalLate / totalScheduled) * 100).toFixed(1)}%`
                        : '0%'}
                  </Text>
                </View>
              </View>

              <View style={styles.statRow}>
                <View style={styles.statItem}>
                  <Ionicons name="close-circle" size={16} color="#dc3545" />
                  <Text style={styles.statLabel}>ข้าม</Text>
                  <Text style={styles.statValue}>
                    {displayMode === 'count'
                      ? totalSkipped
                      : totalScheduled > 0
                        ? `${((totalSkipped / totalScheduled) * 100).toFixed(1)}%`
                        : '0%'}
                  </Text>
                </View>

                <View style={styles.statItem}>
                  <Ionicons name="help-circle" size={16} color="#6c757d" />
                  <Text style={styles.statLabel}>ไม่ระบุ</Text>
                  <Text style={styles.statValue}>
                    {displayMode === 'count'
                      ? totalUnknown
                      : totalScheduled > 0
                        ? `${((totalUnknown / totalScheduled) * 100).toFixed(1)}%`
                        : '0%'}
                  </Text>
                </View>
              </View>
            </View>

            {avgLateMinutes > 0 && (
              <View style={styles.avgLateContainer}>
                <Ionicons name="time-outline" size={16} color="#ff9800" />
                <Text style={styles.avgLateText}>
                  เฉลี่ยกินช้า: {formatMinutesToTime(avgLateMinutes)}
                </Text>
              </View>
            )}
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderDetailItem = ({ item }) => {
    // ✅ ตรวจสอบ LateMinutes อย่างปลอดภัย
    const lateMinutes = parseInt(item.LateMinutes) || 0;
    const isLate = item.Status === 'กินแล้ว' && item.IsLate === 1 && lateMinutes > 0;
    const isExpanded = expandedCards.has(item.ScheduleID);

    return (
      <TouchableOpacity
        style={styles.detailCard}
        onPress={() => toggleExpand(item.ScheduleID)}
        activeOpacity={0.7}
      >
        <View style={styles.detailHeader}>
          <View style={styles.dateTimeBadge}>
            <Ionicons name="calendar-outline" size={14} color="#666" />
            <Text style={styles.detailDate}>{item.Date}</Text>
            <Text style={styles.detailTime}>{item.Time ? item.Time.slice(0, 5) : '-'}</Text>
          </View>
          <View style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.Status, isLate) }
          ]}>
            <Ionicons
              name={getStatusIcon(item.Status, isLate)}
              size={14}
              color="#fff"
            />
            <Text style={styles.statusText}>
              {item.Status === 'กินแล้ว' && isLate ? 'กินช้า' : item.Status || 'รอกิน'}
            </Text>
          </View>
        </View>

        <Text style={styles.detailMedName}>{item.Name}</Text>

        {!isExpanded ? (
          <View style={styles.detailMetaRow}>
            <View style={styles.detailMeta}>
              <Ionicons name="medical" size={14} color="#666" />
              <Text style={styles.metaText}>
                {item.Dosage ? `${item.Dosage} ${item.DosageType || ''}` : '-'}
              </Text>
            </View>
            <Ionicons name="chevron-down" size={16} color="#999" />
          </View>
        ) : (
          <>
            <View style={styles.detailExpandedContent}>
              <View style={styles.detailMeta}>
                <Ionicons name="medical" size={14} color="#666" />
                <Text style={styles.metaText}>
                  {item.Dosage ? `${item.Dosage} ${item.DosageType || ''}` : '-'} • {item.TypeName || '-'}
                </Text>
              </View>

              {item.ActualTime && (
                <View style={styles.detailMeta}>
                  <Ionicons name="time" size={14} color={isLate ? "#ff9800" : "#28a745"} />
                  <Text style={[styles.metaText, isLate && styles.lateText]}>
                    กินเวลา: {item.ActualTime.slice(0, 5)}
                    {isLate && lateMinutes > 0 && ` (ช้า ${formatMinutesToTime(lateMinutes)})`}
                  </Text>
                </View>
              )}

              {item.SideEffects && (
                <View style={styles.sideEffectBox}>
                  <Ionicons name="warning" size={14} color="#dc3545" />
                  <Text style={styles.sideEffectText}>{item.SideEffects}</Text>
                </View>
              )}
            </View>
            <View style={styles.expandIconContainer}>
              <Ionicons name="chevron-up" size={16} color="#999" />
            </View>
          </>
        )}
      </TouchableOpacity>
    );
  };

  const renderSummaryCard = (icon, label, value, color, sublabel = null) => (
    <View style={[styles.summaryItem, { borderColor: color }]}>
      <Ionicons name={icon} size={28} color={color} />
      <Text style={styles.summaryNumber}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
      {sublabel && <Text style={styles.summarySublabel}>{sublabel}</Text>}
    </View>
  );

  // ===================================
  // 🎨 Main Render
  // ===================================

  return (
    <View style={styles.container}>
      {/* ===== Header ===== */}
      <LinearGradient colors={['#4facfe', '#00f2fe']} style={styles.header}>
        <Text style={styles.title}>📊 ประวัติการกินยา</Text>

        {/* Date Navigation */}
        <View style={styles.dateRow}>
          <TouchableOpacity
            onPress={() => setFromDate(d => { const n = new Date(d); n.setDate(n.getDate() - 1); return n; })}
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
            onPress={() => setToDate(d => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; })}
            style={styles.navBtn}
          >
            <Ionicons name="chevron-forward" size={24} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* Date Info */}
        <View style={styles.dateInfoBox}>
          <Text style={styles.dateInfoText}>
            📅 {dayCount} วัน • {summary.total} ครั้ง ({avgPerDay} ครั้ง/วัน) • อัตราปฏิบัติตาม {complianceRate}%
          </Text>
        </View>

        {/* Quick Date Presets */}
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.presetsScroll}>
          {datePresets.map(preset => (
            <TouchableOpacity
              key={preset.days}
              style={styles.presetBtn}
              onPress={() => applyDatePreset(preset.days)}
            >
              <Text style={styles.presetBtnText}>{preset.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </LinearGradient>

      {/* ===== View Mode Tabs ===== */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, viewMode === 'summary' && styles.tabActive]}
          onPress={() => setViewMode('summary')}
        >
          <Ionicons name="stats-chart" size={20} color={viewMode === 'summary' ? '#4facfe' : '#999'} />
          <Text style={[styles.tabText, viewMode === 'summary' && styles.tabTextActive]}>สรุป</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, viewMode === 'byMedication' && styles.tabActive]}
          onPress={() => setViewMode('byMedication')}
        >
          <Ionicons name="medical" size={20} color={viewMode === 'byMedication' ? '#4facfe' : '#999'} />
          <Text style={[styles.tabText, viewMode === 'byMedication' && styles.tabTextActive]}>แยกตามยา</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tab, viewMode === 'details' && styles.tabActive]}
          onPress={() => setViewMode('details')}
        >
          <Ionicons name="list" size={20} color={viewMode === 'details' ? '#4facfe' : '#999'} />
          <Text style={[styles.tabText, viewMode === 'details' && styles.tabTextActive]}>รายละเอียด</Text>
        </TouchableOpacity>
      </View>

      {/* ===== Loading State ===== */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4facfe" />
          <Text style={styles.loadingText}>กำลังโหลด...</Text>
        </View>
      ) : (
        <>
          {/* ===== SUMMARY VIEW ===== */}
          {viewMode === 'summary' && (
            <ScrollView
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              contentContainerStyle={styles.scrollContent}
            >
              {/* Late Threshold Filter */}
              <View style={styles.filterCard}>
                <View style={styles.filterHeader}>
                  <Ionicons name="time-outline" size={20} color="#4facfe" />
                  <Text style={styles.filterLabel}>เกณฑ์กินช้า</Text>
                </View>
                <View style={styles.thresholdButtons}>
                  {['0.5', '1', '2', '3'].map(hr => (
                    <TouchableOpacity
                      key={hr}
                      style={[styles.thresholdBtn, lateThreshold === hr && styles.thresholdBtnActive]}
                      onPress={() => setLateThreshold(hr)}
                    >
                      <Text style={[styles.thresholdBtnText, lateThreshold === hr && styles.thresholdBtnTextActive]}>
                        {parseFloat(hr) < 1 ? `${parseFloat(hr) * 60} นาที` : `${hr} ชม.`}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              {/* Summary Card */}
              <View style={styles.summaryCard}>
                <View style={styles.summaryCardHeader}>
                  <Text style={styles.summaryTitle}>📈 สรุปภาพรวม</Text>
                  <Text style={styles.summaryPeriod}>
                    {displayDate(fromDate)} — {displayDate(toDate)}
                  </Text>
                </View>

                {/* Stats Grid */}
                <View style={styles.summaryGrid}>
                  {renderSummaryCard('albums', 'รายการทั้งหมด', summary.total || 0, '#4facfe')}
                  {renderSummaryCard('checkmark-circle', 'กินตรงเวลา', summary.onTime || 0, '#28a745', `${onTimeRate}%`)}
                  {renderSummaryCard('time', 'กินช้า', summary.late || 0, '#ff9800')}
                  {renderSummaryCard('close-circle', 'ข้าม', summary.skipped || 0, '#dc3545')}
                  {renderSummaryCard('help-circle', 'ไม่ระบุ', summary.unknown || 0, '#6c757d')}
                </View>

                {/* Average Late Time */}
                {summary.avgLateMinutes > 0 && (
                  <View style={styles.avgLateCard}>
                    <Ionicons name="time-outline" size={24} color="#ff9800" />
                    <View style={styles.avgLateContent}>
                      <Text style={styles.avgLateTitle}>⏱️ เฉลี่ยกินช้า</Text>
                      <Text style={styles.avgLateValue}>
                        {formatMinutesToTime(summary.avgLateMinutes)}
                      </Text>
                    </View>
                  </View>
                )}

                {/* Compliance Rate */}
                <View style={styles.complianceCard}>
                  <View style={styles.complianceHeader}>
                    <Text style={styles.complianceTitle}>🎯 อัตราการปฏิบัติตาม</Text>
                    <Text style={styles.compliancePercent}>{complianceRate}%</Text>
                  </View>
                  <View style={styles.complianceBarBg}>
                    <View
                      style={[
                        styles.complianceBarFill,
                        {
                          width: `${complianceRate}%`,
                          backgroundColor: complianceRate >= 80 ? '#28a745' :
                            complianceRate >= 60 ? '#ffc107' : '#dc3545'
                        }
                      ]}
                    />
                  </View>
                  <Text style={styles.complianceSubtext}>
                    กิน {summary.taken} จาก {summary.total} ครั้ง
                  </Text>
                </View>
              </View>
            </ScrollView>
          )}

          {/* ===== BY MEDICATION VIEW ===== */}
          {viewMode === 'byMedication' && (
            <>
              {/* Search & Display Mode */}
              <View style={styles.controlsContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ค้นหายา..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>

                <View style={styles.displayModeContainer}>
                  <TouchableOpacity
                    style={[styles.displayModeBtn, displayMode === 'count' && styles.displayModeBtnActive]}
                    onPress={() => setDisplayMode('count')}
                  >
                    <Ionicons name="calculator" size={16} color={displayMode === 'count' ? '#fff' : '#666'} />
                    <Text style={[styles.displayModeBtnText, displayMode === 'count' && styles.displayModeBtnTextActive]}>
                      ครั้ง
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.displayModeBtn, displayMode === 'percent' && styles.displayModeBtnActive]}
                    onPress={() => setDisplayMode('percent')}
                  >
                    <Ionicons name="pie-chart" size={16} color={displayMode === 'percent' ? '#fff' : '#666'} />
                    <Text style={[styles.displayModeBtnText, displayMode === 'percent' && styles.displayModeBtnTextActive]}>
                      %
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              <FlatList
                data={filteredMedStats}
                keyExtractor={(i) => String(i.MedicationID)}
                renderItem={renderMedStatItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="medical-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>
                      {searchQuery ? 'ไม่พบยาที่ค้นหา' : 'ไม่พบข้อมูลยาในช่วงนี้'}
                    </Text>
                  </View>
                }
              />
            </>
          )}

          {/* ===== DETAILS VIEW ===== */}
          {viewMode === 'details' && (
            <>
              {/* Search & Filters */}
              <View style={styles.controlsContainer}>
                <View style={styles.searchContainer}>
                  <Ionicons name="search" size={20} color="#999" />
                  <TextInput
                    style={styles.searchInput}
                    placeholder="ค้นหายา..."
                    value={searchQuery}
                    onChangeText={setSearchQuery}
                  />
                  {searchQuery.length > 0 && (
                    <TouchableOpacity onPress={() => setSearchQuery('')}>
                      <Ionicons name="close-circle" size={20} color="#999" />
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Status Filter */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.statusFilterScroll}
                style={{ flexGrow: 0 }}
              >
                <TouchableOpacity
                  style={[
                    styles.statusFilterBtn,
                    filterStatus === 'all' && styles.statusFilterBtnActive
                  ]}
                  onPress={() => setFilterStatus('all')}
                >
                  <Ionicons
                    name="list"
                    size={16}
                    color={filterStatus === 'all' ? '#fff' : '#666'}
                  />
                  <Text
                    style={[
                      styles.statusFilterText,
                      filterStatus === 'all' && styles.statusFilterTextActive
                    ]}
                    numberOfLines={1}
                  >
                    ทั้งหมด
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusFilterBtn,
                    filterStatus === 'taken' && styles.statusFilterBtnActive
                  ]}
                  onPress={() => setFilterStatus('taken')}
                >
                  <Ionicons
                    name="checkmark-circle"
                    size={16}
                    color={filterStatus === 'taken' ? '#fff' : '#28a745'}
                  />
                  <Text
                    style={[
                      styles.statusFilterText,
                      filterStatus === 'taken' && styles.statusFilterTextActive
                    ]}
                    numberOfLines={1}
                  >
                    กินแล้ว
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusFilterBtn,
                    filterStatus === 'late' && styles.statusFilterBtnActive
                  ]}
                  onPress={() => setFilterStatus('late')}
                >
                  <Ionicons
                    name="time"
                    size={16}
                    color={filterStatus === 'late' ? '#fff' : '#ffc107'}
                  />
                  <Text
                    style={[
                      styles.statusFilterText,
                      filterStatus === 'late' && styles.statusFilterTextActive
                    ]}
                    numberOfLines={1}
                  >
                    กินช้า
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusFilterBtn,
                    filterStatus === 'skipped' && styles.statusFilterBtnActive
                  ]}
                  onPress={() => setFilterStatus('skipped')}
                >
                  <Ionicons
                    name="close-circle"
                    size={16}
                    color={filterStatus === 'skipped' ? '#fff' : '#dc3545'}
                  />
                  <Text
                    style={[
                      styles.statusFilterText,
                      filterStatus === 'skipped' && styles.statusFilterTextActive
                    ]}
                    numberOfLines={1}
                  >
                    ข้าม
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[
                    styles.statusFilterBtn,
                    filterStatus === 'pending' && styles.statusFilterBtnActive
                  ]}
                  onPress={() => setFilterStatus('pending')}
                >
                  <Ionicons
                    name="hourglass"
                    size={16}
                    color={filterStatus === 'pending' ? '#fff' : '#999'}
                  />
                  <Text
                    style={[
                      styles.statusFilterText,
                      filterStatus === 'pending' && styles.statusFilterTextActive
                    ]}
                    numberOfLines={1}
                  >
                    ไม่ระบุ
                  </Text>
                </TouchableOpacity>
              </ScrollView>

              {/* Sort Options */}
              <View style={styles.sortContainer}>
                <Text style={styles.sortLabel}>เรียงตาม:</Text>
                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'date' && styles.sortBtnActive]}
                  onPress={() => setSortBy('date')}
                >
                  <Ionicons name="calendar" size={14} color={sortBy === 'date' ? '#fff' : '#666'} />
                  <Text style={[styles.sortBtnText, sortBy === 'date' && styles.sortBtnTextActive]}>วันที่</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'name' && styles.sortBtnActive]}
                  onPress={() => setSortBy('name')}
                >
                  <Ionicons name="medical" size={14} color={sortBy === 'name' ? '#fff' : '#666'} />
                  <Text style={[styles.sortBtnText, sortBy === 'name' && styles.sortBtnTextActive]}>ชื่อยา</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.sortBtn, sortBy === 'status' && styles.sortBtnActive]}
                  onPress={() => setSortBy('status')}
                >
                  <Ionicons name="flag" size={14} color={sortBy === 'status' ? '#fff' : '#666'} />
                  <Text style={[styles.sortBtnText, sortBy === 'status' && styles.sortBtnTextActive]}>สถานะ</Text>
                </TouchableOpacity>
              </View>

              {/* Results Count */}
              {(searchQuery || filterStatus !== 'all') && (
                <View style={styles.resultsCountContainer}>
                  <Text style={styles.resultsCountText}>
                    แสดง {filteredRows.length} รายการจากทั้งหมด {rows.length} รายการ
                  </Text>
                </View>
              )}

              <FlatList
                data={filteredRows}
                keyExtractor={(i) => String(i.ScheduleID || `${i.MedicationID}_${i.Date}_${i.Time}`)}
                renderItem={renderDetailItem}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
                contentContainerStyle={styles.listContent}
                ListEmptyComponent={
                  <View style={styles.emptyContainer}>
                    <Ionicons name="document-text-outline" size={64} color="#ccc" />
                    <Text style={styles.emptyText}>
                      {searchQuery || filterStatus !== 'all'
                        ? 'ไม่พบรายการที่ตรงกับเงื่อนไข'
                        : 'ไม่พบประวัติในช่วงนี้'}
                    </Text>
                  </View>
                }
              />
            </>
          )}
        </>
      )}

      {/* ===== Date Picker ===== */}
      {showPicker && (
        <DateTimePicker
          value={showPicker === 'from' ? fromDate : toDate}
          mode="date"
          display="default"
          onChange={(e, date) => {
            setShowPicker(null);
            if (!date) return;
            if (showPicker === 'from') {
              if (date > toDate) {
                Alert.alert('ข้อผิดพลาด', 'วันที่เริ่มต้นต้องไม่เกินวันที่สิ้นสุด');
                return;
              }
              setFromDate(date);
            } else {
              if (date < fromDate) {
                Alert.alert('ข้อผิดพลาด', 'วันที่สิ้นสุดต้องไม่น้อยกว่าวันที่เริ่มต้น');
                return;
              }
              setToDate(date);
            }
          }}
        />
      )}
    </View>
  );
};

export default HistoryScreen;

// ===================================
// 🎨 Styles
// ===================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa'
  },

  // ===== Header Styles =====
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
    marginBottom: 16,
    letterSpacing: 0.5
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12
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
  dateInfoBox: {
    marginTop: 8,
    backgroundColor: 'rgba(255,255,255,0.15)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignSelf: 'center'
  },
  dateInfoText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },
  presetsScroll: {
    marginTop: 12
  },
  presetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)'
  },
  presetBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600'
  },

  // ===== Tab Styles =====
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 12,
    padding: 4,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
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

  // ===== Loading Styles =====
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

  // ===== Content Styles =====
  scrollContent: {
    padding: 12,
    paddingBottom: 24
  },

  // ===== Filter Card Styles =====
  filterCard: {
    backgroundColor: '#fff',
    marginHorizontal: 12,
    marginTop: 12,
    padding: 16,
    borderRadius: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2
  },
  filterHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  thresholdButtons: {
    flexDirection: 'row',
    gap: 8
  },
  thresholdBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#e1e8ed',
    alignItems: 'center'
  },
  thresholdBtnActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe'
  },
  thresholdBtnText: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600'
  },
  thresholdBtnTextActive: {
    color: '#fff'
  },

  // ===== Summary Card Styles =====
  summaryCard: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    marginTop: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3
  },
  summaryCardHeader: {
    marginBottom: 16
  },
  summaryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4
  },
  summaryPeriod: {
    fontSize: 13,
    color: '#666'
  },
  summaryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginBottom: 16
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
  summarySublabel: {
    fontSize: 10,
    color: '#999',
    marginTop: 2
  },
  avgLateCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginTop: 16,
    padding: 14,
    backgroundColor: '#fff3cd',
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800'
  },
  avgLateContent: {
    flex: 1
  },
  avgLateTitle: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4
  },
  avgLateValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#ff9800'
  },
  complianceCard: {
    marginTop: 16,
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 12
  },
  complianceHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  complianceTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333'
  },
  compliancePercent: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#4facfe'
  },
  complianceBarBg: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
    marginBottom: 8
  },
  complianceBarFill: {
    height: '100%',
    borderRadius: 6
  },
  complianceSubtext: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },

  // ===== Controls Styles =====
  controlsContainer: {
    padding: 12,
    paddingBottom: 0
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    marginBottom: 12
  },
  searchInput: {
    flex: 1,
    fontSize: 14,
    color: '#333'
  },
  displayModeContainer: {
    flexDirection: 'row',
    gap: 8
  },
  displayModeBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#fff',
    borderWidth: 2,
    borderColor: '#e1e8ed',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  displayModeBtnActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe'
  },
  displayModeBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666'
  },
  displayModeBtnTextActive: {
    color: '#fff'
  },

  // ===== Status Filter Styles =====
  statusFilterScroll: {
    flexGrow: 0,
    flexShrink: 0,
    paddingHorizontal: 12,
    marginBottom: 12,
    maxHeight: 50
  },
  statusFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingHorizontal: 16,
    minWidth: 100,
    maxWidth: 120,
    backgroundColor: '#fff',
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e1e8ed',
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 1
  },
  statusFilterBtnActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe',
    elevation: 2
  },
  statusFilterText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textAlign: 'center',
    flexShrink: 1
  },
  statusFilterTextActive: {
    color: '#fff'
  },

  // ===== Sort Styles =====
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    marginBottom: 12,
    gap: 8
  },
  sortLabel: {
    fontSize: 13,
    color: '#666',
    fontWeight: '600'
  },
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e1e8ed'
  },
  sortBtnActive: {
    backgroundColor: '#4facfe',
    borderColor: '#4facfe'
  },
  sortBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666'
  },
  sortBtnTextActive: {
    color: '#fff'
  },

  // ===== Results Count =====
  resultsCountContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#f8f9fa',
    marginHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12
  },
  resultsCountText: {
    fontSize: 12,
    color: '#666',
    textAlign: 'center'
  },

  // ===== List Styles =====
  listContent: {
    padding: 12,
    paddingBottom: 24
  },

  // ===== Medication Stats Card =====
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
  medStatHeaderLeft: {
    flex: 1,
    marginRight: 12
  },
  medStatHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8
  },
  medStatName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 2
  },
  medStatSubtext: {
    fontSize: 12,
    color: '#999'
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
    borderRadius: 4
  },
  medStatDetails: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f0f0f0'
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12
  },
  statItem: {
    alignItems: 'center',
    gap: 4,
    flex: 1
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
  avgLateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderColor: '#f0f0f0'
  },
  avgLateText: {
    fontSize: 12,
    color: '#ff9800',
    fontWeight: '600'
  },

  // ===== Detail Card Styles =====
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
    gap: 6,
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
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 20
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff'
  },
  detailMedName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8
  },
  detailMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
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
  lateText: {
    color: '#ff9800',
    fontWeight: '600'
  },
  detailExpandedContent: {
    marginTop: 8
  },
  expandIconContainer: {
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderColor: '#f0f0f0'
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

  // ===== Empty State =====
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center'
  },
});