import React, { useState, useEffect, useContext, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  RefreshControl,
  Image,
  Modal,
  Alert,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { complaintService, userService, SERVER_ROOT_URL } from '../services/api';
import CustomPicker from '../components/CustomPicker';

const statusColors = {
  Pending: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: '⏳' },
  Assigned: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', icon: '👤' },
  'In-Progress': { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', icon: '⚙️' },
  Onhold: { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF', icon: '⏸️' },
  Closed: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0', icon: '✅' },
};

const statusUpdateOptions = [
  { label: '⏳ Pending', value: 'Pending' },
  { label: '👤 Assigned', value: 'Assigned' },
  { label: '⚙️ In-Progress (Under Work)', value: 'In-Progress' },
  { label: '⏸️ Onhold (Paused / Waiting)', value: 'Onhold' },
  { label: '✅ Closed (Completed)', value: 'Closed' },
];

const AllComplaintsScreen = ({ route }) => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState(route?.params?.initialFilter || 'All');
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Assign Modal state
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  // Status Modal state
  const [statusModalVisible, setStatusModalVisible] = useState(false);
  const [statusTargetId, setStatusTargetId] = useState(null);
  const [selectedStatusValue, setSelectedStatusValue] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setFilterStatus(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  const fetchAllData = useCallback(async () => {
    try {
      setLoading(true);
      const [compRes, usersRes] = await Promise.all([
        complaintService.getAll(),
        userService.getAll().catch(() => ({ data: [] })),
      ]);
      setComplaints(compRes.data || []);
      setUsers(usersRes.data || []);
    } catch (err) {
      console.log('Error fetching all complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter((c) => {
        const cStatus = (c.status || '').toLowerCase().trim();
        const fStatus = filterStatus.toLowerCase().trim();
        if (fStatus === 'closed') return cStatus === 'closed' || cStatus === 'completed';
        if (fStatus === 'in-progress') return cStatus === 'in-progress' || cStatus === 'inprogress' || cStatus === 'in progress';
        if (fStatus === 'onhold') return cStatus === 'onhold' || cStatus === 'on hold';
        if (fStatus === 'assigned') return cStatus === 'assigned';
        if (fStatus === 'pending') return cStatus === 'pending';
        return cStatus === fStatus;
      }));
    }
  }, [filterStatus, complaints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchAllData();
    setRefreshing(false);
  };

  // Open Assign Modal
  const handleOpenAssignModal = (complaintId) => {
    setSelectedComplaintId(complaintId);
    setSelectedAssignee('');
    setAssignModalVisible(true);
  };

  const handleAssignSubmit = async () => {
    if (!selectedAssignee) {
      Alert.alert('Selection Required', 'Please select a staff member to assign.');
      return;
    }
    setAssignLoading(true);
    try {
      await complaintService.assign(selectedComplaintId, selectedAssignee);
      setAssignModalVisible(false);
      await fetchAllData();
      Alert.alert('Success', 'Complaint successfully assigned.');
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to assign complaint.');
    } finally {
      setAssignLoading(false);
    }
  };

  // Open Status Update Modal
  const handleOpenStatusModal = (complaint) => {
    setStatusTargetId(complaint._id);
    setSelectedStatusValue(complaint.status || 'Pending');
    setStatusModalVisible(true);
  };

  const handleStatusSubmit = async () => {
    if (!selectedStatusValue) {
      Alert.alert('Selection Required', 'Please choose a status.');
      return;
    }
    setStatusLoading(true);
    try {
      await complaintService.updateStatus(statusTargetId, selectedStatusValue);
      setStatusModalVisible(false);
      await fetchAllData();
      Alert.alert('Success', `Status updated to "${selectedStatusValue}"`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Quick 1-tap direct status change
  const handleDirectStatusChange = async (complaintId, targetStatus) => {
    try {
      await complaintService.updateStatus(complaintId, targetStatus);
      await fetchAllData();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status.');
    }
  };

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const staffUsers = users.filter((u) => u.role !== 'SuperAdmin' && u.role !== 'User');
  const assignableUsers = staffUsers.length > 0 ? staffUsers : users.filter((u) => u.role !== 'SuperAdmin');

  const renderComplaintItem = ({ item }) => {
    const statusStyle = statusColors[item.status] || {
      bg: '#F1F5F9',
      text: '#475569',
      border: '#E2E8F0',
      icon: '📌',
    };

    const isAssignee = item.assignedTo && String(item.assignedTo._id || item.assignedTo) === String(user?.id || user?._id);
    const canManage = isSuperAdmin || isAssignee;

    const attachmentUrl = item.attachment
      ? (item.attachment.startsWith('http')
          ? item.attachment
          : `${SERVER_ROOT_URL}/${item.attachment.replace(/^\//, '')}`)
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.blockText}>{item.blockName || 'Main Campus'}</Text>
            <Text style={styles.roomText}>Room: {item.roomNumber || 'N/A'}</Text>
          </View>
          <View
            style={[
              styles.statusBadge,
              { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
            ]}
          >
            <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
              {statusStyle.icon} {item.status}
            </Text>
          </View>
        </View>

        <Text style={styles.typeText}>{item.complaintType}</Text>
        <Text style={styles.remarksText}>
          {item.remarks || 'No remarks provided.'}
        </Text>

        {/* Inline Attachment Photo */}
        {attachmentUrl && (
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: attachmentUrl }}
              style={styles.attachmentThumbnail}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Process & Personnel Info */}
        <View style={styles.metaRow}>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>👤 Reported By:</Text>
            <Text style={styles.metaBold}>
              {item.createdBy?.username || item.createdBy?.email || 'User'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>🛠️ Assigned Staff:</Text>
            <Text style={[styles.metaBold, !item.assignedTo && styles.unassignedText]}>
              {item.assignedTo?.username
                ? `${item.assignedTo.username} (${item.assignedTo.role || 'Staff'})`
                : 'Not assigned yet'}
            </Text>
          </View>
          <View style={styles.metaItem}>
            <Text style={styles.metaLabel}>⚙️ Current Process:</Text>
            <Text style={[styles.metaBold, { color: statusStyle.text }]}>
              {item.status === 'Pending' && 'Pending Admin Review'}
              {item.status === 'Assigned' && 'Assigned - Work queued'}
              {item.status === 'In-Progress' && 'Work is actively in progress'}
              {item.status === 'Onhold' && 'On Hold (Awaiting parts / inspection)'}
              {item.status === 'Closed' && 'Resolved & Completed'}
            </Text>
          </View>
        </View>

        {/* Quick Action Status Chips for SuperAdmin & Assignee */}
        {canManage && (
          <View style={styles.quickStatusRow}>
            <Text style={styles.quickStatusLabel}>Quick Status:</Text>
            {item.status !== 'In-Progress' && (
              <TouchableOpacity
                style={[styles.quickChip, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
                onPress={() => handleDirectStatusChange(item._id, 'In-Progress')}
              >
                <Text style={[styles.quickChipText, { color: '#4338CA' }]}>⚙️ In-Progress</Text>
              </TouchableOpacity>
            )}
            {item.status !== 'Onhold' && (
              <TouchableOpacity
                style={[styles.quickChip, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}
                onPress={() => handleDirectStatusChange(item._id, 'Onhold')}
              >
                <Text style={[styles.quickChipText, { color: '#7E22CE' }]}>⏸️ On Hold</Text>
              </TouchableOpacity>
            )}
            {item.status !== 'Closed' && (
              <TouchableOpacity
                style={[styles.quickChip, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={() => handleDirectStatusChange(item._id, 'Closed')}
              >
                <Text style={[styles.quickChipText, { color: '#047857' }]}>✅ Close</Text>
              </TouchableOpacity>
            )}
            {item.status === 'Closed' && (
              <TouchableOpacity
                style={[styles.quickChip, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
                onPress={() => handleDirectStatusChange(item._id, 'Pending')}
              >
                <Text style={[styles.quickChipText, { color: '#B45309' }]}>↺ Reopen</Text>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Card Footer Actions */}
        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            📅 {new Date(item.createdAt).toLocaleString()}
          </Text>

          <View style={styles.actionButtonsGroup}>
            {isSuperAdmin && (
              <TouchableOpacity
                style={styles.assignBtn}
                onPress={() => handleOpenAssignModal(item._id)}
              >
                <Text style={styles.assignBtnText}>👤 Assign Staff</Text>
              </TouchableOpacity>
            )}

            {canManage && (
              <TouchableOpacity
                style={styles.statusBtn}
                onPress={() => handleOpenStatusModal(item)}
              >
                <Text style={styles.statusBtnText}>🔄 Change Status</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Status Filter Tabs */}
        <View style={styles.filtersBar}>
          {['All', 'Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'].map((status) => {
            const isSelected = filterStatus === status;
            return (
              <TouchableOpacity
                key={status}
                style={[styles.filterChip, isSelected && styles.filterChipActive]}
                onPress={() => setFilterStatus(status)}
              >
                <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
                  {status}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {loading && !refreshing ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={filteredComplaints}
            keyExtractor={(item) => item._id}
            renderItem={renderComplaintItem}
            contentContainerStyle={styles.listContent}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyTitle}>No Complaints</Text>
                <Text style={styles.emptySubtitle}>No tickets match the selected status.</Text>
              </View>
            }
          />
        )}

        {/* Assign Modal */}
        <Modal
          visible={assignModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAssignModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Assign Complaint</Text>
              <Text style={styles.modalSub}>Select a technician / staff member:</Text>

              <CustomPicker
                label="Assignee"
                selectedValue={selectedAssignee}
                onValueChange={setSelectedAssignee}
                items={assignableUsers.map((u) => ({
                  label: `${u.username} (${u.role || 'Staff'})`,
                  value: u._id,
                }))}
                placeholder="-- Select Staff --"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setAssignModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, assignLoading && styles.btnDisabled]}
                  onPress={handleAssignSubmit}
                  disabled={assignLoading}
                >
                  {assignLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Confirm Assignment</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>

        {/* Update Status Modal */}
        <Modal
          visible={statusModalVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setStatusModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <Text style={styles.modalTitle}>Update Process Status</Text>
              <Text style={styles.modalSub}>Set the current working stage of this ticket:</Text>

              <CustomPicker
                label="Process Stage"
                selectedValue={selectedStatusValue}
                onValueChange={setSelectedStatusValue}
                items={statusUpdateOptions}
                placeholder="-- Choose Status --"
              />

              <View style={styles.modalActions}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => setStatusModalVisible(false)}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.confirmBtn, statusLoading && styles.btnDisabled]}
                  onPress={handleStatusSubmit}
                  disabled={statusLoading}
                >
                  {statusLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.confirmBtnText}>Save Status</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  filtersBar: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
    gap: 6,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterChipActive: {
    backgroundColor: '#2563EB',
    borderColor: '#2563EB',
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  filterChipTextActive: {
    color: '#FFFFFF',
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  blockText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  roomText: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  typeText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#2563EB',
    marginBottom: 4,
  },
  remarksText: {
    fontSize: 13,
    color: '#475569',
    marginBottom: 10,
    lineHeight: 18,
  },
  imageContainer: {
    marginBottom: 10,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#F1F5F9',
  },
  attachmentThumbnail: {
    width: '100%',
    height: 180,
    borderRadius: 8,
  },
  metaRow: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 5,
    borderWidth: 1,
    borderColor: '#F1F5F9',
  },
  metaItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  metaLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  metaBold: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  unassignedText: {
    color: '#DC2626',
    fontStyle: 'italic',
  },
  quickStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    paddingTop: 4,
  },
  quickStatusLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  quickChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  quickChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
  },
  actionButtonsGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  assignBtn: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  assignBtnText: {
    fontSize: 12,
    color: '#2563EB',
    fontWeight: '700',
  },
  statusBtn: {
    backgroundColor: '#F0FDF4',
    borderWidth: 1,
    borderColor: '#BBF7D0',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  statusBtnText: {
    fontSize: 12,
    color: '#16A34A',
    fontWeight: '700',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    padding: 40,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#94A3B8',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    padding: 20,
  },
  modalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  modalSub: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 10,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#F1F5F9',
  },
  cancelBtnText: {
    color: '#64748B',
    fontWeight: '600',
  },
  confirmBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default AllComplaintsScreen;
