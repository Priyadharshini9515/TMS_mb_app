import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Alert,
  Platform,
  ScrollView,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import {
  complaintService,
  departmentService,
  programmeService,
  userService,
} from '../services/api';
import CustomPicker from '../components/CustomPicker';

const statusOptions = [
  { label: 'All Statuses', value: '' },
  { label: 'Pending', value: 'Pending' },
  { label: 'Assigned', value: 'Assigned' },
  { label: 'In-Progress', value: 'In-Progress' },
  { label: 'Onhold', value: 'Onhold' },
  { label: 'Closed', value: 'Closed' },
];

const complaintTypeOptions = [
  { label: 'All Complaint Types', value: '' },
  { label: 'PC Hardware', value: 'PC Hardware' },
  { label: 'PC Software', value: 'PC Software' },
  { label: 'Application Issues', value: 'Application Issues' },
  { label: 'Network', value: 'Network' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Other', value: 'Other' },
];

const ReportsScreen = () => {
  const { user } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    department: '',
    programme: '',
    complaintType: '',
    status: '',
    assignee: '',
  });

  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [filterVisible, setFilterVisible] = useState(true);

  const isSuperAdmin = user?.role && ['superadmin', 'admin'].includes(user.role.toLowerCase());

  const fetchReport = useCallback(async (customFilters) => {
    setLoading(true);
    try {
      const activeFilters = customFilters || filters;
      const params = { ...activeFilters };
      Object.keys(params).forEach((k) => {
        if (!params[k]) delete params[k];
      });
      const res = await complaintService.report(params);
      setResults(res.data || []);
    } catch (err) {
      console.error('Failed to fetch report:', err);
      const msg = err.response?.data?.message || err.message || 'Failed to fetch report.';
      if (Platform.OS === 'web') {
        alert(msg);
      } else {
        Alert.alert('Error', msg);
      }
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    if (!isSuperAdmin) return;
    
    // Fetch master filter data
    departmentService.getAll().then((r) => {
      const list = (r.data || []).map((d) => ({ label: d.name, value: d._id }));
      setDepartments([{ label: 'All Departments', value: '' }, ...list]);
    }).catch(() => {});

    programmeService.getAll().then((r) => {
      const list = (r.data || []).map((p) => ({ label: p.name, value: p._id }));
      setProgrammes([{ label: 'All Programmes', value: '' }, ...list]);
    }).catch(() => {});

    userService.getAll().then((r) => {
      const list = (r.data || []).map((u) => ({ label: `${u.username} (${u.role || 'User'})`, value: u._id }));
      setUsers([{ label: 'Any Assignee', value: '' }, ...list]);
    }).catch(() => {});

    // Initial report load (all records)
    fetchReport({});
  }, [isSuperAdmin]);

  const handleResetFilters = () => {
    const emptyFilters = {
      department: '',
      programme: '',
      complaintType: '',
      status: '',
      assignee: '',
    };
    setFilters(emptyFilters);
    fetchReport(emptyFilters);
  };

  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case 'Closed':
        return { bg: '#DCFCE7', text: '#15803D', border: '#86EFAC' };
      case 'In-Progress':
        return { bg: '#E0E7FF', text: '#4338CA', border: '#A5B4FC' };
      case 'Assigned':
        return { bg: '#FEE2E2', text: '#B91C1C', border: '#FCA5A5' };
      case 'Onhold':
        return { bg: '#F3E8FF', text: '#7E22CE', border: '#D8B4FE' };
      default:
        return { bg: '#FEF3C7', text: '#B45309', border: '#FCD34D' };
    }
  };

  if (!isSuperAdmin) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedTitle}>Access Restricted</Text>
          <Text style={styles.restrictedSub}>Only administrators can access audit and report records.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Header Bar */}
        <View style={styles.headerBar}>
          <View>
            <Text style={styles.heading}>Audit & Reports</Text>
            <Text style={styles.subHeading}>{results.length} record(s) matching criteria</Text>
          </View>
          <TouchableOpacity
            style={styles.toggleFilterBtn}
            onPress={() => setFilterVisible(!filterVisible)}
            activeOpacity={0.7}
          >
            <Text style={styles.toggleFilterText}>{filterVisible ? 'Hide Filters ▲' : 'Filters ▼'}</Text>
          </TouchableOpacity>
        </View>

        {/* Filter Card */}
        {filterVisible && (
          <View style={styles.filterCard}>
            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <CustomPicker
                  label="Department"
                  selectedValue={filters.department}
                  onValueChange={(val) => setFilters({ ...filters, department: val })}
                  items={departments}
                />
              </View>
              <View style={styles.filterCol}>
                <CustomPicker
                  label="Programme"
                  selectedValue={filters.programme}
                  onValueChange={(val) => setFilters({ ...filters, programme: val })}
                  items={programmes}
                />
              </View>
            </View>

            <View style={styles.filterRow}>
              <View style={styles.filterCol}>
                <CustomPicker
                  label="Complaint Type"
                  selectedValue={filters.complaintType}
                  onValueChange={(val) => setFilters({ ...filters, complaintType: val })}
                  items={complaintTypeOptions}
                />
              </View>
              <View style={styles.filterCol}>
                <CustomPicker
                  label="Status"
                  selectedValue={filters.status}
                  onValueChange={(val) => setFilters({ ...filters, status: val })}
                  items={statusOptions}
                />
              </View>
            </View>

            <CustomPicker
              label="Assigned Staff"
              selectedValue={filters.assignee}
              onValueChange={(val) => setFilters({ ...filters, assignee: val })}
              items={users}
            />

            <View style={styles.btnRow}>
              <TouchableOpacity
                style={styles.resetBtn}
                onPress={handleResetFilters}
                disabled={loading}
              >
                <Text style={styles.resetBtnText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.generateBtn, loading && styles.btnDisabled]}
                onPress={() => fetchReport()}
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator color="#FFFFFF" size="small" />
                ) : (
                  <Text style={styles.generateBtnText}>GENERATE REPORT</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}

        {/* Results List */}
        {loading && !filterVisible ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
            <Text style={styles.loadingText}>Loading report records...</Text>
          </View>
        ) : (
          <FlatList
            data={results}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => {
              const bStyle = getStatusBadgeStyle(item.status);
              return (
                <View style={styles.card}>
                  <View style={styles.cardHeader}>
                    <Text style={styles.typeText}>{item.complaintType}</Text>
                    <View style={[styles.statusBadge, { backgroundColor: bStyle.bg, borderColor: bStyle.border }]}>
                      <Text style={[styles.statusBadgeText, { color: bStyle.text }]}>{item.status}</Text>
                    </View>
                  </View>

                  <Text style={styles.locationText}>
                    📍 {item.blockName} • Room {item.roomNumber}
                  </Text>

                  <View style={styles.personnelSection}>
                    <Text style={styles.personnelText}>
                      <Text style={styles.boldLabel}>Raised By:</Text> {item.createdBy?.username || item.createdBy?.email || 'User'}
                    </Text>
                    <Text style={styles.personnelText}>
                      <Text style={styles.boldLabel}>Assigned Staff:</Text> {item.assignedTo ? `${item.assignedTo.username} (${item.assignedTo.role || 'Staff'})` : 'Not Assigned'}
                    </Text>
                  </View>

                  {item.remarks ? (
                    <Text style={styles.remarksText} numberOfLines={3}>
                      <Text style={styles.boldLabel}>Remarks: </Text>{item.remarks}
                    </Text>
                  ) : null}

                  <Text style={styles.dateText}>
                    📅 {new Date(item.createdAt).toLocaleString()}
                  </Text>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>📊</Text>
                <Text style={styles.emptyTitle}>No Matching Complaints Found</Text>
                <Text style={styles.emptySubtitle}>Try changing or resetting your filter criteria above.</Text>
              </View>
            }
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  container: {
    flex: 1,
  },
  restrictedContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  restrictedTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#DC2626',
    marginBottom: 8,
  },
  restrictedSub: {
    fontSize: 14,
    color: '#64748B',
    textAlign: 'center',
  },
  headerBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  heading: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  subHeading: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  toggleFilterBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  toggleFilterText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  filterRow: {
    flexDirection: 'row',
    gap: 12,
  },
  filterCol: {
    flex: 1,
  },
  btnRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  resetBtn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F1F5F9',
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CBD5E1',
  },
  resetBtnText: {
    color: '#475569',
    fontWeight: '700',
    fontSize: 14,
  },
  generateBtn: {
    flex: 1,
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#2563EB',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  generateBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
    letterSpacing: 0.5,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  listContent: {
    padding: 16,
    paddingBottom: 32,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 1,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  typeText: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
    flex: 1,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  locationText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  personnelSection: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  personnelText: {
    fontSize: 12,
    color: '#475569',
    marginBottom: 2,
  },
  boldLabel: {
    fontWeight: '700',
    color: '#1E293B',
  },
  remarksText: {
    fontSize: 12,
    color: '#64748B',
    marginBottom: 8,
    lineHeight: 18,
  },
  dateText: {
    fontSize: 11,
    color: '#94A3B8',
    fontWeight: '500',
  },
  loadingContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#64748B',
    fontWeight: '600',
  },
  emptyContainer: {
    padding: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: 10,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#334155',
    marginBottom: 4,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
    textAlign: 'center',
  },
});

export default ReportsScreen;
