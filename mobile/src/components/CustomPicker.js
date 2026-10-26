import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  FlatList,
  StyleSheet,
  SafeAreaView,
} from 'react-native';

const CustomPicker = ({
  label,
  selectedValue,
  onValueChange,
  items = [],
  placeholder = 'Select an option',
  disabled = false,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const safeItems = Array.isArray(items) ? items : [];
  const selectedItem = safeItems.find(
    (item) => item && item.value !== undefined && item.value !== null && String(item.value) === String(selectedValue)
  );
  const displayText = selectedItem ? selectedItem.label : placeholder;

  return (
    <View style={styles.container}>
      {label ? <Text style={styles.label}>{label}</Text> : null}
      <TouchableOpacity
        style={[styles.pickerButton, disabled && styles.pickerDisabled]}
        onPress={() => !disabled && setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={[styles.pickerText, !selectedItem && styles.placeholderText]}>
          {displayText}
        </Text>
        <Text style={styles.dropdownArrow}>▼</Text>
      </TouchableOpacity>


      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <SafeAreaView style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{label || 'Select Option'}</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>

            <FlatList
              data={safeItems}
              keyExtractor={(item, index) => String(item?.value !== undefined ? item.value : index)}
              renderItem={({ item }) => {
                if (!item) return null;
                const isSelected = item.value !== undefined && String(item.value) === String(selectedValue);
                return (
                  <TouchableOpacity
                    style={[styles.optionItem, isSelected && styles.optionSelected]}
                    onPress={() => {
                      onValueChange(item.value);
                      setModalVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        isSelected && styles.optionTextSelected,
                      ]}
                    >
                      {item.label}
                    </Text>
                    {isSelected && <Text style={styles.checkmark}>✓</Text>}
                  </TouchableOpacity>
                );
              }}

              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No options available</Text>
                </View>
              }
            />
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 6,
  },
  pickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  pickerDisabled: {
    backgroundColor: '#F1F5F9',
    borderColor: '#E2E8F0',
  },
  pickerText: {
    fontSize: 15,
    color: '#0F172A',
    flex: 1,
  },
  placeholderText: {
    color: '#94A3B8',
  },
  dropdownArrow: {
    fontSize: 12,
    color: '#64748B',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '75%',
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  modalTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0F172A',
  },
  closeButton: {
    padding: 6,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#64748B',
    fontWeight: '600',
  },
  optionItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  optionSelected: {
    backgroundColor: '#EFF6FF',
  },
  optionText: {
    fontSize: 15,
    color: '#334155',
  },
  optionTextSelected: {
    fontWeight: '700',
    color: '#2563EB',
  },
  checkmark: {
    fontSize: 16,
    color: '#2563EB',
    fontWeight: '700',
  },
  emptyContainer: {
    padding: 30,
    alignItems: 'center',
  },
  emptyText: {
    color: '#94A3B8',
    fontSize: 15,
  },
});

export default CustomPicker;
