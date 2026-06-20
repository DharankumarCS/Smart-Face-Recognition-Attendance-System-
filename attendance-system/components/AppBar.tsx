import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { COLORS } from '../constants/colors';

type Props = {
  title: string;
  showBack?: boolean;
  rightIcon?: string;
};

export default function AppBar({ title, showBack = false, rightIcon = '👤' }: Props) {
  return (
    <View style={styles.bar}>
      {showBack ? (
        <TouchableOpacity onPress={() => router.back()} style={styles.side}>
          <Text style={styles.icon}>←</Text>
        </TouchableOpacity>
      ) : (
        <View style={styles.side} />
      )}
      <Text style={styles.title}>{title}</Text>
      <TouchableOpacity onPress={() => router.push('/profile')} style={styles.side}>
        <Text style={styles.avatar}>{rightIcon}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: COLORS.background,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  side: { width: 40, alignItems: 'center' },
  title: { color: COLORS.textPrimary, fontSize: 17, fontWeight: '800', flex: 1, textAlign: 'center' },
  icon: { color: COLORS.textPrimary, fontSize: 22 },
  avatar: { fontSize: 22 },
});
