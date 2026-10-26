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
import { departmentService } from '../services/api';

const DepartmentManagementScreen = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({ name: '', shortName: '', description: '' });
  const [saving, setSaving] = useState(false);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await departmentService.getAll();
      setDepartments(res.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch departments.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({ name: '', shortName: '', description: '' });
    setModalVisible(true);
  };

  const openEditModal = (dept) => {
    setEditingId(dept._id);
    setFormData({
      name: dept.name || '',
      shortName: dept.shortName || '',
      description: dept.description || '',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.name.trim() || !formData.shortName.trim()) {
      Alert.alert('Validation Error', 'Department Name and Short Name are required.');
      return;
    }
    const shortLen = formData.shortName.trim().length;
    if (shortLen < 2 || shortLen > 8) {
      Alert.alert('Validation Error', 'Short Name must be between 2 and 8 characters.');
      return;
    }

    setSaving(true);
    try {
      if (editingId) {
        await departmentService.update(editingId, formData);
      } else {
        await departmentService.create(formData);
      }
      setModalVisible(false);
      await fetchDepartments();
      Alert.alert('Success', `Department ${editingId ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Failed to save department.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, name) => {
    const performDelete = async () => {
      try {
        await departmentService.delete(id);
        await fetchDepartments();
      } catch (err) {
        if (Platform.OS === 'web') {
          alert(err.response?.data?.message || 'Failed to delete department.');
        } else {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete department.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete department "${name}"?`);
      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert(
      'Confirm Deletion',
      `Are you sure you want to delete department "${name}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: performDelete,
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <View style={styles.topBar}>
          <Text style={styles.heading}>Departments ({departments.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Add Dept</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={departments}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.deptName}>{item.name}</Text>
                  <View style={styles.codeBadge}>
                    <Text style={styles.codeBadgeText}>{item.shortName}</Text>
                  </View>
                </View>

                <Text style={styles.descText}>{item.description || 'No description provided.'}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item._id, item.name)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No departments registered.</Text>
              </View>
            }
          />
        )}

        {/* Modal for Add / Edit */}
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
                  {editingId ? 'Edit Department' : 'Add New Department'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Department Name *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.name}
                    onChangeText={(t) => setFormData({ ...formData, name: t })}
                    placeholder="e.g. Computer Science"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Short Code (2-8 chars) *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.shortName}
                    onChangeText={(t) => setFormData({ ...formData, shortName: t })}
                    placeholder="e.g. CSE"
                    autoCapitalize="characters"
                    maxLength={8}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Description</Text>
                  <TextInput
                    style={[styles.input, styles.textArea]}
                    value={formData.description}
                    onChangeText={(t) => setFormData({ ...formData, description: t })}
                    placeholder="Brief description..."
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
  deptName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E293B',
    flex: 1,
  },
  codeBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  codeBadgeText: {
    color: '#2563EB',
    fontSize: 12,
    fontWeight: '700',
  },
  descText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 12,
  },
  cardActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
    paddingTop: 10,
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

export default DepartmentManagementScreen;
