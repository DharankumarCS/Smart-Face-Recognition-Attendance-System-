import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { COLORS } from '../../constants/colors';
import { BASE_URL } from '../../services/api';

export default function ExploreTab() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Explore FaceAttend</Text>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Face Recognition</Text>
        <Text style={styles.text}>
          Faculty scan classrooms with AI-powered face detection. Students must register their face first.
        </Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Three Portals</Text>
        <Text style={styles.text}>HOD — department admin and reports{'\n'}Faculty — scan and mark attendance{'\n'}Student — view own attendance</Text>
      </View>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>API Server</Text>
        <Text style={styles.mono}>{BASE_URL}</Text>
        <Text style={styles.hint}>Phone and PC must be on the same WiFi network.</Text>
      </View>
      <Text style={styles.version}>v1.0.0</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content: { padding: 24, paddingTop: 60 },
  title: { color: COLORS.green, fontSize: 26, fontWeight: '800', marginBottom: 20 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: COLORS.border },
  cardTitle: { color: COLORS.textPrimary, fontWeight: '800', fontSize: 16, marginBottom: 8 },
  text: { color: COLORS.textSecondary, lineHeight: 22, fontWeight: '600' },
  mono: { color: COLORS.blue, fontFamily: 'monospace', marginBottom: 8 },
  hint: { color: COLORS.textMuted, fontSize: 13 },
  version: { color: COLORS.textMuted, textAlign: 'center', marginTop: 24 },
});
