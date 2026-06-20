import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, ActivityIndicator, Alert } from 'react-native';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { handleError } from '../utils/errors';

const ROLES = ['Class Advisor', 'Co-Advisor', 'Year Coordinator'];
const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year'];
const SECTIONS = ['A', 'B', 'C'];

export default function AssignRole() {
  const [faculty, setFaculty] = useState<any[]>([]);
  const [step, setStep] = useState(1);
  const [selected, setSelected] = useState<any>(null);
  const [role, setRole] = useState('');
  const [year, setYear] = useState('III Year');
  const [section, setSection] = useState('B');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const res = await api.get('/faculty');
      setFaculty(res.data);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!selected || !role) return;
    try {
      await api.post(`/faculty/${selected.id}/assign-role`, {
        role,
        year,
        section: role === 'Year Coordinator' ? '' : section,
      });
      Alert.alert('Success', 'Role assigned');
      load();
      setStep(1);
      setSelected(null);
    } catch (e) {
      handleError(e);
    }
  };

  return (
    <View style={styles.container}>
      <AppBar title="Assign Role" showBack />
      <View style={styles.progress}>
        {[1, 2, 3].map((s) => (
          <View key={s} style={[styles.dot, step >= s && styles.dotOn]} />
        ))}
      </View>
      {loading ? (
        <ActivityIndicator color={COLORS.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          {step === 1 && (
            <>
              <Text style={styles.stepTitle}>Step 1: Select Faculty</Text>
              {faculty.map((f) => (
                <TouchableOpacity
                  key={f.id}
                  style={[styles.card, selected?.id === f.id && styles.cardOn]}
                  onPress={() => {
                    setSelected(f);
                    setStep(2);
                  }}
                >
                  <Text style={styles.name}>{f.name}</Text>
                  <Text style={styles.sub}>{f.assigned_role || 'No role assigned'}</Text>
                </TouchableOpacity>
              ))}
            </>
          )}
          {step === 2 && (
            <>
              <Text style={styles.stepTitle}>Step 2: Select Role</Text>
              {ROLES.map((r) => (
                <TouchableOpacity key={r} style={[styles.card, role === r && styles.cardOn]} onPress={() => { setRole(r); setStep(3); }}>
                  <Text style={styles.name}>{r}</Text>
                </TouchableOpacity>
              ))}
              <TouchableOpacity onPress={() => setStep(1)}><Text style={styles.back}>← Back</Text></TouchableOpacity>
            </>
          )}
          {step === 3 && (
            <>
              <Text style={styles.stepTitle}>Step 3: Year & Section</Text>
              <Text style={styles.label}>Year</Text>
              <View style={styles.row}>{YEARS.map((y) => <Chip key={y} label={y} on={year === y} press={() => setYear(y)} />)}</View>
              {role !== 'Year Coordinator' && (
                <>
                  <Text style={styles.label}>Section</Text>
                  <View style={styles.row}>{SECTIONS.map((s) => <Chip key={s} label={s} on={section === s} press={() => setSection(s)} />)}</View>
                </>
              )}
              <View style={styles.summary}>
                <Text style={styles.summaryText}>{selected?.name} → {role} · {year}</Text>
              </View>
              <TouchableOpacity style={styles.btn} onPress={save}><Text style={styles.btnText}>Save Assignment</Text></TouchableOpacity>
              <TouchableOpacity onPress={() => setStep(2)}><Text style={styles.back}>← Back</Text></TouchableOpacity>
            </>
          )}
          <Text style={[styles.stepTitle, { marginTop: 24 }]}>Current Assignments</Text>
          {faculty.filter((f) => f.assigned_role).map((f) => (
            <View key={f.id} style={styles.card}>
              <Text style={styles.name}>{f.name}</Text>
              <Text style={styles.sub}>{f.assigned_role} · {f.year} {f.section}</Text>
            </View>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

function Chip({ label, on, press }: any) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={press}>
      <Text style={{ color: on ? COLORS.green : COLORS.textSecondary, fontWeight: '600' }}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  progress: { flexDirection: 'row', justifyContent: 'center', gap: 8, padding: 12 },
  dot: { width: 40, height: 6, borderRadius: 3, backgroundColor: COLORS.border },
  dotOn: { backgroundColor: COLORS.green },
  scroll: { padding: 16, paddingBottom: 40 },
  stepTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: 12 },
  card: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginBottom: 8, borderWidth: 1, borderColor: COLORS.border },
  cardOn: { borderColor: COLORS.green, borderWidth: 2 },
  name: { color: COLORS.textPrimary, fontWeight: '800' },
  sub: { color: COLORS.textMuted, fontSize: 12, marginTop: 4 },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', marginTop: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  chip: { padding: 10, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipOn: { borderColor: COLORS.green },
  summary: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginVertical: 12 },
  summaryText: { color: COLORS.green, fontWeight: '800' },
  btn: { backgroundColor: COLORS.green, padding: 16, borderRadius: 14, alignItems: 'center' },
  btnText: { color: '#07090f', fontWeight: '800' },
  back: { color: COLORS.textMuted, textAlign: 'center', marginTop: 16 },
});
