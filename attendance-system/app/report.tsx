import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { handleError } from '../utils/errors';

const TABS = ['Overview', 'Subjects', 'Sections'];

export default function ReportScreen() {
  const [tab, setTab] = useState(0);
  const [data, setData] = useState<any>(null);
  const [students, setStudents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/department');
      setData(res.data);
      const st = await api.get('/students');
      setStudents(st.data);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Reports" showBack />
      <View style={styles.tabs}>
        {TABS.map((t, i) => (
          <TouchableOpacity key={t} style={[styles.tab, tab === i && styles.tabOn]} onPress={() => setTab(i)}>
            <Text style={[styles.tabText, tab === i && styles.tabTextOn]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {tab === 0 && data && (
            <>
              <View style={styles.grid}>
                <Stat label="Students" value={data.total_students} color={COLORS.green} />
                <Stat label="Faculty" value={data.total_faculty} color={COLORS.blue} />
                <Stat label="Subjects" value={data.total_subjects} color={COLORS.purple} />
                <Stat label="Avg %" value={`${data.avg_attendance}%`} color={COLORS.orange} />
              </View>
              <View style={styles.gauge}>
                <Text style={[styles.gaugeVal, { color: data.avg_attendance >= 75 ? COLORS.green : COLORS.red }]}>
                  {data.avg_attendance}%
                </Text>
                <Text style={styles.gaugeLbl}>Overall Attendance</Text>
              </View>
            </>
          )}
          {tab === 1 &&
            (data?.subject_stats || []).map((s: any) => (
              <View key={s.code} style={styles.card}>
                <Text style={styles.cardTitle}>{s.name}</Text>
                <Text style={styles.cardSub}>{s.faculty} · {s.code}</Text>
                <View style={styles.barBg}>
                  <View style={[styles.barFill, { width: `${s.percentage}%` }]} />
                </View>
                <Text style={styles.pct}>{s.percentage}%</Text>
              </View>
            ))}
          {tab === 2 &&
            (data?.section_stats || []).map((s: any) => (
              <View key={s.section} style={styles.card}>
                <Text style={styles.cardTitle}>Section {s.section}</Text>
                <Text style={styles.cardSub}>{s.students} students · {s.percentage}% attendance</Text>
              </View>
            ))}
          {tab === 0 && (
            <Text style={styles.section}>Students (tap Students tab in menu for full list)</Text>
          )}
        </ScrollView>
      )}
    </View>
  );
}

function Stat({ label, value, color }: any) {
  return (
    <View style={[styles.stat, { borderColor: color }]}>
      <Text style={[styles.statVal, { color }]}>{value}</Text>
      <Text style={styles.statLbl}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  tabs: { flexDirection: 'row', padding: 12, gap: 8 },
  tab: { flex: 1, padding: 10, borderRadius: 10, backgroundColor: COLORS.card, alignItems: 'center' },
  tabOn: { backgroundColor: COLORS.green },
  tabText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },
  tabTextOn: { color: '#07090f', fontWeight: '800' },
  scroll: { padding: 16, paddingBottom: 40 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', backgroundColor: COLORS.card, padding: 14, borderRadius: 14, borderWidth: 1 },
  statVal: { fontSize: 24, fontWeight: '800' },
  statLbl: { color: COLORS.textSecondary, fontSize: 12 },
  gauge: { alignItems: 'center', marginTop: 24, backgroundColor: COLORS.card, padding: 24, borderRadius: 16 },
  gaugeVal: { fontSize: 48, fontWeight: '800' },
  gaugeLbl: { color: COLORS.textSecondary },
  card: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.textPrimary, fontWeight: '800' },
  cardSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  barBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 3 },
  pct: { color: COLORS.green, fontWeight: '800', marginTop: 4 },
  section: { color: COLORS.textMuted, marginTop: 16 },
});
