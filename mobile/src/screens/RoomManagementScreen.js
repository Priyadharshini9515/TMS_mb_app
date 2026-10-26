import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
  Platform,
} from 'react-native';
import { roomService, departmentService, programmeService, blockService } from '../services/api';
import CustomPicker from '../components/CustomPicker';

const RoomManagementScreen = () => {
  const [rooms, setRooms] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [programmes, setProgrammes] = useState([]);
  const [blocks, setBlocks] = useState([]);

  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    roomNumber: '',
    department: '',
    programme: '',
    block: '',
    floor: '',
    capacity: '',
    description: '',
  });
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      const [roomRes, deptRes, progRes, blockRes] = await Promise.all([
        roomService.getAll(),
        departmentService.getAll(),
        programmeService.getAll(),
        blockService.getAll(),
      ]);
      setRooms(roomRes.data || []);
      setDepartments((deptRes.data || []).map((d) => ({ label: d.name, value: d._id })));
      setProgrammes((progRes.data || []).map((p) => ({ label: p.name, value: p._id })));
      setBlocks((blockRes.data || []).map((b) => ({ label: b.name, value: b._id })));
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch rooms or dependencies.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      roomNumber: '',
      department: departments[0]?.value || '',
      programme: programmes[0]?.value || '',
      block: blocks[0]?.value || '',
      floor: '',
      capacity: '',
      description: '',
    });
    setModalVisible(true);
  };

  const openEditModal = (room) => {
    setEditingId(room._id);
    setFormData({
      roomNumber: room.roomNumber || '',
      department: room.department?._id || room.department || '',
      programme: room.programme?._id || room.programme || '',
      block: room.block?._id || room.block || '',
      floor: room.floor ? String(room.floor) : '',
      capacity: room.capacity ? String(room.capacity) : '',
      description: room.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.roomNumber.trim() || !formData.department || !formData.programme || !formData.block) {
      Alert.alert('Validation Error', 'Room Number, Department, Programme, and Block are required.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await roomService.update(editingId, formData);
      } else {
        await roomService.create(formData);
      }
      setModalVisible(false);
      await fetchData();
      Alert.alert('Success', `Room ${editingId ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save room.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, num) => {
    const performDelete = async () => {
      try {
        await roomService.delete(id);
        await fetchData();
      } catch (err) {
        if (Platform.OS === 'web') {
          alert(err.response?.data?.message || 'Failed to delete room.');
        } else {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete room.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete Room "${num}"?`);
      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert('Confirm Deletion', `Are you sure you want to delete Room "${num}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: performDelete,
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Rooms ({rooms.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Add Room</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={rooms}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.roomNumberText}>Room {item.roomNumber}</Text>
                  {item.floor ? (
                    <View style={styles.floorBadge}>
                      <Text style={styles.floorBadgeText}>Floor {item.floor}</Text>
                    </View>
                  ) : null}
                </View>

                <Text style={styles.metaText}>
                  🏛️ Block: <Text style={styles.boldText}>{item.block?.name || '-'}</Text>
                </Text>
                <Text style={styles.metaText}>
                  🏢 Dept: <Text style={styles.boldText}>{item.department?.name || '-'}</Text>
                </Text>
                {item.capacity ? (
                  <Text style={styles.metaText}>
                    👥 Capacity: <Text style={styles.boldText}>{item.capacity} seats</Text>
                  </Text>
                ) : null}

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item._id, item.roomNumber)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No rooms configured.</Text>
              </View>
            }
          />
        )}

        {/* Modal */}
        <Modal
          visible={modalVisible}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalBackdrop}>
            <View style={styles.modalCard}>
              <ScrollView>
                <Text style={styles.modalTitle}>
                  {editingId ? 'Edit Room' : 'Add New Room'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Room Number / Code *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.roomNumber}
                    onChangeText={(t) => setFormData({ ...formData, roomNumber: t })}
                    placeholder="e.g. R-101 or Lab-2"
                  />
                </View>

                <CustomPicker
                  label="Department *"
                  selectedValue={formData.department}
                  onValueChange={(val) => setFormData({ ...formData, department: val })}
                  items={departments}
                  placeholder="Select Department"
                />

                <CustomPicker
                  label="Programme *"
                  selectedValue={formData.programme}
                  onValueChange={(val) => setFormData({ ...formData, programme: val })}
                  items={programmes}
                  placeholder="Select Programme"
                />

                <CustomPicker
                  label="Block *"
                  selectedValue={formData.block}
                  onValueChange={(val) => setFormData({ ...formData, block: val })}
                  items={blocks}
                  placeholder="Select Block"
                />

                <View style={styles.rowInputs}>
                  <View style={[styles.inputGroup, { flex: 1, marginRight: 8 }]}>
                    <Text style={styles.label}>Floor</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.floor}
                      onChangeText={(t) => setFormData({ ...formData, floor: t })}
                      placeholder="e.g. 1"
                      keyboardType="numeric"
                    />
                  </View>

                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.label}>Capacity</Text>
                    <TextInput
                      style={styles.input}
                      value={formData.capacity}
                      onChangeText={(t) => setFormData({ ...formData, capacity: t })}
                      placeholder="e.g. 60"
                      keyboardType="numeric"
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(t) => setFormData({ ...formData, description: t })}
                    placeholder="Equipment / room notes..."
                    multiline
                    numberOfLines={3}
                  />
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.cancelBtn}
                    onPress={() => setModalVisible(false)}
                  >
                    <Text style={styles.cancelBtnText}>Cancel</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.saveBtn, saving && styles.btnDisabled]}
                    onPress={handleSave}
                    disabled={saving}
                  >
                    {saving ? (
                      <ActivityIndicator color="#FFFFFF" size="small" />
                    ) : (
                      <Text style={styles.saveBtnText}>{editingId ? 'Update' : 'Create'}</Text>
                    )}
                  </TouchableOpacity>
                </View>
              </ScrollView>
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
  topBar: {
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
  addBtn: {
    backgroundColor: '#2563EB',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 13,
  },
  listContent: {
    padding: 16,
    paddingBottom: 30,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  roomNumberText: {
    fontSize: 17,
    fontWeight: '800',
    color: '#1E293B',
  },
  floorBadge: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#BFDBFE',
  },
  floorBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  metaText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
  },
  boldText: {
    fontWeight: '700',
    color: '#334155',
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
    marginTop: 6,
  },
  editBtn: {
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  editBtnText: {
    color: '#334155',
    fontWeight: '600',
    fontSize: 12,
  },
  deleteBtn: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  deleteBtnText: {
    color: '#DC2626',
    fontWeight: '600',
    fontSize: 12,
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
  emptyText: {
    color: '#94A3B8',
    fontSize: 14,
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
    maxHeight: '85%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 16,
  },
  rowInputs: {
    flexDirection: 'row',
  },
  inputGroup: {
    marginBottom: 14,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 70,
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
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: '#2563EB',
  },
  saveBtnText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  btnDisabled: {
    opacity: 0.6,
  },
});

export default RoomManagementScreen;
