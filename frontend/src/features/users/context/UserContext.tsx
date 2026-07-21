import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { useThemeStore } from '../../../shared/store/useThemeStore';
import { useToastStore } from '../../../shared/store/useToastStore';
import { userService } from './UserService';
import type { UserItem, CreateUserPayload, UpdateUserPayload } from './UserTypes';

interface UserContextType {
  // Theme State
  colorPrimary: string;

  // Data & Search States
  users: UserItem[];
  filteredUsers: UserItem[];
  isLoading: boolean;
  searchQuery: string;
  setSearchQuery: (q: string) => void;

  // Notification States
  successMsg: string | null;
  errorMsg: string | null;

  // Modal Display States
  showAddModal: boolean;
  showEditModal: boolean;
  showDeleteModal: boolean;

  // Form Input States & Setters
  usernameInput: string;
  setUsernameInput: (val: string) => void;
  nameInput: string;
  setNameInput: (val: string) => void;
  roleInput: string;
  setRoleInput: (val: string) => void;
  passwordInput: string;
  setPasswordInput: (val: string) => void;
  selectedUser: UserItem | null;
  isSubmitting: boolean;

  // Actions & Handlers
  getRoleBadgeClass: (role: string) => string;
  openAddModal: () => void;
  openEditModal: (user: UserItem) => void;
  openDeleteModal: (user: UserItem) => void;
  closeModals: () => void;
  handleAddUser: (e: React.FormEvent) => Promise<void>;
  handleEditUser: (e: React.FormEvent) => Promise<void>;
  handleDeleteUser: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const colorPrimary = useThemeStore((state) => state.colorPrimary);

  const [users, setUsers] = useState<UserItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Modal Display States
  const [showAddModal, setShowAddModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  // Form Inputs
  const [usernameInput, setUsernameInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [roleInput, setRoleInput] = useState('planner');
  const [passwordInput, setPasswordInput] = useState('');

  const [selectedUser, setSelectedUser] = useState<UserItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Fetch Users
  const loadUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await userService.fetchUsers();
      setUsers(data);
    } catch (e) {
      console.error('Failed to load users:', e);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const triggerSuccessNotification = (msg: string) => {
    setSuccessMsg(msg);
    useToastStore.getState().showToast(msg, 'success');
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const triggerErrorNotification = (msg: string) => {
    setErrorMsg(msg);
    useToastStore.getState().showToast(msg, 'error');
  };

  const resetForm = () => {
    setUsernameInput('');
    setNameInput('');
    setRoleInput('planner');
    setPasswordInput('');
    setSelectedUser(null);
  };

  const closeModals = useCallback(() => {
    setShowAddModal(false);
    setShowEditModal(false);
    setShowDeleteModal(false);
    setErrorMsg(null);
  }, []);

  const openAddModal = useCallback(() => {
    resetForm();
    setErrorMsg(null);
    setShowAddModal(true);
  }, []);

  const openEditModal = useCallback((user: UserItem) => {
    setSelectedUser(user);
    setNameInput(user.name);
    setRoleInput(user.role);
    setPasswordInput('');
    setErrorMsg(null);
    setShowEditModal(true);
  }, []);

  const openDeleteModal = useCallback((user: UserItem) => {
    setSelectedUser(user);
    setErrorMsg(null);
    setShowDeleteModal(true);
  }, []);

  const handleAddUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    const validationError = userService.validateAddForm(usernameInput, nameInput, passwordInput);
    if (validationError) {
      setErrorMsg(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: CreateUserPayload = {
        username: usernameInput,
        name: nameInput,
        role: roleInput,
        password: passwordInput,
      };
      await userService.createUser(payload);
      triggerSuccessNotification(`User ${usernameInput} berhasil dibuat.`);
      setShowAddModal(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      triggerErrorNotification(err.response?.data?.message || 'Gagal menambahkan user baru.');
    } finally {
      setIsSubmitting(false);
    }
  }, [usernameInput, nameInput, roleInput, passwordInput, loadUsers]);

  const handleEditUser = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;
    const validationError = userService.validateEditForm(nameInput);
    if (validationError) {
      triggerErrorNotification(validationError);
      return;
    }

    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      const payload: UpdateUserPayload = {
        name: nameInput,
        role: roleInput,
      };
      if (passwordInput.trim()) {
        payload.password = passwordInput;
      }

      await userService.updateUser(selectedUser.id, payload);
      triggerSuccessNotification(`Data user ${selectedUser.username} berhasil diperbarui.`);
      setShowEditModal(false);
      resetForm();
      loadUsers();
    } catch (err: any) {
      triggerErrorNotification(err.response?.data?.message || 'Gagal memperbarui data user.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, nameInput, roleInput, passwordInput, loadUsers]);

  const handleDeleteUser = useCallback(async () => {
    if (!selectedUser) return;
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await userService.deleteUser(selectedUser.id);
      triggerSuccessNotification(`User ${selectedUser.username} berhasil dihapus.`);
      setShowDeleteModal(false);
      setSelectedUser(null);
      loadUsers();
    } catch (err: any) {
      triggerErrorNotification(err.response?.data?.message || 'Gagal menghapus user.');
    } finally {
      setIsSubmitting(false);
    }
  }, [selectedUser, loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = searchQuery.toLowerCase();
    return users.filter(
      (u) => u.name.toLowerCase().includes(query) || u.username.toLowerCase().includes(query)
    );
  }, [users, searchQuery]);

  const getRoleBadgeClass = useCallback((role: string) => {
    return userService.getRoleBadgeClass(role);
  }, []);

  return (
    <UserContext.Provider
      value={{
        colorPrimary,
        users,
        filteredUsers,
        isLoading,
        searchQuery,
        setSearchQuery,
        successMsg,
        errorMsg,
        showAddModal,
        showEditModal,
        showDeleteModal,
        usernameInput,
        setUsernameInput,
        nameInput,
        setNameInput,
        roleInput,
        setRoleInput,
        passwordInput,
        setPasswordInput,
        selectedUser,
        isSubmitting,
        getRoleBadgeClass,
        openAddModal,
        openEditModal,
        openDeleteModal,
        closeModals,
        handleAddUser,
        handleEditUser,
        handleDeleteUser,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
