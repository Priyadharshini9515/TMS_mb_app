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
  Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../context/AuthContext';
import { complaintService, SERVER_ROOT_URL } from '../services/api';

const statusColors = {
  Pending: { bg: '#FEF3C7', text: '#B45309', border: '#FDE68A', icon: '⏳' },
  Assigned: { bg: '#FEE2E2', text: '#B91C1C', border: '#FECACA', icon: '👤' },
  'In-Progress': { bg: '#E0E7FF', text: '#4338CA', border: '#C7D2FE', icon: '⚙️' },
  Onhold: { bg: '#F3E8FF', text: '#6B21A8', border: '#E9D5FF', icon: '⏸️' },
  Closed: { bg: '#D1FAE5', text: '#047857', border: '#A7F3D0', icon: '✅' },
};

const MyComplaintsScreen = ({ route }) => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [filteredComplaints, setFilteredComplaints] = useState([]);
  const [filterStatus, setFilterStatus] = useState(route?.params?.initialFilter || 'All');
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (route?.params?.initialFilter) {
      setFilterStatus(route.params.initialFilter);
    }
  }, [route?.params?.initialFilter]);

  const fetchComplaints = useCallback(async () => {
    try {
      setLoading(true);
      const res = await complaintService.getAll();
      const all = res.data || [];
      setComplaints(all);
    } catch (err) {
      console.log('Error fetching user complaints:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      fetchComplaints();
    }, [fetchComplaints])
  );

  useEffect(() => {
    if (filterStatus === 'All') {
      setFilteredComplaints(complaints);
    } else {
      setFilteredComplaints(complaints.filter((c) => {
        const cStatus = (c.status || '').toLowerCase().trim();
        const fStatus = filterStatus.toLowerCase().trim();
        if (fStatus === 'closed') {
          return cStatus === 'closed' || cStatus === 'completed';
        }
        if (fStatus === 'in-progress') {
          return cStatus === 'in-progress' || cStatus === 'inprogress' || cStatus === 'in progress';
        }
        if (fStatus === 'onhold') {
          return cStatus === 'onhold' || cStatus === 'on hold';
        }
        if (fStatus === 'assigned') {
          return cStatus === 'assigned';
        }
        if (fStatus === 'pending') {
          return cStatus === 'pending';
        }
        return cStatus === fStatus;
      }));
    }
  }, [filterStatus, complaints]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchComplaints();
    setRefreshing(false);
  };

  const handleQuickStatus = async (complaintId, status) => {
    try {
      await complaintService.updateStatus(complaintId, status);
      await fetchComplaints();
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to update status');
    }
  };

  const renderFilterButton = (label) => {
    const isSelected = filterStatus === label;
    return (
      <TouchableOpacity
        key={label}
        style={[styles.filterChip, isSelected && styles.filterChipActive]}
        onPress={() => setFilterStatus(label)}
      >
        <Text style={[styles.filterChipText, isSelected && styles.filterChipTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderComplaintItem = ({ item }) => {
    const statusStyle = statusColors[item.status] || {
      bg: '#F1F5F9',
      text: '#475569',
      border: '#E2E8F0',
      icon: '📌',
    };

    const isAssignee = item.assignedTo && String(item.assignedTo._id || item.assignedTo) === String(user?.id || user?._id);

    const attachmentUrl = item.attachment
      ? (item.attachment.startsWith('http')
          ? item.attachment
          : `${SERVER_ROOT_URL}/${item.attachment.replace(/^\//, '')}`)
      : null;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.locationContainer}>
            <Text style={styles.blockText}>{item.blockName || 'Main Block'}</Text>
            <Text style={styles.roomText}>• Room: {item.roomNumber || 'N/A'}</Text>
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

        {/* Live Process Tracker Box */}
        <View style={styles.processBox}>
          <View style={styles.processRow}>
            <Text style={styles.processLabel}>🛠️ Assigned Technician:</Text>
            <Text style={[styles.processVal, !item.assignedTo && styles.unassignedVal]}>
              {item.assignedTo?.username
                ? `${item.assignedTo.username} (${item.assignedTo.role || 'Staff'})`
                : 'Awaiting technician assignment'}
            </Text>
          </View>

          <View style={styles.processRow}>
            <Text style={styles.processLabel}>⚙️ Current Process Stage:</Text>
            <Text style={[styles.processVal, { color: statusStyle.text }]}>
              {item.status === 'Pending' && '⏳ Received - Awaiting admin dispatch'}
              {item.status === 'Assigned' && '👤 Assigned - Technician will start work'}
              {item.status === 'In-Progress' && '⚙️ Active repair / investigation ongoing'}
              {item.status === 'Onhold' && '⏸️ On Hold (Waiting for spare parts/inspection)'}
              {item.status === 'Closed' && '✅ Resolved & Ticket closed'}
            </Text>
          </View>
        </View>

        {/* Quick Actions if user is the assigned staff member */}
        {isAssignee && item.status !== 'Closed' && (
          <View style={styles.quickActionRow}>
            <Text style={styles.quickLabel}>Actions:</Text>
            {item.status !== 'In-Progress' && (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: '#EEF2FF', borderColor: '#C7D2FE' }]}
                onPress={() => handleQuickStatus(item._id, 'In-Progress')}
              >
                <Text style={[styles.actionChipText, { color: '#4338CA' }]}>⚙️ In-Progress</Text>
              </TouchableOpacity>
            )}
            {item.status !== 'Onhold' && (
              <TouchableOpacity
                style={[styles.actionChip, { backgroundColor: '#FAF5FF', borderColor: '#E9D5FF' }]}
                onPress={() => handleQuickStatus(item._id, 'Onhold')}
              >
                <Text style={[styles.actionChipText, { color: '#7E22CE' }]}>⏸️ On Hold</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[styles.actionChip, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
              onPress={() => handleQuickStatus(item._id, 'Closed')}
            >
              <Text style={[styles.actionChipText, { color: '#047857' }]}>✅ Mark Closed</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.cardFooter}>
          <Text style={styles.dateText}>
            📅 Submitted on: {new Date(item.createdAt).toLocaleString()}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Filter chips bar */}
        <View style={styles.filtersBar}>
          {['All', 'Pending', 'Assigned', 'In-Progress', 'Onhold', 'Closed'].map(renderFilterButton)}
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
                <Text style={styles.emptyTitle}>No Complaints Found</Text>
                <Text style={styles.emptySubtitle}>
                  {filterStatus === 'All'
                    ? "You haven't raised or been assigned any complaints."
                    : `No ${filterStatus.toLowerCase()} complaints found.`}
                </Text>
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
    alignItems: 'center',
    marginBottom: 6,
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  blockText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  roomText: {
    fontSize: 14,
    color: '#64748B',
    marginLeft: 6,
    fontWeight: '500',
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
  processBox: {
    backgroundColor: '#F8FAFC',
    borderRadius: 10,
    padding: 10,
    marginBottom: 10,
    gap: 4,
    borderLeftWidth: 3,
    borderLeftColor: '#2563EB',
  },
  processRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
  },
  processLabel: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  processVal: {
    fontSize: 12,
    fontWeight: '700',
    color: '#334155',
  },
  unassignedVal: {
    color: '#DC2626',
    fontStyle: 'italic',
  },
  quickActionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
    paddingTop: 4,
  },
  quickLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#64748B',
    textTransform: 'uppercase',
  },
  actionChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
  },
  actionChipText: {
    fontSize: 11,
    fontWeight: '700',
  },
  cardFooter: {
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 8,
  },
  dateText: {
    fontSize: 12,
    color: '#94A3B8',
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
    textAlign: 'center',
  },
});

export default MyComplaintsScreen;
