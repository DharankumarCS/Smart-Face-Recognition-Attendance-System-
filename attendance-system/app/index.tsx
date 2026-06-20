import { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Svg, { Circle, Ellipse, Path, Line, Rect } from 'react-native-svg';
import { router } from 'expo-router';
import { COLORS } from '../constants/colors';
import { login, getToken, getStoredRole } from '../services/auth';
import { handleError } from '../utils/errors';

const ROLES = [
  { id: 'HOD', label: 'HOD', desc: 'Department admin', icon: '🏛️', color: COLORS.green },
  { id: 'Faculty', label: 'Faculty', desc: 'Scan attendance', icon: '👨‍🏫', color: COLORS.blue },
  { id: 'Student', label: 'Student', desc: 'View attendance', icon: '🎓', color: COLORS.purple },
];

export default function LoginScreen() {
  const [role, setRole] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [registerNumber, setRegisterNumber] = useState('');
  const [dob, setDob] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const orbAnim = useRef(new Animated.Value(0.15)).current;
  const scanAnim = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 800, useNativeDriver: true }),
    ]).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(orbAnim, { toValue: 0.6, duration: 2000, useNativeDriver: true }),
        Animated.timing(orbAnim, { toValue: 0.15, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(scanAnim, { toValue: 1, duration: 1800, useNativeDriver: true })
    ).start();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.025, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    ).start();

    Animated.loop(
      Animated.timing(rotateAnim, { toValue: 1, duration: 10000, useNativeDriver: true })
    ).start();
  }, []);

  useEffect(() => {
    (async () => {
      const token = await getToken();
      const userRole = await getStoredRole();
      if (token && userRole) {
        if (userRole === 'HOD') router.replace('/hod');
        else if (userRole === 'Faculty') router.replace('/faculty');
        else if (userRole === 'Student') router.replace('/student');
      }
      setChecking(false);
    })();
  }, []);

  const navigateByRole = (userRole: string) => {
    if (userRole === 'HOD') router.replace('/hod');
    else if (userRole === 'Faculty') router.replace('/faculty');
    else router.replace('/student');
  };

  const onSignIn = async () => {
    setError('');
    if (!role) {
      setError('Please select your role');
      return;
    }
    if (role === 'Student') {
      if (!registerNumber || !dob) {
        setError('Register number and date of birth required');
        return;
      }
    } else if (!email || !password) {
      setError('Email and password required');
      return;
    }

    setLoading(true);
    try {
      const payload: any = { role, password: role === 'Student' ? dob : password };
      if (role === 'Student') {
        payload.register_number = registerNumber.toUpperCase();
        payload.date_of_birth = dob;
      } else {
        payload.email = email.trim().toLowerCase();
      }
      const user = await login(payload);
      navigateByRole(user.role);
    } catch (e: any) {
      if (e.response?.status === 401) {
        setError('Invalid credentials. Please try again.');
      } else if (e.request) {
        setError('Check your internet connection.');
      } else {
        setError('Server error. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  const spin = rotateAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const scanY = scanAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 80] });

  if (checking) {
    return (
      <View style={[styles.container, styles.center]}>
        <ActivityIndicator size="large" color={COLORS.green} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Animated.View style={[styles.orb, styles.orbGreen, { opacity: orbAnim }]} />
      <Animated.View style={[styles.orb, styles.orbBlue, { opacity: orbAnim }]} />
      <Animated.View style={[styles.orb, styles.orbPurple, { opacity: orbAnim }]} />

      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>
          <View style={styles.logoWrap}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <Svg width={120} height={120} viewBox="0 0 120 120">
                {[0, 60, 120, 180, 240, 300].map((a, i) => (
                  <Circle
                    key={i}
                    cx={60 + 50 * Math.cos((a * Math.PI) / 180)}
                    cy={60 + 50 * Math.sin((a * Math.PI) / 180)}
                    r={4}
                    fill={COLORS.green}
                  />
                ))}
              </Svg>
            </Animated.View>
            <View style={styles.faceBox}>
              <Svg width={80} height={100} viewBox="0 0 80 100">
                <Ellipse cx={40} cy={45} rx={28} ry={34} stroke={COLORS.green} strokeWidth={2} fill="none" />
                <Circle cx={30} cy={40} r={4} fill={COLORS.green} />
                <Circle cx={50} cy={40} r={4} fill={COLORS.green} />
                <Path d="M30 58 Q40 68 50 58" stroke={COLORS.green} strokeWidth={2} fill="none" />
                <Line x1={10} y1={45} x2={20} y2={45} stroke={COLORS.green} strokeWidth={1} />
                <Line x1={60} y1={45} x2={70} y2={45} stroke={COLORS.green} strokeWidth={1} />
              </Svg>
              <Animated.View style={[styles.scanLine, { transform: [{ translateY: scanY }] }]} />
            </View>
            <Text style={styles.badge}>FACE ID · AI POWERED</Text>
          </View>

          <Text style={styles.appTitle}>FaceAttend</Text>
          <Text style={styles.subtitle}>Smart Face Recognition Attendance System</Text>

          <View style={styles.card}>
            <Text style={styles.welcome}>Welcome Back</Text>
            <Text style={styles.welcomeSub}>Sign in to your account</Text>

            <View style={styles.roleRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.id}
                  style={[styles.roleCard, role === r.id && { borderColor: r.color, borderWidth: 2 }]}
                  onPress={() => setRole(r.id)}
                >
                  <Text style={styles.roleIcon}>{r.icon}</Text>
                  <Text style={styles.roleLabel}>{r.label}</Text>
                  <Text style={styles.roleDesc}>{r.desc}</Text>
                  {role === r.id && <Text style={styles.check}>✓</Text>}
                </TouchableOpacity>
              ))}
            </View>

            {role && role !== 'Student' && (
              <>
                <Text style={styles.label}>EMAIL ADDRESS</Text>
                <TextInput
                  style={styles.input}
                  placeholder="email@college.edu"
                  placeholderTextColor={COLORS.textMuted}
                  value={email}
                  onChangeText={setEmail}
                  autoCapitalize="none"
                  keyboardType="email-address"
                />
                <Text style={styles.label}>PASSWORD</Text>
                <TextInput
                  style={styles.input}
                  placeholder="••••••••"
                  placeholderTextColor={COLORS.textMuted}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry
                />
              </>
            )}

            {role === 'Student' && (
              <>
                <Text style={styles.label}>REGISTER NUMBER</Text>
                <TextInput
                  style={styles.input}
                  placeholder="21CS045"
                  placeholderTextColor={COLORS.textMuted}
                  value={registerNumber}
                  onChangeText={(t) => setRegisterNumber(t.toUpperCase())}
                  autoCapitalize="characters"
                />
                <Text style={styles.label}>DATE OF BIRTH (PASSWORD)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. 01/01/2003"
                  placeholderTextColor={COLORS.textMuted}
                  value={dob}
                  onChangeText={setDob}
                  secureTextEntry
                />
              </>
            )}

            {error ? (
              <View style={styles.errorBox}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
              <TouchableOpacity onPress={onSignIn} disabled={loading}>
                <LinearGradient colors={[COLORS.green, COLORS.blue]} style={styles.signBtn}>
                  {loading ? (
                    <ActivityIndicator color="#07090f" />
                  ) : (
                    <Text style={styles.signBtnText}>Sign In</Text>
                  )}
                </LinearGradient>
              </TouchableOpacity>
            </Animated.View>

            <Text style={styles.secured}>SECURED BY</Text>
            <View style={styles.tags}>
              {['Face Recognition', 'AES-256', 'Real-time AI'].map((t) => (
                <Text key={t} style={styles.tag}>
                  {t}
                </Text>
              ))}
            </View>
          </View>
          <Text style={styles.footer}>v1.0.0</Text>
        </Animated.View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { justifyContent: 'center', alignItems: 'center' },
  scroll: { padding: 20, paddingTop: 48, paddingBottom: 40 },
  orb: { position: 'absolute', width: 180, height: 180, borderRadius: 90 },
  orbGreen: { backgroundColor: COLORS.green, top: 40, right: -40 },
  orbBlue: { backgroundColor: COLORS.blue, bottom: 120, left: -60 },
  orbPurple: { backgroundColor: COLORS.purple, top: '40%', right: -30 },
  logoWrap: { alignItems: 'center', marginBottom: 12 },
  faceBox: { marginTop: -90, borderWidth: 2, borderColor: COLORS.green, padding: 8, borderRadius: 8, overflow: 'hidden' },
  scanLine: { position: 'absolute', left: 0, right: 0, height: 2, backgroundColor: COLORS.green },
  badge: { color: COLORS.textMuted, fontSize: 11, marginTop: 8, letterSpacing: 1 },
  appTitle: { fontSize: 36, fontWeight: '800', color: COLORS.green, textAlign: 'center', textShadowColor: COLORS.green, textShadowRadius: 12 },
  subtitle: { color: COLORS.textSecondary, textAlign: 'center', marginBottom: 20, fontWeight: '600' },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 20, borderWidth: 1, borderColor: COLORS.border },
  welcome: { color: COLORS.textPrimary, fontSize: 22, fontWeight: '800' },
  welcomeSub: { color: COLORS.textSecondary, marginBottom: 16, fontWeight: '600' },
  roleRow: { flexDirection: 'row', gap: 8, marginBottom: 16 },
  roleCard: { flex: 1, backgroundColor: COLORS.background, borderRadius: 12, padding: 10, borderWidth: 1, borderColor: COLORS.border, alignItems: 'center' },
  roleIcon: { fontSize: 20 },
  roleLabel: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 12 },
  roleDesc: { color: COLORS.textMuted, fontSize: 9, textAlign: 'center' },
  check: { color: COLORS.green, position: 'absolute', top: 4, right: 6, fontWeight: '800' },
  label: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800', marginBottom: 6, marginTop: 8 },
  input: { backgroundColor: COLORS.background, borderRadius: 12, padding: 14, color: COLORS.textPrimary, borderWidth: 1, borderColor: COLORS.border, fontWeight: '600' },
  errorBox: { backgroundColor: 'rgba(248,113,113,0.15)', padding: 12, borderRadius: 12, marginTop: 12 },
  errorText: { color: COLORS.red, fontWeight: '600' },
  signBtn: { padding: 16, borderRadius: 14, alignItems: 'center', marginTop: 16 },
  signBtnText: { color: '#07090f', fontWeight: '800', fontSize: 16 },
  secured: { color: COLORS.textMuted, textAlign: 'center', marginTop: 16, fontSize: 11 },
  tags: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8, marginTop: 8 },
  tag: { color: COLORS.textSecondary, fontSize: 11, backgroundColor: COLORS.background, paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  footer: { color: COLORS.textMuted, textAlign: 'center', marginTop: 16 },
});
