import React, { useContext } from 'react';
import { View, ActivityIndicator, StyleSheet, Text } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';

import { AuthContext } from '../context/AuthContext';

// Auth Screens
import LoginScreen from '../screens/LoginScreen';

// Core Screens
import HomeScreen from '../screens/HomeScreen';
import RaiseComplaintScreen from '../screens/RaiseComplaintScreen';
import MyComplaintsScreen from '../screens/MyComplaintsScreen';
import AllComplaintsScreen from '../screens/AllComplaintsScreen';
import ComplaintDetailScreen from '../screens/ComplaintDetailScreen';
import ProfileScreen from '../screens/ProfileScreen';

// SuperAdmin Master Management Screens
import DepartmentManagementScreen from '../screens/DepartmentManagementScreen';
import ProgrammeManagementScreen from '../screens/ProgrammeManagementScreen';
import BlockManagementScreen from '../screens/BlockManagementScreen';
import RoomManagementScreen from '../screens/RoomManagementScreen';
import RoleManagementScreen from '../screens/RoleManagementScreen';
import UserManagementScreen from '../screens/UserManagementScreen';
import ReportsScreen from '../screens/ReportsScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

// Bottom Tab Navigator for primary screens
const MainTabNavigator = () => {
  const { user } = useContext(AuthContext);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        headerStyle: { backgroundColor: '#0F172A' },
        headerTintColor: '#FFFFFF',
        headerTitleStyle: { fontWeight: '800' },
        tabBarStyle: {
          backgroundColor: '#0F172A',
          borderTopColor: '#334155',
          height: 60,
          paddingBottom: 8,
          paddingTop: 6,
        },
        tabBarActiveTintColor: '#38BDF8',
        tabBarInactiveTintColor: '#94A3B8',
        tabBarLabelStyle: { fontSize: 11, fontWeight: '700' },
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Command Center',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🏠</Text>,
        }}
      />

      <Tab.Screen
        name="MyComplaintsTab"
        component={MyComplaintsScreen}
        options={{
          title: 'My Complaints',
          tabBarLabel: 'My Tickets',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>📋</Text>,
        }}
      />

      {user?.role !== 'Networking Staff' &&
       user?.role !== 'Electrician' &&
       user?.role !== 'Plumber' &&
       user?.role !== 'Software Developer' &&
       user?.role !== 'PC Hardware' && (
        <Tab.Screen
          name="RaiseComplaintTab"
          component={RaiseComplaintScreen}
          options={{
            title: 'Raise Complaint',
            tabBarLabel: 'New Ticket',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>➕</Text>,
          }}
        />
      )}

      {user?.role === 'SuperAdmin' && (
        <Tab.Screen
          name="AllComplaintsTab"
          component={AllComplaintsScreen}
          options={{
            title: 'All Tickets',
            tabBarLabel: 'Admin Board',
            tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>🛠️</Text>,
          }}
        />
      )}

      <Tab.Screen
        name="ProfileTab"
        component={ProfileScreen}
        options={{
          title: 'My Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <Text style={{ fontSize: 18, color }}>👤</Text>,
        }}
      />
    </Tab.Navigator>
  );
};

// Main App Navigation Container
const AppNavigator = () => {
  const { isAuthenticated, loading } = useContext(AuthContext);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#38BDF8" />
        <Text style={styles.loadingText}>INITIALIZING TMS MOBILE...</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#0F172A' },
          headerTintColor: '#FFFFFF',
          headerTitleStyle: { fontWeight: '800' },
          headerBackTitleVisible: false,
        }}
      >
        {!isAuthenticated ? (
          // Auth Flow
          <Stack.Screen
            name="Login"
            component={LoginScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Main App Flow
          <>
            <Stack.Screen
              name="Main"
              component={MainTabNavigator}
              options={{ headerShown: false }}
            />
            <Stack.Screen
              name="RaiseComplaint"
              component={RaiseComplaintScreen}
              options={{ title: 'Raise Ticket' }}
            />
            <Stack.Screen
              name="MyComplaints"
              component={MyComplaintsScreen}
              options={{ title: 'My Complaints' }}
            />
            <Stack.Screen
              name="AllComplaints"
              component={AllComplaintsScreen}
              options={{ title: 'All Complaints' }}
            />
            <Stack.Screen
              name="ComplaintDetail"
              component={ComplaintDetailScreen}
              options={{ title: 'Complaint Detail' }}
            />

            {/* Master Screens (SuperAdmin) */}
            <Stack.Screen
              name="DepartmentManagement"
              component={DepartmentManagementScreen}
              options={{ title: 'Departments' }}
            />
            <Stack.Screen
              name="ProgrammeManagement"
              component={ProgrammeManagementScreen}
              options={{ title: 'Programmes' }}
            />
            <Stack.Screen
              name="BlockManagement"
              component={BlockManagementScreen}
              options={{ title: 'Blocks' }}
            />
            <Stack.Screen
              name="RoomManagement"
              component={RoomManagementScreen}
              options={{ title: 'Rooms' }}
            />
            <Stack.Screen
              name="RoleManagement"
              component={RoleManagementScreen}
              options={{ title: 'Roles' }}
            />
            <Stack.Screen
              name="UserManagement"
              component={UserManagementScreen}
              options={{ title: 'User Management' }}
            />
            <Stack.Screen
              name="Reports"
              component={ReportsScreen}
              options={{ title: 'Audit Reports' }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 18,
    color: '#38BDF8',
    fontWeight: '700',
    fontSize: 14,
    letterSpacing: 1.5,
  },
});

export default AppNavigator;
