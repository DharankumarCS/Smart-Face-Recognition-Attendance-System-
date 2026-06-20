import { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  FlatList,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { getCurrentUser } from '../services/auth';
import { handleError } from '../utils/errors';

export default function HodDashboard() {
  const [user, setUser] = useState<any>(null);
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [facultyModal, setFacultyModal] = useState(false);
  const [subjectsModal, setSubjectsModal] = useState(false);
  const [facultyList, setFacultyList] = useState<any[]>([]);
  const [subjectsList, setSubjectsList] = useState<any[]>([]);

  const greeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good Morning';
    if (h < 17) return 'Good Afternoon';
    return 'Good Evening';
  };

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    setLoading(true);
    try {
      const u = await getCurrentUser();
      setUser(u);
      const res = await api.get('/reports/department');
      setStats(res.data);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const openFaculty = async () => {
    try {
      const res = await api.get('/faculty');
      setFacultyList(res.data);
      setFacultyModal(true);
    } catch (e) {
      handleError(e);
    }
  };

  const openSubjects = async () => {
    try {
      const res = await api.get('/reports/department');
      setSubjectsList(res.data?.subject_stats || []);
      setSubjectsModal(true);
    } catch (e) {
      handleError(e);
    }
  };

  const downloadExcel = async () => {
    try {
      const res = await api.get('/reports/export/excel', { responseType: 'arraybuffer' });
      const base64 = btoa(
        new Uint8Array(res.data).reduce((data, byte) => data + String.fromCharCode(byte), '')
      );
      const path = FileSystem.documentDirectory + 'attendance_report.xlsx';
      await FileSystem.writeAsStringAsync(path, base64, { encoding: FileSystem.EncodingType.Base64 });
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(path);
      } else {
        Alert.alert('Success', 'Report saved to ' + path);
      }
    } catch (e) {
      handleError(e);
    }
  };

  const statusColor = (s: string) => {
    if (s === 'verified') return COLORS.green;
    if (s === 'sent') return COLORS.purple;
    if (s === 'saved') return COLORS.orange;
    return COLORS.textMuted;
  };

  const menu = [
    { label: 'Add Faculty', icon: '➕', route: '/add-faculty' },
    { label: 'Add Student', icon: '👤', route: '/add-student' },
    { label: 'Manage Faculty', icon: '📋', action: openFaculty },
    { label: 'Assign Role', icon: '🎯', route: '/assign-role' },
    { label: 'View Reports', icon: '📊', route: '/report' },
    { label: 'Download Excel', icon: '📥', action: downloadExcel },
    { label: 'Manage Classes', icon: '📚', action: openSubjects },
  ];

  return (
    <View style={styles.container}>
      <AppBar title="HOD Dashboard" />
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color={COLORS.green} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <Text style={styles.greet}>{greeting()}</Text>
          <Text style={styles.name}>{user?.name}</Text>
          <Text style={styles.dept}>HOD · {user?.department} Department</Text>

          <View style={styles.grid}>
            <StatCard label="Students" value={stats?.total_students} color={COLORS.green} />
            <StatCard label="Faculty" value={stats?.total_faculty} color={COLORS.blue} />
            <StatCard label="Subjects" value={stats?.total_subjects} color={COLORS.purple} />
            <StatCard label="Avg %" value={`${stats?.avg_attendance || 0}%`} color={COLORS.orange} />
          </View>

          <Text style={styles.section}>Menu</Text>
          <View style={styles.menuGrid}>
            {menu.map((m) => (
              <TouchableOpacity
                key={m.label}
                style={styles.menuItem}
                onPress={() => (m.route ? router.push(m.route as any) : m.action?.())}
              >
                <Text style={styles.menuIcon}>{m.icon}</Text>
                <Text style={styles.menuLabel}>{m.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.section}>Recent Activity</Text>
          {(stats?.recent_activity || []).map((a: any) => (
            <View key={a.id} style={styles.activity}>
              <View>
                <Text style={styles.actTitle}>{a.subject_name}</Text>
                <Text style={styles.actSub}>{a.faculty_name} · {a.date}</Text>
              </View>
              <Text style={[styles.badge, { color: statusColor(a.status) }]}>{a.status}</Text>
            </View>
          ))}
        </ScrollView>
      )}

      <Modal visible={facultyModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Faculty List</Text>
            <FlatList
              data={facultyList}
              keyExtractor={(i) => String(i.id)}
              renderItem={({ item }) => (
                <Text style={styles.modalItem}>
                  {item.name} — {item.assigned_role || 'No role'}
                </Text>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setFacultyModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={subjectsModal} animationType="slide" transparent>
        <View style={styles.modalBg}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>Subjects</Text>
            <FlatList
              data={subjectsList}
              keyExtractor={(i, idx) => String(idx)}
              renderItem={({ item }) => (
                <Text style={styles.modalItem}>
                  {item.name} ({item.code}) — {item.percentage}%
                </Text>
              )}
            />
            <TouchableOpacity style={styles.closeBtn} onPress={() => setSubjectsModal(false)}>
              <Text style={styles.closeText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function StatCard({ label, value, color }: { label: string; value: any; color: string }) {
  return (
    <View style={[styles.stat, { borderColor: color }]}>
      <Text style={[styles.statVal, { color }]}>{value ?? 0}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  greet: { color: COLORS.textSecondary, fontWeight: '600' },
  name: { color: COLORS.textPrimary, fontSize: 24, fontWeight: '800' },
  dept: { color: COLORS.green, marginBottom: 20, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  stat: { width: '47%', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1 },
  statVal: { fontSize: 28, fontWeight: '800' },
  statLabel: { color: COLORS.textSecondary, fontWeight: '600', marginTop: 4 },
  section: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16, marginTop: 24, marginBottom: 12 },
  menuGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  menuItem: { width: '30%', backgroundColor: COLORS.card, borderRadius: 14, padding: 14, alignItems: 'center', borderWidth: 1, borderColor: COLORS.border },
  menuIcon: { fontSize: 24 },
  menuLabel: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600', textAlign: 'center', marginTop: 6 },
  activity: { flexDirection: 'row', justifyContent: 'space-between', backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  actTitle: { color: COLORS.textPrimary, fontWeight: '800' },
  actSub: { color: COLORS.textMuted, fontSize: 12 },
  badge: { fontWeight: '800', textTransform: 'capitalize' },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  modal: { backgroundColor: COLORS.card, borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '70%' },
  modalTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 18, marginBottom: 12 },
  modalItem: { color: COLORS.textSecondary, paddingVertical: 8, fontWeight: '600' },
  closeBtn: { marginTop: 12, backgroundColor: COLORS.green, padding: 14, borderRadius: 14, alignItems: 'center' },
  closeText: { color: '#07090f', fontWeight: '800' },
});
