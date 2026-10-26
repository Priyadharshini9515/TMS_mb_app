import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  SafeAreaView,
  Image,
  Alert,
  Modal,
} from 'react-native';
import { AuthContext } from '../context/AuthContext';
import { complaintService, userService, SERVER_ROOT_URL } from '../services/api';
import CustomPicker from '../components/CustomPicker';

const statusOptions = [
  { label: '⏳ Pending', value: 'Pending' },
  { label: '👤 Assigned', value: 'Assigned' },
  { label: '⚙️ In-Progress (Under Work)', value: 'In-Progress' },
  { label: '⏸️ Onhold (Paused / Waiting)', value: 'Onhold' },
  { label: '✅ Closed (Completed)', value: 'Closed' },
];

const statusColors = {
  Pending: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: '⏳' },
  Assigned: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', icon: '👤' },
  'In-Progress': { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', icon: '⚙️' },
  Onhold: { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF', icon: '⏸️' },
  Closed: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0', icon: '✅' },
};

const ComplaintDetailScreen = ({ route, navigation }) => {
  const { complaintId } = route.params;
  const { user } = useContext(AuthContext);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  // Assign Modal for SuperAdmin
  const [assignModalVisible, setAssignModalVisible] = useState(false);
  const [staffUsers, setStaffUsers] = useState([]);
  const [selectedAssignee, setSelectedAssignee] = useState('');
  const [assignLoading, setAssignLoading] = useState(false);

  const fetchDetail = async () => {
    try {
      setLoading(true);
      const res = await complaintService.getById(complaintId);
      setComplaint(res.data);
      setNewStatus(res.data?.status || 'Pending');

      if (user?.role === 'SuperAdmin') {
        const uRes = await userService.getAll().catch(() => ({ data: [] }));
        const list = uRes.data || [];
        setStaffUsers(list.filter((u) => u.role !== 'SuperAdmin' && u.role !== 'User'));
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [complaintId]);

  const handleStatusUpdate = async (statusToSet) => {
    const target = statusToSet || newStatus;
    if (!target) return;

    setUpdating(true);
    try {
      await complaintService.updateStatus(complaintId, target);
      Alert.alert('Success', `Status updated to "${target}"`);
      await fetchDetail();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdating(false);
    }
  };

  const handleAssignSubmit = async () => {
    if (!selectedAssignee) {
      Alert.alert('Selection Required', 'Please select a technician.');
      return;
    }
    setAssignLoading(true);
    try {
      await complaintService.assign(complaintId, selectedAssignee);
      setAssignModalVisible(false);
      Alert.alert('Success', 'Complaint successfully assigned.');
      await fetchDetail();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to assign complaint.');
    } finally {
      setAssignLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#2563EB" />
      </SafeAreaView>
    );
  }

  if (!complaint) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <Text style={styles.notFoundText}>Complaint record not found.</Text>
      </SafeAreaView>
    );
  }

  const isSuperAdmin = user?.role === 'SuperAdmin';
  const isCreator = String(complaint.createdBy?._id || complaint.createdBy) === String(user?.id || user?._id);
  const isAssignee = String(complaint.assignedTo?._id || complaint.assignedTo) === String(user?.id || user?._id);
  const canUpdateStatus = isSuperAdmin || isAssignee || isCreator;

  const statusStyle = statusColors[complaint.status] || {
    bg: '#F1F5F9',
    text: '#475569',
    border: '#E2E8F0',
    icon: '📌',
  };

  const attachmentUrl = complaint.attachment
    ? (complaint.attachment.startsWith('http')
        ? complaint.attachment
        : `${SERVER_ROOT_URL}/${complaint.attachment.replace(/^\//, '')}`)
    : null;

  // Process Stage determination
  const getStepActive = (stepNum) => {
    const s = complaint.status;
    if (stepNum === 1) return true; // Submitted is always reached
    if (stepNum === 2) return s === 'Assigned' || s === 'In-Progress' || s === 'Onhold' || s === 'Closed';
    if (stepNum === 3) return s === 'In-Progress' || s === 'Onhold' || s === 'Closed';
    if (stepNum === 4) return s === 'Closed';
    return false;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header Status Card */}
        <View style={styles.card}>
          <View style={styles.headerRow}>
            <Text style={styles.ticketId}>Ticket Details</Text>
            <View
              style={[
                styles.statusBadge,
                { backgroundColor: statusStyle.bg, borderColor: statusStyle.border },
              ]}
            >
              <Text style={[styles.statusBadgeText, { color: statusStyle.text }]}>
                {statusStyle.icon} {complaint.status}
              </Text>
            </View>
          </View>

          <Text style={styles.complaintType}>{complaint.complaintType}</Text>
        </View>

        {/* Visual Process Stepper */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Process Timeline</Text>
          <View style={styles.stepperContainer}>
            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, getStepActive(1) && styles.stepCircleActive]}>
                <Text style={styles.stepCircleText}>1</Text>
              </View>
              <Text style={[styles.stepLabel, getStepActive(1) && styles.stepLabelActive]}>Submitted</Text>
            </View>

            <View style={[styles.stepLine, getStepActive(2) && styles.stepLineActive]} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, getStepActive(2) && styles.stepCircleActive]}>
                <Text style={styles.stepCircleText}>2</Text>
              </View>
              <Text style={[styles.stepLabel, getStepActive(2) && styles.stepLabelActive]}>Assigned</Text>
            </View>

            <View style={[styles.stepLine, getStepActive(3) && styles.stepLineActive]} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, getStepActive(3) && (complaint.status === 'Onhold' ? styles.stepCircleOnhold : styles.stepCircleActive)]}>
                <Text style={styles.stepCircleText}>{complaint.status === 'Onhold' ? '⏸' : '3'}</Text>
              </View>
              <Text style={[styles.stepLabel, getStepActive(3) && styles.stepLabelActive]}>
                {complaint.status === 'Onhold' ? 'On Hold' : 'In Progress'}
              </Text>
            </View>

            <View style={[styles.stepLine, getStepActive(4) && styles.stepLineActive]} />

            <View style={styles.stepItem}>
              <View style={[styles.stepCircle, getStepActive(4) && styles.stepCircleActive]}>
                <Text style={styles.stepCircleText}>✓</Text>
              </View>
              <Text style={[styles.stepLabel, getStepActive(4) && styles.stepLabelActive]}>Resolved</Text>
            </View>
          </View>

          <View style={styles.processDescriptionBox}>
            <Text style={styles.processDescriptionTitle}>Current Stage Status:</Text>
            <Text style={styles.processDescriptionText}>
              {complaint.status === 'Pending' && '⏳ Ticket received. Awaiting admin assignment to appropriate technician.'}
              {complaint.status === 'Assigned' && `👤 Ticket assigned to ${complaint.assignedTo?.username || 'Technician'}. Work will commence shortly.`}
              {complaint.status === 'In-Progress' && `⚙️ Active work in progress by ${complaint.assignedTo?.username || 'Technician'}.`}
              {complaint.status === 'Onhold' && '⏸️ Ticket is temporarily on hold (awaiting replacement parts or inspection).'}
              {complaint.status === 'Closed' && '✅ Issue has been successfully resolved and marked closed.'}
            </Text>
          </View>
        </View>

        {/* Quick Action Buttons for SuperAdmin & Assignee */}
        {canUpdateStatus && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Quick Process Actions</Text>
            <View style={styles.quickButtonsGrid}>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
                onPress={() => handleStatusUpdate('In-Progress')}
                disabled={updating}
              >
                <Text style={[styles.actionBtnText, { color: '#4338CA' }]}>⚙️ In-Progress</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}
                onPress={() => handleStatusUpdate('Onhold')}
                disabled={updating}
              >
                <Text style={[styles.actionBtnText, { color: '#7E22CE' }]}>⏸️ Put On Hold</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
                onPress={() => handleStatusUpdate('Closed')}
                disabled={updating}
              >
                <Text style={[styles.actionBtnText, { color: '#047857' }]}>✅ Mark Closed</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: '#FEF3C7', borderColor: '#FDE68A' }]}
                onPress={() => handleStatusUpdate('Pending')}
                disabled={updating}
              >
                <Text style={[styles.actionBtnText, { color: '#B45309' }]}>↺ Reopen / Pending</Text>
              </TouchableOpacity>

              {isSuperAdmin && (
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#EFF6FF', borderColor: '#BFDBFE', width: '100%' }]}
                  onPress={() => {
                    setSelectedAssignee(complaint.assignedTo?._id || '');
                    setAssignModalVisible(true);
                  }}
                  disabled={updating}
                >
                  <Text style={[styles.actionBtnText, { color: '#2563EB' }]}>👤 Assign / Reassign Staff</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* Location & Timing */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Location & Timing</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Department:</Text>
            <Text style={styles.infoValue}>{complaint.departmentName || 'General'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Block / Building:</Text>
            <Text style={styles.infoValue}>{complaint.blockName || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Room Number:</Text>
            <Text style={styles.infoValue}>{complaint.roomNumber || '-'}</Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Date Submitted:</Text>
            <Text style={styles.infoValue}>
              {new Date(complaint.createdAt).toLocaleString()}
            </Text>
          </View>
        </View>

        {/* Stakeholder Details */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Personnel</Text>
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Reported By:</Text>
            <Text style={styles.infoValue}>
              {complaint.createdBy?.username || complaint.createdBy?.email || 'User'}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Assigned Technician:</Text>
            <Text style={[styles.infoValue, !complaint.assignedTo && styles.unassignedText]}>
              {complaint.assignedTo?.username
                ? `${complaint.assignedTo.username} (${complaint.assignedTo.role || 'Staff'})`
                : 'Not assigned yet'}
            </Text>
          </View>
        </View>

        {/* Remarks */}
        <View style={styles.card}>
          <Text style={styles.cardSectionTitle}>Description / Remarks</Text>
          <Text style={styles.remarksContent}>{complaint.remarks || 'No remarks provided.'}</Text>
        </View>

        {/* Attachment Photo */}
        {attachmentUrl && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>Attached Proof / Photo</Text>
            <Image
              source={{ uri: attachmentUrl }}
              style={styles.attachmentImage}
              resizeMode="cover"
            />
          </View>
        )}

        {/* Status Dropdown Picker for detailed changes */}
        {canUpdateStatus && (
          <View style={styles.card}>
            <Text style={styles.cardSectionTitle}>All Status Options</Text>
            <CustomPicker
              selectedValue={newStatus}
              onValueChange={setNewStatus}
              items={statusOptions}
            />

            <TouchableOpacity
              style={[
                styles.saveStatusBtn,
                (updating || newStatus === complaint.status) && styles.btnDisabled,
              ]}
              onPress={() => handleStatusUpdate(newStatus)}
              disabled={updating || newStatus === complaint.status}
            >
              {updating ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.saveStatusBtnText}>SAVE STATUS UPDATE</Text>
              )}
            </TouchableOpacity>
          </View>
        )}

        {/* Assign Modal for SuperAdmin */}
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
                items={staffUsers.map((u) => ({
                  label: `${u.username} (${u.role})`,
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
                    <Text style={styles.confirmBtnText}>Assign</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notFoundText: {
    color: '#64748B',
    fontSize: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  ticketId: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
  },
  complaintType: {
    fontSize: 15,
    fontWeight: '700',
    color: '#2563EB',
  },
  cardSectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1E293B',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 6,
  },
  stepItem: {
    alignItems: 'center',
    width: 65,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E2E8F0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  stepCircleActive: {
    backgroundColor: '#2563EB',
  },
  stepCircleOnhold: {
    backgroundColor: '#7E22CE',
  },
  stepCircleText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#94A3B8',
    textAlign: 'center',
  },
  stepLabelActive: {
    color: '#0F172A',
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 3,
    backgroundColor: '#E2E8F0',
    marginHorizontal: 2,
    marginBottom: 16,
  },
  stepLineActive: {
    backgroundColor: '#2563EB',
  },
  processDescriptionBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 8,
    padding: 10,
    marginTop: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#2563EB',
  },
  processDescriptionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
    marginBottom: 2,
  },
  processDescriptionText: {
    fontSize: 13,
    color: '#475569',
    lineHeight: 18,
  },
  quickButtonsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  actionBtn: {
    flexGrow: 1,
    minWidth: '45%',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 13,
    fontWeight: '700',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  infoLabel: {
    fontSize: 13,
    color: '#64748B',
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1E293B',
  },
  unassignedText: {
    color: '#DC2626',
    fontStyle: 'italic',
  },
  remarksContent: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 20,
    backgroundColor: '#F8FAFC',
    padding: 10,
    borderRadius: 8,
  },
  attachmentImage: {
    width: '100%',
    height: 220,
    borderRadius: 8,
    backgroundColor: '#E2E8F0',
  },
  saveStatusBtn: {
    backgroundColor: '#2563EB',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  saveStatusBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 14,
  },
  btnDisabled: {
    opacity: 0.5,
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
});

export default ComplaintDetailScreen;
