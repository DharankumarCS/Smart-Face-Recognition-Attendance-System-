import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { handleError } from '../utils/errors';

const YEARS = ['I Year', 'II Year', 'III Year', 'IV Year'];
const SECTIONS = ['A', 'B', 'C', 'D'];

export default function AddStudent() {
  const [name, setName] = useState('');
  const [reg, setReg] = useState('');
  const [year, setYear] = useState('III Year');
  const [section, setSection] = useState('B');
  const [dept, setDept] = useState('CSE');
  const [phone, setPhone] = useState('');
  const [dob, setDob] = useState('');
  const [photo, setPhoto] = useState<string | null>(null);
  const [studentId, setStudentId] = useState<number | null>(null);
  const [faceDone, setFaceDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<any>(null);

  const captureFace = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert('Permission', 'Camera required');
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      cameraType: ImagePicker.CameraType.front,
      quality: 0.8,
    });
    if (!result.canceled) setPhoto(result.assets[0].uri);
  };

  const registerFace = async (id: number) => {
    if (!photo) {
      Alert.alert('Error', 'Capture face photo first');
      return;
    }
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', { uri: photo, name: 'face.jpg', type: 'image/jpeg' } as any);
      await api.post(`/students/${id}/upload-face`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setFaceDone(true);
      Alert.alert('Success', 'Face registered successfully!');
    } catch (e: any) {
      const msg = e.response?.data?.detail || 'Please retake photo with clear face view';
      Alert.alert('Error', msg);
    } finally {
      setLoading(false);
    }
  };

  const submit = async () => {
    if (!name || !reg || !dob) {
      Alert.alert('Error', 'Fill all required fields');
      return;
    }
    if (!photo) {
      Alert.alert('Error', 'Face photo required for attendance scanning');
      return;
    }
    setLoading(true);
    try {
      const res = await api.post('/students', {
        name,
        register_number: reg.toUpperCase(),
        year,
        section,
        department: dept,
        date_of_birth: dob,
        phone,
      });
      const id = res.data.id;
      setStudentId(id);
      await registerFace(id);
      setSuccess(res.data);
    } catch (e: any) {
      if (e.response?.status === 400) {
        Alert.alert('Error', 'Register number already exists');
      } else {
        handleError(e);
      }
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <View style={styles.container}>
        <AppBar title="Student Added" showBack />
        <View style={styles.successBox}>
          <Text style={styles.successTitle}>✅ Student Created</Text>
          <Text style={styles.successName}>{success.name}</Text>
          <Text style={styles.successSub}>{success.register_number} · {success.year} · {success.section}</Text>
          {faceDone && <Text style={styles.faceOk}>Face registered</Text>}
          <TouchableOpacity style={styles.btn} onPress={() => { setSuccess(null); setName(''); setReg(''); setPhoto(null); setFaceDone(false); }}>
            <Text style={styles.btnText}>Add Another Student</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.back()}>
            <Text style={styles.btnOutlineText}>Back to Dashboard</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <AppBar title="Add Student" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.label}>Full Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={COLORS.textMuted} placeholder="Student name" />

        <Text style={styles.label}>Register Number</Text>
        <TextInput style={styles.input} value={reg} onChangeText={(t) => setReg(t.toUpperCase())} autoCapitalize="characters" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Year</Text>
        <View style={styles.row}>{YEARS.map((y) => <Chip key={y} label={y} selected={year === y} onPress={() => setYear(y)} />)}</View>

        <Text style={styles.label}>Section</Text>
        <View style={styles.row}>{SECTIONS.map((s) => <Chip key={s} label={s} selected={section === s} onPress={() => setSection(s)} />)}</View>

        <Text style={styles.label}>Department</Text>
        <TextInput style={styles.input} value={dept} onChangeText={setDept} placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Phone</Text>
        <TextInput style={styles.input} value={phone} onChangeText={setPhone} keyboardType="phone-pad" placeholderTextColor={COLORS.textMuted} />

        <Text style={styles.label}>Date of Birth (password)</Text>
        <TextInput style={styles.input} value={dob} onChangeText={setDob} placeholder="01/01/2003" placeholderTextColor={COLORS.textMuted} />

        <TouchableOpacity style={styles.faceCircle} onPress={captureFace}>
          {photo ? <Image source={{ uri: photo }} style={styles.faceImg} /> : <Text style={styles.camIcon}>📷</Text>}
        </TouchableOpacity>
        <Text style={styles.faceHint}>Tap to capture face photo</Text>
        <Text style={styles.faceSub}>Required for attendance scanning</Text>

        {studentId && !faceDone && (
          <TouchableOpacity style={styles.btnOutline} onPress={() => registerFace(studentId)} disabled={loading}>
            <Text style={styles.btnOutlineText}>{loading ? 'Encoding...' : 'Register Face'}</Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity style={styles.btn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#07090f" /> : <Text style={styles.btnText}>Create Student & Register Face</Text>}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

function Chip({ label, selected, onPress }: any) {
  return (
    <TouchableOpacity style={[styles.chip, selected && styles.chipOn]} onPress={onPress}>
      <Text style={[styles.chipText, selected && { color: COLORS.green }]}>{label}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', marginTop: 12, marginBottom: 6 },
  input: { backgroundColor: COLORS.card, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, fontWeight: '600' },
  row: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 10, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.card },
  chipOn: { borderColor: COLORS.green },
  chipText: { color: COLORS.textSecondary, fontWeight: '600', fontSize: 12 },
  faceCircle: { width: 140, height: 140, borderRadius: 70, backgroundColor: COLORS.card, alignSelf: 'center', marginTop: 24, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.green, overflow: 'hidden' },
  faceImg: { width: 140, height: 140 },
  camIcon: { fontSize: 40 },
  faceHint: { color: COLORS.textPrimary, textAlign: 'center', marginTop: 12, fontWeight: '800' },
  faceSub: { color: COLORS.textMuted, textAlign: 'center', fontSize: 12 },
  btn: { backgroundColor: COLORS.green, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 24 },
  btnText: { color: '#07090f', fontWeight: '800' },
  btnOutline: { borderWidth: 1, borderColor: COLORS.border, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  btnOutlineText: { color: COLORS.textPrimary, fontWeight: '600' },
  successBox: { flex: 1, padding: 24, justifyContent: 'center' },
  successTitle: { color: COLORS.green, fontSize: 24, fontWeight: '800', textAlign: 'center' },
  successName: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800', textAlign: 'center', marginTop: 12 },
  successSub: { color: COLORS.textSecondary, textAlign: 'center', marginTop: 8 },
  faceOk: { color: COLORS.green, textAlign: 'center', marginTop: 8, fontWeight: '600' },
});
