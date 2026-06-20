import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useLocalSearchParams } from 'expo-router';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api from '../services/api';
import { handleError } from '../utils/errors';

type StudentRow = {
  id: number;
  name: string;
  register_number: string;
  status: string;
};

const STATUSES = [
  { id: 'present', label: 'Present', icon: '✅', color: COLORS.green },
  { id: 'late', label: 'Late', icon: '🕐', color: COLORS.orange },
  { id: 'od', label: 'OD', icon: '📋', color: COLORS.blue },
  { id: 'absent', label: 'Absent', icon: '❌', color: COLORS.red },
];

export default function ClassDetail() {
  const params = useLocalSearchParams<{
    subject_id: string;
    name: string;
    code: string;
    class: string;
    time: string;
    year: string;
    students: string;
  }>();

  const [permission, requestPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [scanned, setScanned] = useState(false);
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [sessionStatus, setSessionStatus] = useState('pending');
  const [sendCount, setSendCount] = useState(0);
  const [signature, setSignature] = useState('');
  const [editMode, setEditMode] = useState(false);
  const [sigModal, setSigModal] = useState(false);
  const [pickerStudent, setPickerStudent] = useState<StudentRow | null>(null);
  const [coordinatorId, setCoordinatorId] = useState<number | null>(null);
  const scanLine = useRef(new Animated.Value(0)).current;
  const cameraRef = useRef<CameraView>(null);

  useEffect(() => {
    loadCoordinator();
  }, []);

  useEffect(() => {
    if (cameraOpen) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLine, { toValue: 1, duration: 1500, useNativeDriver: true }),
          Animated.timing(scanLine, { toValue: 0, duration: 1500, useNativeDriver: true }),
        ])
      ).start();
      const t = setTimeout(() => capturePhoto(), 3000);
      return () => clearTimeout(t);
    }
  }, [cameraOpen]);

  const loadCoordinator = async () => {
    try {
      const res = await api.get('/coordinator/coordinator-id', {
        params: { year: params.year || 'III Year' },
      });
      setCoordinatorId(res.data.coordinator_id);
    } catch {
      setCoordinatorId(2);
    }
  };

  const counts = () => {
    const c = { present: 0, late: 0, od: 0, absent: 0 };
    students.forEach((s) => {
      if (s.status in c) (c as any)[s.status]++;
    });
    return c;
  };

  const attendancePct = () => {
    const c = counts();
    const effective = c.present + c.late;
    const total = students.length || 1;
    return Math.round((effective / total) * 100);
  };

  const openCamera = async () => {
    if (!permission?.granted) {
      const r = await requestPermission();
      if (!r.granted) {
        Alert.alert('Permission', 'Camera permission is required');
        return;
      }
    }
    setCameraOpen(true);
  };

  const capturePhoto = async () => {
    if (!cameraRef.current) return;
    setProcessing(true);
    try {
      const photo = await cameraRef.current.takePictureAsync({ quality: 0.7, base64: false });
      setCameraOpen(false);
      const form = new FormData();
      form.append('subject_id', params.subject_id as string);
      form.append('image', {
        uri: photo?.uri,
        name: 'scan.jpg',
        type: 'image/jpeg',
      } as any);

      const res = await api.post('/attendance/scan', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      if (!res.data.face_detected && res.data.error) {
        Alert.alert('No faces detected', 'Mark manually?', [
          { text: 'Cancel', onPress: () => setProcessing(false) },
          {
            text: 'OK',
            onPress: () => {
              setStudents(
                res.data.students.map((s: any) => ({ ...s, status: 'absent' }))
              );
              setScanned(true);
              setProcessing(false);
            },
          },
        ]);
        return;
      }

      setStudents(res.data.students);
      setScanned(true);
    } catch (e) {
      handleError(e);
    } finally {
      setProcessing(false);
    }
  };

  const saveAttendance = async () => {
    try {
      const res = await api.post('/attendance/save', {
        subject_id: parseInt(params.subject_id as string, 10),
        records: students.map((s) => ({ student_id: s.id, status: s.status })),
      });
      setSessionId(res.data.session_id);
      setSessionStatus('saved');
      Alert.alert('Success', 'Attendance saved');
    } catch (e) {
      handleError(e);
    }
  };

  const sendAttendance = async () => {
    if (!signature || signature.length < 3) {
      Alert.alert('Error', 'Signature required (min 3 characters)');
      return;
    }
    if (!sessionId) return;
    try {
      const res = await api.post('/attendance/send', {
        session_id: sessionId,
        signature: signature.toUpperCase(),
        coordinator_id: coordinatorId || 2,
      });
      setSendCount(res.data.send_count);
      setSessionStatus('sent');
      setSigModal(false);
      setEditMode(false);
      Alert.alert('Success', 'Sent to coordinator');
    } catch (e) {
      handleError(e);
    }
  };

  const updateResend = async () => {
    if (!sessionId) return;
    try {
      const res = await api.put(`/attendance/${sessionId}/update`, {
        records: students.map((s) => ({ student_id: s.id, status: s.status })),
        signature: signature.toUpperCase(),
      });
      setSendCount(res.data.send_count);
      setSessionStatus('sent');
      setSigModal(false);
      setEditMode(false);
      Alert.alert('Success', 'Updated and resent');
    } catch (e) {
      handleError(e);
    }
  };

  const c = counts();
  const pct = attendancePct();
  const lineY = scanLine.interpolate({ inputRange: [0, 1], outputRange: [0, 280] });

  return (
    <View style={styles.container}>
      <AppBar title="Class Attendance" showBack />
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.infoCard}>
          <Text style={styles.codeBadge}>{params.code}</Text>
          <Text style={styles.title}>{params.name}</Text>
          <Text style={styles.sub}>
            {params.class} · {params.time} · {params.students} students
          </Text>
          <Text style={styles.statusLine}>
            Status: {sessionStatus.toUpperCase()} {sendCount > 0 ? `(×${sendCount})` : ''}
          </Text>
        </View>

        {!scanned && (
          <TouchableOpacity style={styles.scanBtn} onPress={openCamera}>
            <Text style={styles.scanIcon}>📷</Text>
            <Text style={styles.scanText}>Scan Classroom</Text>
            <Text style={styles.scanSub}>Opens camera for face recognition</Text>
          </TouchableOpacity>
        )}

        {scanned && (
          <>
            <View style={styles.countRow}>
              {[
                { l: 'Present', v: c.present + c.late, col: COLORS.green },
                { l: 'Late', v: c.late, col: COLORS.orange },
                { l: 'OD', v: c.od, col: COLORS.blue },
                { l: 'Absent', v: c.absent, col: COLORS.red },
              ].map((x) => (
                <View key={x.l} style={styles.countBox}>
                  <Text style={[styles.countVal, { color: x.col }]}>{x.v}</Text>
                  <Text style={styles.countLbl}>{x.l}</Text>
                </View>
              ))}
            </View>
            <View style={styles.barBg}>
              <View
                style={[
                  styles.barFill,
                  { width: `${pct}%`, backgroundColor: pct >= 75 ? COLORS.green : COLORS.red },
                ]}
              />
            </View>
            <Text style={styles.pctText}>{pct}% attendance</Text>

            {editMode && (
              <Text style={styles.editBanner}>Edit mode ON — tap status to change</Text>
            )}

            {!sessionId && (
              <TouchableOpacity style={styles.scanBtn} onPress={openCamera}>
                <Text style={styles.scanText}>Rescan</Text>
              </TouchableOpacity>
            )}

            <Text style={styles.listTitle}>STUDENTS — TAP STATUS TO CHANGE</Text>
            {students.map((s) => (
              <TouchableOpacity
                key={s.id}
                style={styles.studentRow}
                onPress={() => {
                  if (!sessionId || sessionStatus === 'saved' || editMode) setPickerStudent(s);
                }}
                disabled={!!sessionId && sessionStatus === 'sent' && !editMode}
              >
                <View style={styles.avatar}>
                  <Text>{s.name.charAt(0)}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stuName}>{s.name}</Text>
                  <Text style={styles.stuReg}>{s.register_number}</Text>
                </View>
                <Text
                  style={[
                    styles.badge,
                    {
                      color: STATUSES.find((x) => x.id === s.status)?.color,
                      borderWidth: editMode ? 2 : 1,
                    },
                  ]}
                >
                  {s.status}
                </Text>
              </TouchableOpacity>
            ))}

            {!sessionId && (
              <TouchableOpacity style={styles.saveBtn} onPress={saveAttendance}>
                <Text style={styles.saveText}>💾 Save Attendance</Text>
              </TouchableOpacity>
            )}

            {sessionId && sessionStatus === 'saved' && (
              <TouchableOpacity style={styles.sendBtn} onPress={() => setSigModal(true)}>
                <Text style={styles.saveText}>📤 Send to Coordinator</Text>
              </TouchableOpacity>
            )}

            {sessionStatus === 'sent' && (
              <View style={styles.sentCard}>
                <Text style={styles.sentTitle}>✅ Sent to Coordinator</Text>
                <Text style={styles.sentSub}>Signed by: {signature}</Text>
                <Text style={styles.sentSub}>
                  P:{c.present + c.late} · L:{c.late} · OD:{c.od} · A:{c.absent}
                </Text>
              </View>
            )}

            {sessionStatus === 'sent' && (
              <TouchableOpacity
                style={styles.editBtn}
                onPress={() => {
                  setEditMode(true);
                  setSessionStatus('editing');
                }}
              >
                <Text style={styles.editText}>✏️ Edit & Resend</Text>
              </TouchableOpacity>
            )}

            {editMode && (
              <TouchableOpacity style={styles.sendBtn} onPress={() => setSigModal(true)}>
                <Text style={styles.saveText}>🔄 Update & Resend</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </ScrollView>

      <Modal visible={cameraOpen} animationType="slide">
        <View style={styles.camFull}>
          <CameraView ref={cameraRef} style={styles.cam} facing="back" />
          <Animated.View style={[styles.camScan, { transform: [{ translateY: lineY }] }]} />
          <TouchableOpacity style={styles.camClose} onPress={() => setCameraOpen(false)}>
            <Text style={styles.camCloseText}>✕ Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.camTitle}>Face Recognition</Text>
          <View style={styles.camBottom}>
            <View style={styles.pulseDot} />
            <Text style={styles.camSub}>AI scanning faces...</Text>
          </View>
          {processing && (
            <View style={styles.overlay}>
              <ActivityIndicator size="large" color={COLORS.green} />
              <Text style={styles.overlayText}>Processing...</Text>
            </View>
          )}
        </View>
      </Modal>

      <Modal visible={!!pickerStudent} transparent animationType="fade">
        <View style={styles.modalBg}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Change Status</Text>
            <View style={styles.pickerGrid}>
              {STATUSES.map((st) => (
                <TouchableOpacity
                  key={st.id}
                  style={[
                    styles.pickerOpt,
                    { borderColor: st.color, borderWidth: pickerStudent?.status === st.id ? 3 : 1 },
                  ]}
                  onPress={() => {
                    setStudents((prev) =>
                      prev.map((p) =>
                        p.id === pickerStudent?.id ? { ...p, status: st.id } : p
                      )
                    );
                    setPickerStudent(null);
                  }}
                >
                  <Text style={styles.pickerIcon}>{st.icon}</Text>
                  <Text style={{ color: st.color, fontWeight: '800' }}>{st.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
            <TouchableOpacity onPress={() => setPickerStudent(null)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Modal visible={sigModal} transparent>
        <View style={styles.modalBg}>
          <View style={styles.pickerModal}>
            <Text style={styles.pickerTitle}>Your Signature</Text>
            <TextInput
              style={styles.sigInput}
              placeholder="CAPITAL LETTERS"
              placeholderTextColor={COLORS.textMuted}
              value={signature}
              onChangeText={(t) => setSignature(t.toUpperCase())}
              autoCapitalize="characters"
            />
            <TouchableOpacity
              style={styles.sendBtn}
              onPress={editMode ? updateResend : sendAttendance}
            >
              <Text style={styles.saveText}>{editMode ? 'Update & Resend' : 'Send'}</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setSigModal(false)}>
              <Text style={styles.cancel}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40 },
  infoCard: { backgroundColor: COLORS.card, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: COLORS.border, marginBottom: 16 },
  codeBadge: { color: COLORS.blue, fontWeight: '800', fontSize: 12 },
  title: { color: COLORS.textPrimary, fontSize: 20, fontWeight: '800' },
  sub: { color: COLORS.textSecondary, marginTop: 4, fontWeight: '600' },
  statusLine: { color: COLORS.orange, marginTop: 8, fontWeight: '800', fontSize: 12 },
  scanBtn: { backgroundColor: COLORS.card, padding: 32, borderRadius: 16, alignItems: 'center', borderWidth: 2, borderColor: COLORS.green },
  scanIcon: { fontSize: 40 },
  scanText: { color: COLORS.green, fontWeight: '800', fontSize: 18, marginTop: 8 },
  scanSub: { color: COLORS.textMuted, marginTop: 4 },
  countRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  countBox: { flex: 1, backgroundColor: COLORS.card, padding: 12, borderRadius: 12, alignItems: 'center' },
  countVal: { fontSize: 22, fontWeight: '800' },
  countLbl: { color: COLORS.textMuted, fontSize: 11 },
  barBg: { height: 8, backgroundColor: COLORS.border, borderRadius: 4 },
  barFill: { height: 8, borderRadius: 4 },
  pctText: { color: COLORS.textSecondary, textAlign: 'center', marginVertical: 8, fontWeight: '600' },
  editBanner: { color: COLORS.orange, fontWeight: '800', textAlign: 'center', marginBottom: 8 },
  listTitle: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', marginVertical: 12 },
  studentRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.card, padding: 12, borderRadius: 12, marginBottom: 6, borderWidth: 1, borderColor: COLORS.border },
  avatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.border, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  stuName: { color: COLORS.textPrimary, fontWeight: '800' },
  stuReg: { color: COLORS.textMuted, fontSize: 12 },
  badge: { fontWeight: '800', textTransform: 'capitalize', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  saveBtn: { backgroundColor: COLORS.green, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 12 },
  sendBtn: { backgroundColor: COLORS.purple, padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  saveText: { color: '#07090f', fontWeight: '800', fontSize: 16 },
  sentCard: { backgroundColor: 'rgba(0,245,160,0.1)', padding: 16, borderRadius: 14, marginTop: 12, borderWidth: 1, borderColor: COLORS.green },
  sentTitle: { color: COLORS.green, fontWeight: '800' },
  sentSub: { color: COLORS.textSecondary, marginTop: 4 },
  editBtn: { borderWidth: 1, borderColor: COLORS.orange, padding: 14, borderRadius: 14, alignItems: 'center', marginTop: 8 },
  editText: { color: COLORS.orange, fontWeight: '800' },
  camFull: { flex: 1, backgroundColor: '#000' },
  cam: { flex: 1 },
  camScan: { position: 'absolute', left: 40, right: 40, height: 2, backgroundColor: COLORS.green, top: 120 },
  camClose: { position: 'absolute', top: 50, left: 20 },
  camCloseText: { color: '#fff', fontWeight: '800', fontSize: 18 },
  camTitle: { position: 'absolute', top: 50, alignSelf: 'center', width: '100%', textAlign: 'center', color: '#fff', fontWeight: '800' },
  camBottom: { position: 'absolute', bottom: 40, alignSelf: 'center', alignItems: 'center' },
  pulseDot: { width: 12, height: 12, borderRadius: 6, backgroundColor: COLORS.green, marginBottom: 8 },
  camSub: { color: COLORS.green, fontWeight: '600' },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center' },
  overlayText: { color: '#fff', marginTop: 12 },
  modalBg: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  pickerModal: { backgroundColor: COLORS.card, padding: 20, borderTopLeftRadius: 20, borderTopRightRadius: 20 },
  pickerTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 18, marginBottom: 16 },
  pickerGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  pickerOpt: { width: '47%', padding: 16, borderRadius: 14, alignItems: 'center', backgroundColor: COLORS.background },
  pickerIcon: { fontSize: 24 },
  cancel: { color: COLORS.textMuted, textAlign: 'center', marginTop: 16, fontWeight: '600' },
  sigInput: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, marginBottom: 12, fontWeight: '800' },
});
