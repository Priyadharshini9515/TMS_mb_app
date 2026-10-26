import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

const StatCard = ({ label, value, color = '#2563EB', onPress }) => {
  return (
    <TouchableOpacity
      style={[styles.card, { borderTopColor: color }]}
      onPress={onPress}
      disabled={!onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.value, { color }]}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 6,
    elevation: 3,
    minWidth: '45%',
    marginBottom: 12,
  },
  value: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
});

export default StatCard;
