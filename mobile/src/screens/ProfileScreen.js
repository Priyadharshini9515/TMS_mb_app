import React, { useContext } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  Alert,
  Platform,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';

const ProfileScreen = () => {
  const { user, logout } = useContext(AuthContext);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out of your account?', [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Log Out',
          style: 'destructive',
          onPress: async () => {
            await logout();
          },
        },
      ]);
    }
  };


  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Avatar Card */}
        <View style={styles.avatarCard}>
          <View style={styles.avatarCircle}>
            <Text style={styles.avatarLetter}>
              {user?.username ? user.username[0].toUpperCase() : 'U'}
            </Text>
          </View>
          <Text style={styles.profileName}>{user?.username || 'User'}</Text>
          <View style={styles.roleChip}>
            <Text style={styles.roleChipText}>{user?.role || 'Member'}</Text>
          </View>
        </View>

        {/* Account Details Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeading}>Account Information</Text>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Corporate Email</Text>
            <Text style={styles.value}>{user?.email || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Contact Phone</Text>
            <Text style={styles.value}>{user?.phone || '-'}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Department</Text>
            <Text style={styles.value}>
              {user?.department?.name || user?.department || 'Not Assigned'}
            </Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.label}>Account ID</Text>
            <Text style={styles.valueSmall}>{user?.id || user?._id || '-'}</Text>
          </View>
        </View>

        {/* App Info Card */}
        <View style={styles.detailsCard}>
          <Text style={styles.cardHeading}>App & System</Text>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Application</Text>
            <Text style={styles.value}>TMS Mobile (React Native / Expo)</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.label}>Build Version</Text>
            <Text style={styles.value}>1.0.0</Text>
          </View>
        </View>

        {/* Logout Button */}
        <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout} activeOpacity={0.8}>
          <Text style={styles.logoutBtnText}>LOG OUT</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  avatarCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#2563EB',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarLetter: {
    fontSize: 34,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  roleChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#38BDF8',
  },
  roleChipText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  detailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cardHeading: {
    fontSize: 14,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 14,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailRow: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F8FAFC',
  },
  label: {
    fontSize: 12,
    color: '#94A3B8',
    fontWeight: '600',
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  value: {
    fontSize: 15,
    color: '#0F172A',
    fontWeight: '600',
  },
  valueSmall: {
    fontSize: 13,
    color: '#64748B',
    fontFamily: 'monospace',
  },
  logoutBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  logoutBtnText: {
    color: '#DC2626',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 1,
  },
});

export default ProfileScreen;
