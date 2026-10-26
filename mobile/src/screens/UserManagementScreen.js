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
import { userService } from '../services/api';
import CustomPicker from '../components/CustomPicker';

const userRoles = [
  { label: 'SuperAdmin', value: 'SuperAdmin' },
  { label: 'User / Student', value: 'User' },
  { label: 'Coordinator / Faculty', value: 'Coordinator' },
  { label: 'Networking Staff', value: 'Networking Staff' },
  { label: 'Plumber', value: 'Plumber' },
  { label: 'Electrician', value: 'Electrician' },
  { label: 'Software Developer', value: 'Software Developer' },
  { label: 'Application Staff', value: 'Application' },
  { label: 'PC Hardware', value: 'PC Hardware' },
];

const UserManagementScreen = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    phone: '',
    password: '',
    role: 'User',
  });
  const [saving, setSaving] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await userService.getAll();
      setUsers(res.data || []);
    } catch (err) {
      Alert.alert('Error', 'Failed to fetch users.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const openAddModal = () => {
    setEditingId(null);
    setFormData({
      username: '',
      email: '',
      phone: '',
      password: '',
      role: 'User',
    });
    setModalVisible(true);
  };

  const openEditModal = (u) => {
    setEditingId(u._id);
    setFormData({
      username: u.username || '',
      email: u.email || '',
      phone: u.phone || '',
      password: '',
      role: u.role || 'User',
    });
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formData.username.trim() || !formData.email.trim() || !formData.phone.trim()) {
      Alert.alert('Validation Error', 'Username, Email, and Phone are required.');
      return;
    }
    if (!editingId && !formData.password.trim()) {
      Alert.alert('Validation Error', 'Password is required for new users.');
      return;
    }

    const payload = { ...formData };
    if (editingId && !payload.password.trim()) {
      delete payload.password;
    }

    setSaving(true);
    try {
      if (editingId) {
        await userService.update(editingId, payload);
      } else {
        await userService.create(payload);
      }
      setModalVisible(false);
      await fetchUsers();
      Alert.alert('Success', `User ${editingId ? 'updated' : 'created'} successfully.`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || err.response?.data?.error || 'Failed to save user.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = (id, username) => {
    const performDelete = async () => {
      try {
        await userService.delete(id);
        await fetchUsers();
      } catch (err) {
        if (Platform.OS === 'web') {
          alert(err.response?.data?.message || 'Failed to delete user.');
        } else {
          Alert.alert('Error', err.response?.data?.message || 'Failed to delete user.');
        }
      }
    };

    if (Platform.OS === 'web') {
      const confirmed = window.confirm(`Are you sure you want to delete user "${username}"?`);
      if (confirmed) {
        performDelete();
      }
      return;
    }

    Alert.alert('Confirm Deletion', `Are you sure you want to delete user "${username}"?`, [
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
          <Text style={styles.heading}>User Directory ({users.length})</Text>
          <TouchableOpacity style={styles.addBtn} onPress={openAddModal}>
            <Text style={styles.addBtnText}>+ Add User</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#2563EB" />
          </View>
        ) : (
          <FlatList
            data={users}
            keyExtractor={(item) => item._id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.userName}>{item.username}</Text>
                  <View style={styles.roleBadge}>
                    <Text style={styles.roleBadgeText}>{item.role}</Text>
                  </View>
                </View>

                <Text style={styles.contactText}>📧 {item.email}</Text>
                <Text style={styles.contactText}>📞 {item.phone || 'No phone'}</Text>

                <View style={styles.cardActions}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(item)}>
                    <Text style={styles.editBtnText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => handleDelete(item._id, item.username)}
                  >
                    <Text style={styles.deleteBtnText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No users found.</Text>
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
                  {editingId ? 'Edit User Account' : 'Create New User'}
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Username *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.username}
                    onChangeText={(t) => setFormData({ ...formData, username: t })}
                    placeholder="e.g. AlexMorgan"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Email Address *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.email}
                    onChangeText={(t) => setFormData({ ...formData, email: t })}
                    placeholder="name@company.com"
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>Phone Number *</Text>
                  <TextInput
                    style={styles.input}
                    value={formData.phone}
                    onChangeText={(t) => setFormData({ ...formData, phone: t })}
                    placeholder="+91 9876543210"
                    keyboardType="phone-pad"
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.label}>
                    Password {editingId ? '(leave blank to keep current)' : '*'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={formData.password}
                    onChangeText={(t) => setFormData({ ...formData, password: t })}
                    placeholder="••••••••"
                    secureTextEntry
                  />
                </View>

                <CustomPicker
                  label="Assigned Role *"
                  selectedValue={formData.role}
                  onValueChange={(val) => setFormData({ ...formData, role: val })}
                  items={userRoles}
                />

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
    marginBottom: 8,
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1E293B',
  },
  roleBadge: {
    backgroundColor: '#EFF6FF',
    borderWidth: 1,
    borderColor: '#BFDBFE',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  roleBadgeText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '700',
  },
  contactText: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 4,
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

export default UserManagementScreen;
