import { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Alert, Image, ActivityIndicator } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { router } from 'expo-router';
import AppBar from '../components/AppBar';
import { COLORS } from '../constants/colors';
import api, { BASE_URL } from '../services/api';
import { getCurrentUser, logout } from '../services/auth';
import { handleError } from '../utils/errors';

export default function ProfileScreen() {
  const [user, setUser] = useState<any>(null);
  const [me, setMe] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    load();
  }, []);

  const load = async () => {
    try {
      const u = await getCurrentUser();
      setUser(u);
      const res = await api.get('/auth/me');
      setMe(res.data);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const pickPhoto = () => {
    Alert.alert('Profile Photo', 'Choose source', [
      {
        text: 'Camera',
        onPress: async () => {
          const r = await ImagePicker.launchCameraAsync({ quality: 0.8 });
          if (!r.canceled) uploadPhoto(r.assets[0].uri);
        },
      },
      {
        text: 'Gallery',
        onPress: async () => {
          const r = await ImagePicker.launchImageLibraryAsync({ quality: 0.8 });
          if (!r.canceled) uploadPhoto(r.assets[0].uri);
        },
      },
      { text: 'Cancel', style: 'cancel' },
    ]);
  };

  const uploadPhoto = async (uri: string) => {
    try {
      const form = new FormData();
      form.append('file', { uri, name: 'photo.jpg', type: 'image/jpeg' } as any);
      await api.put(`/users/${user.id}/photo`, form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      load();
    } catch (e) {
      handleError(e);
    }
  };

  const onLogout = async () => {
    await logout();
    router.replace('/');
  };

  const photoUri = me?.photo_path ? `${BASE_URL}${me.photo_path}` : null;

  return (
    <View style={styles.container}>
      <AppBar title="Profile" showBack />
      {loading ? (
        <ActivityIndicator color={COLORS.green} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={styles.scroll}>
          <TouchableOpacity style={styles.avatarWrap} onPress={pickPhoto}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatar} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{user?.name?.charAt(0)}</Text>
              </View>
            )}
            <Text style={styles.camBadge}>📷</Text>
          </TouchableOpacity>

          <View style={styles.card}>
            <Row label="Full Name" value={me?.name} />
            <Row label={user?.role === 'Student' ? 'Register No' : 'Email'} value={me?.email || me?.register_number} />
            <Row label="Phone" value={me?.phone || '—'} />
            <Row label="Department" value={me?.department} />
            <Row
              label="Role Info"
              value={
                me?.faculty_role ||
                (me?.year ? `${me.year} · Section ${me.section}` : me?.designation || user?.role)
              }
            />
          </View>

          <TouchableOpacity style={styles.setting}>
            <Text style={styles.settingText}>Change Password</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.setting}>
            <Text style={styles.settingText}>Notifications</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.setting}>
            <Text style={styles.settingText}>Help & Support</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.logout} onPress={onLogout}>
            <Text style={styles.logoutText}>Logout</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
    </View>
  );
}

function Row({ label, value }: { label: string; value?: string }) {
  return (
    <View style={styles.row}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowVal}>{value || '—'}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  scroll: { padding: 16, paddingBottom: 40, alignItems: 'center' },
  avatarWrap: { marginVertical: 20, position: 'relative' },
  avatar: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.card, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: COLORS.green },
  avatarText: { fontSize: 40, color: COLORS.green, fontWeight: '800' },
  camBadge: { position: 'absolute', bottom: 0, right: 0, fontSize: 20 },
  card: { width: '100%', backgroundColor: COLORS.card, borderRadius: 16, padding: 16, borderWidth: 1, borderColor: COLORS.border },
  row: { marginBottom: 12 },
  rowLabel: { color: COLORS.textMuted, fontSize: 11, fontWeight: '800' },
  rowVal: { color: COLORS.textPrimary, fontWeight: '600', marginTop: 4 },
  setting: { width: '100%', padding: 16, backgroundColor: COLORS.card, borderRadius: 14, marginTop: 10, borderWidth: 1, borderColor: COLORS.border },
  settingText: { color: COLORS.textPrimary, fontWeight: '600' },
  logout: { width: '100%', padding: 16, backgroundColor: 'rgba(248,113,113,0.15)', borderRadius: 14, marginTop: 24, alignItems: 'center', borderWidth: 1, borderColor: COLORS.red },
  logoutText: { color: COLORS.red, fontWeight: '800' },
});
