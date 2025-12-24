import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  ActivityIndicator,
  Alert
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import {
  ArrowLeft,
  Briefcase,
  Plus,
  MoreVertical,
  Trash2,
  Check,
} from 'lucide-react-native';
import { api } from '@/lib/api';
import type { RoleWithCounts } from '@/types/api';

// --- Types ---
type EmployeeBasic = {
  id: string;
  firstName: string;
  lastName: string;
  roleIds: string[]; // List of role IDs this employee has
};

export default function JobRoles() {
  const router = useRouter();
  const { orgId } = useLocalSearchParams();

  // State
  const [roles, setRoles] = useState<RoleWithCounts[]>([]);
  const [employees, setEmployees] = useState<EmployeeBasic[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithCounts | null>(null); // null = Creating new
  const [modalName, setModalName] = useState('');
  const [modalEmployeeIds, setModalEmployeeIds] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  // --- 1. Load Data ---
  useEffect(() => {
    fetchData();
  }, [orgId]);

  const fetchData = async () => {
    try {
      setLoading(true);

      // Fetch roles and employees from backend
      const [rolesData, employeesData] = await Promise.all([
        api.getRoles(orgId as string),
        api.getEmployees(orgId as string)
      ]);

      // Transform employees to include roleIds for easier UI handling
      // Backend returns employees with user.firstName/lastName and roleAssignments
      const transformedEmployees: EmployeeBasic[] = employeesData.map(emp => ({
        id: emp.id,
        firstName: emp.user.firstName,
        lastName: emp.user.lastName,
        roleIds: (emp as any).roleAssignments?.map((ra: any) => ra.roleId) || []
      }));

      setRoles(rolesData);
      setEmployees(transformedEmployees);
    } catch (e) {
      console.error('Failed to fetch roles/employees:', e);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  // --- 2. Handlers ---

  const openCreateModal = () => {
    setEditingRole(null);
    setModalName('');
    setModalEmployeeIds(new Set()); // Start empty
    setIsModalOpen(true);
  };

  const openEditModal = (role: RoleWithCounts) => {
    setEditingRole(role);
    setModalName(role.name);
    // Pre-select employees who currently have this role
    const assignedIds = employees
      .filter(e => e.roleIds.includes(role.id))
      .map(e => e.id);
    setModalEmployeeIds(new Set(assignedIds));
    setIsModalOpen(true);
  };

  const toggleEmployeeSelection = (empId: string) => {
    const newSet = new Set(modalEmployeeIds);
    if (newSet.has(empId)) {
      newSet.delete(empId);
    } else {
      newSet.add(empId);
    }
    setModalEmployeeIds(newSet);
  };

  const handleSave = async () => {
    if (!modalName.trim()) return;
    setSaving(true);

    try {
      if (editingRole) {
        // UPDATE EXISTING ROLE

        // 1. Update role name if changed
        if (editingRole.name !== modalName) {
          await api.updateRole(editingRole.id, modalName);
        }

        // 2. Calculate which employees need to be added/removed
        const currentAssignments = new Set(
          employees
            .filter(e => e.roleIds.includes(editingRole.id))
            .map(e => e.id)
        );

        const toAdd = Array.from(modalEmployeeIds).filter(id => !currentAssignments.has(id));
        const toRemove = Array.from(currentAssignments).filter(id => !modalEmployeeIds.has(id));

        // 3. Add role to newly selected employees
        await Promise.all(
          toAdd.map(empId => api.assignEmployeeRole(orgId as string, empId, editingRole.id))
        );

        // 4. Remove role from deselected employees
        await Promise.all(
          toRemove.map(empId => api.removeEmployeeRole(orgId as string, empId, editingRole.id))
        );

      } else {
        // CREATE NEW ROLE

        // 1. Create the role
        const newRole = await api.createRole(orgId as string, modalName);

        // 2. Assign to selected employees
        await Promise.all(
          Array.from(modalEmployeeIds).map(empId =>
            api.assignEmployeeRole(orgId as string, empId, newRole.id)
          )
        );
      }

      // Refresh data and close modal
      setIsModalOpen(false);
      await fetchData();
    } catch (e) {
      console.error('Failed to save role:', e);
      Alert.alert('Error', 'Failed to save role. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!editingRole) return;

    Alert.alert(
      "Delete Role",
      `Are you sure you want to delete "${editingRole.name}"? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.deleteRole(editingRole.id);
              setIsModalOpen(false);
              await fetchData();
            } catch (e) {
              console.error('Failed to delete role:', e);
              Alert.alert('Error', 'Failed to delete role. Please try again.');
            }
          }
        }
      ]
    );
  };

  // --- 3. Render ---

  const renderRoleItem = ({ item }: { item: RoleWithCounts }) => (
    <TouchableOpacity
      style={styles.card}
      onPress={() => openEditModal(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardIcon}>
        <Briefcase size={20} color="#818cf8" />
      </View>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{item.name}</Text>
        <Text style={styles.cardSubtitle}>
          {item._count.employeeAssignments} {item._count.employeeAssignments === 1 ? 'Employee' : 'Employees'}
        </Text>
      </View>
      <MoreVertical size={20} color="#475569" />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <ArrowLeft size={24} color="#94a3b8" />
        </TouchableOpacity>
        <View>
          <Text style={styles.title}>Job Roles</Text>
          <Text style={styles.subtitle}>Define positions and assign staff.</Text>
        </View>
      </View>

      {/* Main List */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 40 }} color="#4f46e5" />
      ) : (
        <FlatList
          data={roles}
          renderItem={renderRoleItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContent}
          ListEmptyComponent={
            <Text style={styles.emptyText}>No roles defined yet.</Text>
          }
        />
      )}

      {/* FAB: Create Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={openCreateModal}
        activeOpacity={0.8}
      >
        <Plus size={24} color="#ffffff" />
      </TouchableOpacity>

      {/* --- EDIT/CREATE MODAL --- */}
      <Modal
        visible={isModalOpen}
        animationType="slide"
        presentationStyle="pageSheet" // iOS standard sheet look
        onRequestClose={() => setIsModalOpen(false)}
      >
        <View style={styles.modalContainer}>

          {/* Modal Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>
              {editingRole ? 'Edit Role' : 'New Role'}
            </Text>
            <TouchableOpacity onPress={() => setIsModalOpen(false)}>
              <Text style={styles.closeText}>Cancel</Text>
            </TouchableOpacity>
          </View>

          {/* Role Name Input */}
          <View style={styles.inputSection}>
            <Text style={styles.label}>Role Name</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Head Bartender"
              placeholderTextColor="#475569"
              value={modalName}
              onChangeText={setModalName}
              autoFocus={!editingRole}
            />
          </View>

          {/* Employee Selector */}
          <View style={styles.listSection}>
            <Text style={styles.label}>Assigned Employees</Text>
            <Text style={styles.labelHint}>Select who can work this position.</Text>

            <FlatList
              data={employees}
              keyExtractor={item => item.id}
              style={styles.employeeList}
              renderItem={({ item }) => {
                const isSelected = modalEmployeeIds.has(item.id);
                return (
                  <TouchableOpacity
                    style={styles.employeeRow}
                    onPress={() => toggleEmployeeSelection(item.id)}
                    activeOpacity={0.7}
                  >
                    <View style={[styles.checkCircle, isSelected && styles.checkCircleSelected]}>
                      {isSelected && <Check size={14} color="#020617" strokeWidth={3} />}
                    </View>
                    <Text style={styles.employeeName}>
                      {item.firstName} {item.lastName}
                    </Text>
                  </TouchableOpacity>
                );
              }}
            />
          </View>

          {/* Modal Footer Actions */}
          <View style={[styles.modalFooter, !editingRole && styles.modalFooterCentered]}>
            {/* Delete Button (Only for existing roles) */}
            {editingRole && (
              <TouchableOpacity
                style={styles.deleteButton}
                onPress={handleDelete}
              >
                <Trash2 size={20} color="#ef4444" />
              </TouchableOpacity>
            )}

            {/* Save Button */}
            <TouchableOpacity
              style={[
                styles.saveButton,
                (!modalName || saving) && styles.disabledButton,
                !editingRole && styles.saveButtonCentered
              ]}
              onPress={handleSave}
              disabled={!modalName || saving}
            >
              {saving ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.saveButtonText}>Save Role</Text>
              )}
            </TouchableOpacity>
          </View>

        </View>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#020617',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    gap: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#ffffff',
  },
  subtitle: {
    fontSize: 14,
    color: '#94a3b8',
  },

  // List
  listContent: {
    padding: 24,
    paddingTop: 0,
    gap: 12,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0f172a',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#1e293b',
  },
  cardIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: 'rgba(129, 140, 248, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  cardContent: {
    flex: 1,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff',
    marginBottom: 2,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#64748b',
  },
  emptyText: {
    color: '#64748b',
    textAlign: 'center',
    marginTop: 40,
    fontSize: 16,
  },

  // FAB
  fab: {
    position: 'absolute',
    bottom: 32,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#4f46e5',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#4f46e5',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },

  // --- Modal Styles ---
  modalContainer: {
    flex: 1,
    backgroundColor: '#020617',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ffffff',
  },
  closeText: {
    color: '#94a3b8',
    fontSize: 16,
  },

  inputSection: {
    padding: 24,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#cbd5e1',
    marginBottom: 8,
  },
  labelHint: {
    fontSize: 13,
    color: '#64748b',
    marginBottom: 12,
    marginTop: -4,
  },
  input: {
    backgroundColor: '#0f172a',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    padding: 16,
    color: '#ffffff',
    fontSize: 16,
  },

  // Employee Selection List
  listSection: {
    flex: 1,
    paddingHorizontal: 24,
  },
  employeeList: {
    flex: 1,
  },
  employeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  checkCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#475569',
    marginRight: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkCircleSelected: {
    borderColor: '#34d399',
    backgroundColor: '#34d399',
  },
  employeeName: {
    fontSize: 16,
    color: '#94a3b8',
  },

  // Modal Footer
  modalFooter: {
    flexDirection: 'row',
    padding: 24,
    paddingBottom: 40,
    borderTopWidth: 1,
    borderTopColor: '#1e293b',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  modalFooterCentered: {
    justifyContent: 'center',
  },
  deleteButton: {
    width: 48,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 12,
  },
  saveButton: {
    flex: 1,
    marginLeft: 16,
    height: 48,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonCentered: {
    flex: 0,
    marginLeft: 0,
    paddingHorizontal: 48,
  },
  disabledButton: {
    backgroundColor: '#1e293b',
    opacity: 0.7,
  },
  saveButtonText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 16,
  },
});