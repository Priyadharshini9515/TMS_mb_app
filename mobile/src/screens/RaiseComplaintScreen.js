import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  SafeAreaView,
  Image,
  Platform,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { AuthContext } from '../context/AuthContext';
import {
  complaintService,
  departmentService,
  blockService,
  roomService,
} from '../services/api';
import CustomPicker from '../components/CustomPicker';

const complaintTypes = [
  { label: 'PC Hardware', value: 'PC Hardware' },
  { label: 'PC Software', value: 'PC Software' },
  { label: 'Application Issues', value: 'Application Issues' },
  { label: 'Network', value: 'Network' },
  { label: 'Electronics', value: 'Electronics' },
  { label: 'Plumbing', value: 'Plumbing' },
  { label: 'Other', value: 'Other' },
];

const RaiseComplaintScreen = ({ navigation }) => {
  const { user } = useContext(AuthContext);

  const [departments, setDepartments] = useState([]);
  const [blocks, setBlocks] = useState([]);
  const [allBlocksCache, setAllBlocksCache] = useState([]);
  const [rooms, setRooms] = useState([]);

  const [departmentId, setDepartmentId] = useState('');
  const [blockId, setBlockId] = useState('');
  const [customBlockName, setCustomBlockName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [customRoomNumber, setCustomRoomNumber] = useState('');
  const [complaintType, setComplaintType] = useState(complaintTypes[0].value);
  const [remarks, setRemarks] = useState('');
  const [selectedImage, setSelectedImage] = useState(null);

  const [loadingData, setLoadingData] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // 1. Fetch departments and all blocks on mount
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoadingData(true);
        const [deptRes, blockRes] = await Promise.all([
          departmentService.getAll(),
          blockService.getAll(),
        ]);
        
        const deptList = Array.isArray(deptRes.data) ? deptRes.data : deptRes.data?.data || [];
        setDepartments(deptList.map((d) => ({ label: d.name, value: d._id })));

        const rawBlocks = Array.isArray(blockRes.data) ? blockRes.data : blockRes.data?.data || [];
        const formattedBlocks = rawBlocks.map((b) => ({ label: b.name, value: b._id, department: b.department?._id || b.department }));
        setAllBlocksCache(formattedBlocks);
        setBlocks([...formattedBlocks, { label: 'Other (Enter Manually)', value: '__manual__' }]);
      } catch (err) {
        console.log('Failed to fetch initial data:', err);
      } finally {
        setLoadingData(false);
      }
    };
    fetchInitialData();
  }, []);

  // 2. Filter or fetch blocks when department changes
  useEffect(() => {
    const updateBlocksForDept = async () => {
      if (!departmentId) {
        setBlocks([...allBlocksCache, { label: 'Other (Enter Manually)', value: '__manual__' }]);
        return;
      }
      try {
        setLoadingData(true);
        const res = await blockService.getAll({ departmentId });
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        if (list.length > 0) {
          const deptBlocks = list.map((b) => ({ label: b.name, value: b._id }));
          setBlocks([...deptBlocks, { label: 'Other (Enter Manually)', value: '__manual__' }]);
        } else {
          // Fallback to all blocks cached if this department has no specific blocks assigned
          setBlocks([...allBlocksCache, { label: 'Other (Enter Manually)', value: '__manual__' }]);
        }
      } catch (err) {
        console.log('Failed to fetch blocks for dept:', err);
        setBlocks([...allBlocksCache, { label: 'Other (Enter Manually)', value: '__manual__' }]);
      } finally {
        setLoadingData(false);
      }
    };
    updateBlocksForDept();
    setBlockId('');
    setCustomBlockName('');
    setRoomId('');
    setRooms([]);
  }, [departmentId, allBlocksCache]);

  // 3. Fetch rooms when block changes
  useEffect(() => {
    const fetchRooms = async () => {
      if (!blockId || blockId === '__manual__') {
        setRooms([{ label: 'Other (Enter Manually)', value: '__manual__' }]);
        setRoomId('__manual__');
        return;
      }
      try {
        setLoadingData(true);
        const res = await roomService.getAll({ blockId });
        const list = Array.isArray(res.data) ? res.data : res.data?.data || [];
        const roomOpts = list.map((r) => ({
          label: `Room ${r.roomNumber}`,
          value: r._id,
          roomNumber: r.roomNumber,
        }));
        setRooms([...roomOpts, { label: 'Other (Enter Manually)', value: '__manual__' }]);
      } catch (err) {
        console.log('Failed to fetch rooms:', err);
        setRooms([{ label: 'Other (Enter Manually)', value: '__manual__' }]);
      } finally {
        setLoadingData(false);
      }
    };
    fetchRooms();
    setRoomId('');
  }, [blockId]);

  // Pick Image from phone gallery
  const pickImage = async () => {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('Permission Denied', 'Camera roll permissions are required to select photos.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        quality: 0.7,
      });


      if (!result.canceled && result.assets && result.assets.length > 0) {
        setSelectedImage(result.assets[0]);
      }
    } catch (e) {
      console.log('Image picker error:', e);
    }
  };

  const handleSubmit = async () => {
    if (!departmentId) {
      setError('Please select a department.');
      return;
    }

    let finalBlockName = '';
    if (blockId === '__manual__') {
      if (!customBlockName.trim()) {
        setError('Please enter a block name.');
        return;
      }
      finalBlockName = customBlockName.trim();
    } else {
      const selectedBlk = blocks.find((b) => b.value === blockId);
      if (!selectedBlk) {
        setError('Please select a block.');
        return;
      }
      finalBlockName = selectedBlk.label;
    }

    let finalRoomNumber = '';
    if (roomId === '__manual__') {
      if (!customRoomNumber.trim()) {
        setError('Please enter a room number.');
        return;
      }
      finalRoomNumber = customRoomNumber.trim();
    } else {
      const foundRoom = rooms.find((r) => r.value === roomId);
      if (!foundRoom) {
        setError('Please select a room.');
        return;
      }
      finalRoomNumber = foundRoom.roomNumber;
    }

    setError('');
    setSubmitting(true);

    try {
      const selectedDept = departments.find((d) => d.value === departmentId);

      const formData = new FormData();
      formData.append('departmentName', selectedDept?.label || '');
      formData.append('blockName', finalBlockName);
      formData.append('roomNumber', finalRoomNumber);
      formData.append('complaintType', complaintType);
      formData.append('remarks', remarks || '');

      if (user?.id || user?._id) {
        formData.append('userId', user.id || user._id);
      }

      if (selectedImage) {
        if (Platform.OS === 'web') {
          if (selectedImage.file) {
            formData.append('attachment', selectedImage.file);
          } else if (selectedImage.uri) {
            try {
              const res = await fetch(selectedImage.uri);
              const blob = await res.blob();
              formData.append('attachment', blob, `photo_${Date.now()}.jpg`);
            } catch (imgErr) {
              console.log('Error preparing web image:', imgErr);
            }
          }
        } else {
          const uri = selectedImage.uri;
          const uriParts = uri.split('.');
          const fileType = uriParts[uriParts.length - 1] || 'jpeg';

          formData.append('attachment', {
            uri,
            name: `photo_${Date.now()}.${fileType}`,
            type: `image/${fileType === 'jpg' ? 'jpeg' : fileType}`,
          });
        }
      }

      await complaintService.create(formData);

      if (Platform.OS === 'web') {
        alert('Complaint submitted successfully!');
        navigation.navigate('MyComplaints');
      } else {
        Alert.alert('Ticket Submitted', 'Your complaint has been successfully registered.', [
          { text: 'View My Complaints', onPress: () => navigation.navigate('MyComplaints') },
          { text: 'OK', onPress: () => navigation.navigate('Home') },
        ]);
      }
    } catch (err) {
      console.error('Complaint submission error:', err);
      setError(err.response?.data?.message || err.message || 'Failed to submit complaint. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <View style={styles.header}>
          <Text style={styles.title}>Raise a Complaint</Text>
          <Text style={styles.subtitle}>Report campus infrastructure or technical issues</Text>
        </View>

        {error ? (
          <View style={styles.errorBox}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        <View style={styles.card}>
          <CustomPicker
            label="1. Department *"
            selectedValue={departmentId}
            onValueChange={setDepartmentId}
            items={departments}
            placeholder="-- Choose Department --"
            disabled={loadingData}
          />

          <CustomPicker
            label="2. Block Name *"
            selectedValue={blockId}
            onValueChange={setBlockId}
            items={blocks}
            placeholder="-- Choose Block --"
            disabled={loadingData}
          />

          {blockId === '__manual__' && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter Specific Block Name *</Text>
              <TextInput
                style={styles.input}
                value={customBlockName}
                onChangeText={setCustomBlockName}
                placeholder="e.g. Science Block, Mech Block, Library"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          <CustomPicker
            label="3. Room Number *"
            selectedValue={roomId}
            onValueChange={setRoomId}
            items={rooms}
            placeholder="-- Choose Room --"
            disabled={!blockId || loadingData}
          />

          {(roomId === '__manual__' || (blockId && rooms.length === 1)) && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Enter Specific Room Number *</Text>
              <TextInput
                style={styles.input}
                value={customRoomNumber}
                onChangeText={setCustomRoomNumber}
                placeholder="e.g. Lab-301 or R-105"
                placeholderTextColor="#94A3B8"
              />
            </View>
          )}

          <CustomPicker
            label="4. Issue / Complaint Category *"
            selectedValue={complaintType}
            onValueChange={setComplaintType}
            items={complaintTypes}
          />

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Remarks / Problem Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={remarks}
              onChangeText={setRemarks}
              placeholder="Describe the issue in detail..."
              placeholderTextColor="#94A3B8"
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          {/* Photo Attachment Picker */}
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Attach Photo / Proof (Optional)</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImage} activeOpacity={0.7}>
              <Text style={styles.uploadBtnText}>📷 {selectedImage ? 'Change Photo' : 'Select Photo from Gallery'}</Text>
            </TouchableOpacity>

            {selectedImage && (
              <View style={styles.imagePreviewContainer}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <TouchableOpacity
                  style={styles.removeImageBtn}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>Remove</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          <TouchableOpacity
            style={[styles.submitBtn, submitting && styles.btnDisabled]}
            onPress={handleSubmit}
            disabled={submitting}
            activeOpacity={0.8}
          >
            {submitting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.submitBtnText}>SUBMIT COMPLAINT</Text>
            )}
          </TouchableOpacity>
        </View>
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
  header: {
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#64748B',
  },
  errorBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  errorText: {
    color: '#B91C1C',
    fontSize: 13,
    fontWeight: '600',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 2,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  inputGroup: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  input: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 11,
    fontSize: 15,
    color: '#0F172A',
  },
  textArea: {
    minHeight: 90,
  },
  uploadBtn: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingVertical: 14,
    alignItems: 'center',
  },
  uploadBtnText: {
    color: '#2563EB',
    fontWeight: '600',
    fontSize: 14,
  },
  imagePreviewContainer: {
    marginTop: 10,
    alignItems: 'center',
  },
  previewImage: {
    width: '100%',
    height: 180,
    borderRadius: 8,
    resizeMode: 'cover',
  },
  removeImageBtn: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 4,
    backgroundColor: '#FEE2E2',
    borderRadius: 6,
  },
  removeImageText: {
    color: '#DC2626',
    fontSize: 12,
    fontWeight: '600',
  },
  submitBtn: {
    backgroundColor: '#2563EB',
    borderRadius: 10,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
});

export default RaiseComplaintScreen;
