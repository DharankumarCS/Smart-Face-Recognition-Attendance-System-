import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { handleError } from '../utils/errors';

const ROLES = ['Class Advisor', 'Co-Advisor', 'Year Coordinator'];
const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year'];
const SECTIONS = ['A', 'B', 'C'];

export default function AddFaculty() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [dept, setDept] = useState('CSE');
  const [designation, setDesignation] = useState('Assistant Professor');
  const [password, setPassword] = useState('admin123');
  const [role, setRole] = useState('');
  const [year, setYear] = useState('III Year');
  const [section, setSection] = useState('B');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const submit = async () => {
    if (!name || !email || !password) {
      Alert.alert('Error', 'Name, email and password required');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/faculty', {
        name,
        email: email.trim().toLowerCase(),
        password,
        department: dept,
        designation,
        phone,
        role: role || undefined,
        year: role ? year : undefined,
        section: role && role !== 'Year Coordinator' ? section : undefined,
      });
      setSuccess(res.data);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <AppBar title="Faculty Added" showBack />
        <View style={styles.center}>
          <Text style={styles.ok}>✅ Faculty Created</Text>
          <Text style={styles.name}>{success.name}</Text>
          <Text style={styles.sub}>{success.email}</Text>
          <TouchableOpacity style={styles.btn} onPress={() => router.back()}>
            <Text style={styles.btnText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Add Faculty" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Field label="Full Name" value={name} onChange={setName} />
        <Field label="Email" value={email} onChange={setEmail} keyboard="email-address" />
        <Field label="Phone" value={phone} onChange={setPhone} keyboard="phone-pad" />
        <Field label="Department" value={dept} onChange={setDept} />
        <Text style={styles.label}>Designation</Text>
        <View style={styles.row}>
          {['Professor', 'Assistant Professor'].map((d) => (
            <TouchableOpacity key={d} style={[styles.chip, designation === d && styles.chipOn]} onPress={() => setDesignation(d)}>
              <Text style={styles.chipText}>{d}</Text>
            </TouchableOpacity>
          ))}
        </View>
        <Field label="Password" value={password} onChange={setPassword} secure />

        <Text style={styles.section}>Assign Role (optional)</Text>
        <View style={styles.row}>
          {ROLES.map((r) => (
            <TouchableOpacity key={r} style={[styles.chip, role === r && styles.chipOn]} onPress={() => setRole(r)}>
              <Text style={styles.chipText}>{r}</Text>
            </TouchableOpacity>
          ))}
        </View>
        {role && (
          <>
            <Text style={styles.label}>Year</Text>
            <View style={styles.row}>{YEARS.map((y) => <Chip key={y} label={y} on={year === y} press={() => setYear(y)} />)}</View>
            {role !== 'Year Coordinator' && (
              <>
                <Text style={styles.label}>Section</Text>
                <View style={styles.row}>{SECTIONS.map((s) => <Chip key={s} label={s} on={section === s} press={() => setSection(s)} />)}</View>
              </>
            )}
            <View style={styles.summary}>
              <Text style={styles.summaryText}>{role} · {year} {role !== 'Year Coordinator' ? `· Sec ${section}` : ''}</Text>
            </View>
          </>
        )}

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#07090f" /> : <Text style={styles.btnText}>Create Faculty</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Field({ label, value, onChange, secure, keyboard }: any) {
  return (
    <>
      <Text style={styles.label}>{label}</Text>
      <TextInput style={styles.input} value={value} onChangeText={onChange} secureTextEntry={secure} keyboardType={keyboard} placeholderTextColor={COLORS.textMuted} />
    </>
  );
}

function Chip({ label, on, press }: any) {
  return (
    <TouchableOpacity style={[styles.chip, on && styles.chipOn]} onPress={press}>
      <Text style={[styles.chipText, on && { color: COLORS.green }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, fontWeight: '600' },
  section: { color: COLORS.textPrimary, fontWeight: '800', marginTop: 20, marginBottom: 8 },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 10, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipOn: { borderColor: COLORS.green },
  chipText: { color: COLORS.textSecondary, fontSize: 11, fontWeight: '600' },
  summary: { backgroundColor: COLORS.card, padding: 14, borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.blue },
  summaryText: { color: COLORS.blue, fontWeight: '800' },
  btn: { backgroundColor: COLORS.green, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#07090f', fontWeight: '800' },
  center: { flex: 1, justifyContent: 'center', padding: 24 },
  ok: { color: COLORS.green, fontSize: 22, fontWeight: '800', textAlign: 'center' },
  name: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  sub: { color: COLORS.textSecondary, textAlign: 'center' },
});
