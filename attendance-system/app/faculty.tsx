import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { getCurrentUser } from '../services/auth';
import { handleError } from '../utils/errors';

export default function FacultyDashboard() {
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [subjects, setSubjects] = useState<any[]>([]);
  const [sessions, setSessions] = useState<any[]>([]);
  const [sections, setSections] = useState<any>(null);
  const [pending, setPending] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const roleColor = (r: string) => {
    if (r === 'Class Advisor') return COLORS.green;
    if (r === 'Co-Advisor') return COLORS.blue;
    if (r === 'Year Coordinator') return COLORS.orange;
    return COLORS.textMuted;
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      setUser(u);
      const meRes = await api.get('/auth/me');
      setMe(meRes.data);
      const subRes = await api.get(`/faculty/${meRes.data.id}/subjects`);
      setSubjects(subRes.data);
      const sessRes = await api.get('/attendance/sessions');
      setSessions(sessRes.data.slice(0, 5));
      if (meRes.data.faculty_role === 'Year Coordinator') {
        const secRes = await api.get('/coordinator/sections');
        setSections(secRes.data);
        const pendRes = await api.get('/coordinator/pending');
        setPending(pendRes.data);
      }
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const verifySession = async (id: number) => {
    try {
      await api.post(`/coordinator/${id}/verify`);
      Alert.alert('Success', 'Attendance verified');
      load();
    } catch (e) {
      handleError(e);
    }
  };

  const studentTotal = subjects.reduce((a, s) => a + (s.student_count || 0), 0);

  return (
    <View style={styles.container}>
      <AppBar title="Faculty Dashboard" />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.blue} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.name}>{user?.name}</Text>
          {me?.faculty_role && (
            <View style={[styles.roleBadge, { borderColor: roleColor(me.faculty_role) }]}>
              <Text style={{ color: roleColor(me.faculty_role), fontWeight: '800' }}>{me.faculty_role}</Text>
            </View>
          )}

          <View style={styles.statsRow}>
            <MiniStat label="Subjects" value={subjects.length} color={COLORS.blue} />
            <MiniStat label="Students" value={studentTotal} color={COLORS.green} />
          </View>

          {me?.faculty_role === 'Year Coordinator' && sections && (
            <>
              <Text style={styles.section}>Coordinator Panel</Text>
              <View style={styles.summaryCard}>
                <Text style={styles.summaryText}>
                  Present: {sections.summary?.total_present} · Absent: {sections.summary?.total_absent} · Students:{' '}
                  {sections.summary?.total_students}
                </Text>
              </View>
              {(sections.sections || []).map((sec: any) => (
                <View key={sec.section} style={styles.secCard}>
                  <Text style={styles.secTitle}>Section {sec.section}</Text>
                  <Text style={styles.secSub}>Advisor: {sec.advisor || 'N/A'}</Text>
                  <Text style={styles.secSub}>
                    P:{sec.present} A:{sec.absent} — {sec.percentage}%
                  </Text>
                  <View style={styles.barBg}>
                    <View style={[styles.barFill, { width: `${sec.percentage}%` }]} />
                  </View>
                </View>
              ))}
              {pending.map((p: any) => (
                <View key={p.id} style={styles.pendingCard}>
                  <Text style={styles.secTitle}>{p.subject_name}</Text>
                  <Text style={styles.secSub}>{p.faculty_name} · {p.date}</Text>
                  <TouchableOpacity style={styles.verifyBtn} onPress={() => verifySession(p.id)}>
                    <Text style={styles.verifyText}>Verify</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </>
          )}

          {(me?.faculty_role === 'Class Advisor' || me?.faculty_role === 'Co-Advisor' || !me?.faculty_role) && (
            <TouchableOpacity style={styles.addBtn} onPress={() => router.push('/add-student')}>
              <Text style={styles.addBtnText}>+ Add Student</Text>
            </TouchableOpacity>
          )}

          <Text style={styles.section}>My Subjects</Text>
          {subjects.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={styles.subjectCard}
              onPress={() =>
                router.push({
                  pathname: '/class-detail',
                  params: {
                    subject_id: String(s.id),
                    name: s.name,
                    code: s.code,
                    class: s.class_name,
                    time: s.time_slot,
                    year: s.year,
                    students: String(s.student_count),
                  },
                })
              }
            >
              <Text style={styles.subName}>{s.name}</Text>
              <Text style={styles.subCode}>{s.code} · {s.class_name} · {s.time_slot}</Text>
              <Text style={styles.tapHint}>TAP TO OPEN · {s.student_count} students</Text>
            </TouchableOpacity>
          ))}

          <Text style={styles.section}>Recent Attendance</Text>
          {sessions.map((s) => (
            <View key={s.id} style={styles.sessionCard}>
              <Text style={styles.subName}>{s.subject_name}</Text>
              <Text style={styles.secSub}>
                {s.date} · P:{s.present} A:{s.absent} · {s.status}
              </Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function MiniStat({ label, value, color }: any) {
  return (
    <View style={[styles.mini, { borderColor: color }]}>
      <Text style={[styles.miniVal, { color }]}>{value}</Text>
      <Text style={styles.miniLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  name: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  roleBadge: { alignSelf: 'flex-start', borderWidth: 1, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, marginVertical: 10 },
  statsRow: { flexDirection: 'row', gap: 10, marginBottom: 16 },
  mini: { flex: 1, backgroundColor: COLORS.card, borderRadius: 14, padding: 14, borderWidth: 1 },
  miniVal: { fontSize: 24, fontWeight: '800' },
  miniLabel: { color: COLORS.textSecondary, fontWeight: '600' },
  section: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16, marginTop: 16, marginBottom: 10 },
  summaryCard: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  summaryText: { color: COLORS.textSecondary, fontWeight: '600' },
  secCard: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  secTitle: { color: COLORS.textPrimary, fontWeight: '800' },
  secSub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  barBg: { height: 6, backgroundColor: COLORS.border, borderRadius: 3, marginTop: 8 },
  barFill: { height: 6, backgroundColor: COLORS.green, borderRadius: 3 },
  pendingCard: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.purple },
  verifyBtn: { backgroundColor: COLORS.green, padding: 10, borderRadius: 10, marginTop: 8, alignItems: 'center' },
  verifyText: { color: '#07090f', fontWeight: '800' },
  addBtn: { backgroundColor: COLORS.blue, padding: 14, borderRadius: 14, alignItems: 'center', marginBottom: 8 },
  addBtnText: { color: '#07090f', fontWeight: '800' },
  subjectCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 16, marginBottom: 10, borderWidth: 1, borderColor: COLORS.border },
  subName: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16 },
  subCode: { color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  tapHint: { color: COLORS.blue, fontSize: 11, marginTop: 8, fontWeight: '800' },
  sessionCard: { backgroundColor: COLORS.card, padding: 12, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
});
