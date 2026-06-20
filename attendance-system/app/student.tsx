import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator } from 'react-native';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { getCurrentUser } from '../services/auth';
import { handleError } from '../utils/errors';

export default function StudentDashboard() {
  const [user, setUser] = useState<any>(null);
  const [report, setReport] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      setUser(u);
      const res = await api.get(`/reports/student/${u.register_number}`);
      setReport(res.data);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const pctColor = (p: number) => {
    if (p >= 75) return COLORS.green;
    if (p >= 65) return COLORS.orange;
    return COLORS.red;
  };

  const statusColor = (s: string) => {
    if (s === 'present') return COLORS.green;
    if (s === 'late') return COLORS.orange;
    if (s === 'od') return COLORS.blue;
    return COLORS.red;
  };

  const overall = report?.overall_percentage || 0;

  return (
    <View style={styles.container}>
      <AppBar title="Student Dashboard" />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.purple} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.icon}>🎓</Text>
          <Text style={styles.name}>{report?.name || user?.name}</Text>
          <Text style={styles.sub}>
            {report?.register_number} · {report?.year} · Section {report?.section}
          </Text>
          <Text style={styles.dept}>{report?.department}</Text>

          <View style={styles.overallCard}>
            <Text style={[styles.bigPct, { color: pctColor(overall) }]}>{overall}%</Text>
            <Text style={styles.overallSub}>
              Present {report?.total_present} / {report?.total_classes} classes
            </Text>
            <View style={styles.barBg}>
              <View style={[styles.barFill, { width: `${overall}%`, backgroundColor: pctColor(overall) }]} />
            </View>
            {report?.below_75 && (
              <Text style={styles.warn}>
                ⚠ Attendance below 75%! You need {report.classes_needed} more classes.
              </Text>
            )}
          </View>

          <Text style={styles.section}>Subject-wise</Text>
          {(report?.subject_wise || []).map((s: any) => (
            <View key={s.code} style={styles.subCard}>
              <Text style={styles.subName}>{s.name}</Text>
              <Text style={styles.subCode}>
                {s.code} — {s.present}/{s.total} ({s.percentage}%)
              </Text>
              <View style={styles.barBg}>
                <View
                  style={[styles.barFill, { width: `${s.percentage}%`, backgroundColor: pctColor(s.percentage) }]}
                />
              </View>
            </View>
          ))}

          <Text style={styles.section}>Recent History</Text>
          {(report?.recent || []).map((r: any, i: number) => (
            <View key={i} style={styles.histRow}>
              <View>
                <Text style={styles.subName}>{r.subject}</Text>
                <Text style={styles.subCode}>{r.date}</Text>
              </View>
              <Text style={[styles.status, { color: statusColor(r.status) }]}>{r.status}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  icon: { fontSize: 32 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  sub: { color: COLORS.textSecondary, fontWeight: '600' },
  dept: { color: COLORS.purple, marginBottom: 16, fontWeight: '600' },
  overallCard: { backgroundColor: COLORS.card, padding: 20, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border },
  bigPct: { fontSize: 48, fontWeight: '800', textAlign: 'center' },
  overallSub: { color: COLORS.textSecondary, textAlign: 'center', fontWeight: '600' },
  barBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4, marginTop: 12 },
  barFill: { height: 8, borderRadius: 4 },
  warn: { color: COLORS.orange, marginTop: 12, fontWeight: '600' },
  section: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16, marginTop: 20, marginBottom: 10 },
  subCard: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  subName: { color: COLORS.textPrimary, fontWeight: '800' },
  subCode: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  histRow: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 12, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  status: { fontWeight: '800', textTransform: 'capitalize' },
});
