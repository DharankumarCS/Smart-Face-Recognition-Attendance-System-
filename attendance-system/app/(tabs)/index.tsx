import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../../constants/colors';
import { getCurrentUser, getStoredRole } from '../../services/auth';

export default function HomeTab() {
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    (async () => {
      const u = await getCurrentUser();
      setUser(u);
      setLoading(false);
    })();
  }, []);

  const goDashboard = async () => {
    const role = await getStoredRole();
    if (role === 'HOD') router.replace('/hod');
    else if (role === 'Faculty') router.replace('/faculty');
    else if (role === 'Student') router.replace('/student');
    else router.replace('/');
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={COLORS.green} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>FaceAttend Home</Text>
      {user ? (
        <>
          <Text style={styles.sub}>Welcome, {user.name}</Text>
          <TouchableOpacity style={styles.btn} onPress={goDashboard}>
            <Text style={styles.btnText}>Go to Dashboard</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.btnOutline} onPress={() => router.push('/profile')}>
            <Text style={styles.btnTextOutline}>Profile</Text>
          </TouchableOpacity>
        </>
      ) : (
        <TouchableOpacity style={styles.btn} onPress={() => router.replace('/')}>
          <Text style={styles.btnText}>Sign In</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: 24, justifyContent: 'center' },
  center: { flex: 1, backgroundColor: COLORS.background, justifyContent: 'center', alignItems: 'center' },
  title: { color: COLORS.green, fontSize: 28, fontWeight: '800', marginBottom: 8 },
  sub: { color: COLORS.textSecondary, fontSize: 16, marginBottom: 24 },
  btn: { backgroundColor: COLORS.green, padding: 16, borderRadius: 14, alignItems: 'center', marginBottom: 12 },
  btnText: { color: '#07090f', fontWeight: '800', fontSize: 16 },
  btnOutline: { borderWidth: 1, borderColor: COLORS.border, padding: 16, borderRadius: 14, alignItems: 'center' },
  btnTextOutline: { color: COLORS.textPrimary, fontWeight: '600' },
});
