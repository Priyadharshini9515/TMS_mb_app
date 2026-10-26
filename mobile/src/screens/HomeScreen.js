import React, { useContext, useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  RefreshControl,
  Alert,
  Platform,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { complaintService } from '../services/api';
import StatCard from '../components/StatCard';

const HomeScreen = ({ navigation }) => {
  const { user, logout } = useContext(AuthContext);
  const [stats, setStats] = useState({ total: 0, pending: 0, assigned: 0, closed: 0 });
  const [refreshing, setRefreshing] = useState(false);

  const handleLogout = async () => {
    if (Platform.OS === 'web') {
      const confirmed = window.confirm('Are you sure you want to log out?');
      if (confirmed) {
        await logout();
      }
    } else {
      Alert.alert('Log Out', 'Are you sure you want to log out?', [
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

  const fetchDashboardStats = useCallback(async () => {
    try {
      const res = await complaintService.getStats();
      setStats(res.data || { total: 0, pending: 0, assigned: 0, closed: 0 });
    } catch (e) {
      console.log('Error fetching stats in HomeScreen:', e);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchDashboardStats();
    }, [fetchDashboardStats])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Top Header Card */}
        <View style={styles.welcomeCard}>
          <View style={styles.headerRow}>
            <View>
              <Text style={styles.greeting}>Command Center</Text>
              <Text style={styles.userName}>{user?.username || 'User'}</Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={styles.roleChip}>
                <Text style={styles.roleChipText}>{user?.role || 'Member'}</Text>
              </View>
              <TouchableOpacity onPress={handleLogout} style={styles.headerLogoutBtn} activeOpacity={0.7}>
                <Text style={styles.headerLogoutText}>Logout</Text>
              </TouchableOpacity>
            </View>
          </View>

          <Text style={styles.systemStatus}>
            ● System state: <Text style={styles.activeText}>Active & Connected</Text>
          </Text>

          <View style={styles.actionRow}>
            {user?.role !== 'Networking Staff' &&
             user?.role !== 'Electrician' &&
             user?.role !== 'Plumber' &&
             user?.role !== 'Software Developer' &&
             user?.role !== 'PC Hardware' && (
              <TouchableOpacity
                style={styles.primaryActionBtn}
                onPress={() => navigation.navigate('RaiseComplaint')}
              >
                <Text style={styles.primaryActionText}>+ RAISE COMPLAINT</Text>
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={styles.secondaryActionBtn}
              onPress={() => navigation.navigate('MyComplaints')}
            >
              <Text style={styles.secondaryActionText}>MY TICKETS</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Dashboard Metric Overview */}
        <Text style={styles.sectionTitle}>Overview Statistics</Text>
        <View style={styles.statsGrid}>
          <StatCard
            label="Total Tickets"
            value={stats.total}
            color="#2563EB"
            onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints', { initialFilter: 'All' })}
          />
          <StatCard
            label="Pending Review"
            value={stats.pending}
            color="#F59E0B"
            onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints', { initialFilter: 'Pending' })}
          />
          <StatCard
            label="In Progress"
            value={stats.assigned}
            color="#EC4899"
            onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints', { initialFilter: 'In-Progress' })}
          />
          <StatCard
            label="Resolved / Closed"
            value={stats.closed}
            color="#10B981"
            onPress={() => navigation.navigate(isSuperAdmin ? 'AllComplaints' : 'MyComplaints', { initialFilter: 'Closed' })}
          />
        </View>

        {/* Quick Navigation Sections */}
        {isSuperAdmin && (
          <View style={styles.adminSection}>
            <Text style={styles.sectionTitle}>Master Administrative Controls</Text>
            <View style={styles.menuGrid}>
              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('DepartmentManagement')}
              >
                <Text style={styles.menuIcon}>🏢</Text>
                <Text style={styles.menuTitle}>Departments</Text>
                <Text style={styles.menuSubtitle}>Manage depts & codes</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('ProgrammeManagement')}
              >
                <Text style={styles.menuIcon}>🎓</Text>
                <Text style={styles.menuTitle}>Programmes</Text>
                <Text style={styles.menuSubtitle}>Courses & streams</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('BlockManagement')}
              >
                <Text style={styles.menuIcon}>🏛️</Text>
                <Text style={styles.menuTitle}>Blocks</Text>
                <Text style={styles.menuSubtitle}>Campus buildings</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('RoomManagement')}
              >
                <Text style={styles.menuIcon}>🚪</Text>
                <Text style={styles.menuTitle}>Rooms</Text>
                <Text style={styles.menuSubtitle}>Classrooms & Labs</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('UserManagement')}
              >
                <Text style={styles.menuIcon}>👥</Text>
                <Text style={styles.menuTitle}>Users</Text>
                <Text style={styles.menuSubtitle}>Accounts & staff</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('RoleManagement')}
              >
                <Text style={styles.menuIcon}>🛡️</Text>
                <Text style={styles.menuTitle}>Roles</Text>
                <Text style={styles.menuSubtitle}>Permissions & types</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('AllComplaints')}
              >
                <Text style={styles.menuIcon}>📋</Text>
                <Text style={styles.menuTitle}>All Complaints</Text>
                <Text style={styles.menuSubtitle}>Assign & monitor</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.menuCard}
                onPress={() => navigation.navigate('Reports')}
              >
                <Text style={styles.menuIcon}>📊</Text>
                <Text style={styles.menuTitle}>Reports</Text>
                <Text style={styles.menuSubtitle}>Export & analytics</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
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
    paddingBottom: 36,
  },
  welcomeCard: {
    backgroundColor: '#0F172A',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#0F172A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  greeting: {
    fontSize: 13,
    color: '#94A3B8',
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  userName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  roleChip: {
    backgroundColor: 'rgba(56, 189, 248, 0.15)',
    borderWidth: 1,
    borderColor: '#38BDF8',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 5,
  },
  roleChipText: {
    color: '#38BDF8',
    fontSize: 12,
    fontWeight: '700',
  },
  systemStatus: {
    color: '#94A3B8',
    fontSize: 13,
    marginBottom: 18,
  },
  activeText: {
    color: '#10B981',
    fontWeight: '700',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  primaryActionBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
    letterSpacing: 0.5,
  },
  secondaryActionBtn: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderWidth: 1,
    borderColor: '#334155',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  secondaryActionText: {
    color: '#E2E8F0',
    fontWeight: '700',
    fontSize: 13,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 12,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
    marginBottom: 20,
  },
  adminSection: {
    marginTop: 8,
  },
  menuGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: 10,
  },
  menuCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  menuIcon: {
    fontSize: 26,
    marginBottom: 8,
  },
  menuTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 2,
  },
  menuSubtitle: {
    fontSize: 11,
    color: '#64748B',
  },
  headerLogoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.2)',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  headerLogoutText: {
    color: '#F87171',
    fontSize: 11,
    fontWeight: '700',
  },
});


export default HomeScreen;
