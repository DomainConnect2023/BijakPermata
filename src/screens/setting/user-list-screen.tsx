import { Ionicons } from "@expo/vector-icons";
import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";

import { AccessDeniedView } from "@/components/access-denied-view";
import { Spacing } from "@/constants/theme";
import { usePageAccess } from "@/hooks/use-page-access";
import {
  type ApiUser,
  createUser,
  deleteUser,
  fetchUserList,
  updateUser,
} from "@/services/user-api";

const BRAND_COLOR = "#208AEF";

type FormState = {
  userId: number | null;
  userCode: string;
  userName: string;
  password: string;
};

const EMPTY_FORM: FormState = {
  userId: null,
  userCode: "",
  userName: "",
  password: "",
};

export function UserListScreen() {
  const { loading: permissionLoading, access } = usePageAccess([
    "ViewUser",
    "CreateUser",
    "EditUser",
    "DeleteUser",
  ]);

  const [users, setUsers] = useState<ApiUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState("");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [modalVisible, setModalVisible] = useState(false);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const isEditing = form.userId !== null;

  const loadUsers = useCallback(async () => {
    setErrorMessage(null);
    try {
      const list = await fetchUserList();
      setUsers(list);
    } catch (error) {
      setErrorMessage(
        error instanceof Error ? error.message : "Failed to load users",
      );
    }
  }, []);

  useEffect(() => {
    if (permissionLoading || !access.ViewUser) return;
    (async () => {
      setLoading(true);
      await loadUsers();
      setLoading(false);
    })();
  }, [loadUsers, permissionLoading, access.ViewUser]);

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadUsers();
    setRefreshing(false);
  }, [loadUsers]);

  const filteredUsers = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return users;
    return users.filter(
      (user) =>
        user.userName.toLowerCase().includes(query) ||
        user.code.toLowerCase().includes(query),
    );
  }, [users, search]);

  function openCreateModal() {
    setForm(EMPTY_FORM);
    setFormError(null);
    setModalVisible(true);
  }

  function openEditModal(user: ApiUser) {
    setForm({
      userId: user.userId,
      userCode: user.code,
      userName: user.userName,
      password: "",
    });
    setFormError(null);
    setModalVisible(true);
  }

  function closeModal() {
    if (submitting) return;
    setModalVisible(false);
  }

  async function handleSubmit() {
    if (isEditing && !access.EditUser) return;
    if (!isEditing && !access.CreateUser) return;

    const userCode = form.userCode.trim();
    const userName = form.userName.trim();
    const password = form.password.trim();

    if (!userCode || !userName || (!isEditing && !password)) {
      setFormError("Please fill in all required fields.");
      return;
    }

    setSubmitting(true);
    setFormError(null);
    try {
      if (isEditing && form.userId !== null) {
        await updateUser({ userId: form.userId, userCode, userName });
      } else {
        await createUser({ userCode, userName, password });
      }
      setModalVisible(false);
      await loadUsers();
      Alert.alert(
        "Success",
        isEditing ? "User updated successfully." : "User created successfully.",
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Failed to save user";
      setFormError(message);
      Alert.alert("Failed", message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleDelete(user: ApiUser) {
    if (!access.DeleteUser) return;

    Alert.alert(
      "Delete User",
      `Are you sure you want to delete "${user.userName}"?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await deleteUser(user.userId);
              await loadUsers();
              Alert.alert("Success", "User deleted successfully.");
            } catch (error) {
              Alert.alert(
                "Failed",
                error instanceof Error ? error.message : "Please try again.",
              );
            }
          },
        },
      ],
    );
  }

  if (permissionLoading) {
    return (
      <View style={[styles.container, styles.centerContent]}>
        <ActivityIndicator color={BRAND_COLOR} size="large" />
      </View>
    );
  }

  if (!access.ViewUser) {
    return (
      <AccessDeniedView message="You don't have permission to view users." />
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.searchRow}>
        <View style={styles.searchInputWrapper}>
          <Ionicons name="search-outline" size={18} color="#9CA3AF" />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search by name or code"
            placeholderTextColor="#9CA3AF"
            autoCapitalize="none"
            autoCorrect={false}
            style={styles.searchInput}
          />
        </View>
        {access.CreateUser && (
          <Pressable
            onPress={openCreateModal}
            style={({ pressed }) => [
              styles.addButton,
              pressed && { opacity: 0.85 },
            ]}
          >
            <Ionicons name="add" size={24} color="#FFFFFF" />
          </Pressable>
        )}
      </View>

      {loading ? (
        <View style={styles.centerContent}>
          <ActivityIndicator color={BRAND_COLOR} size="large" />
        </View>
      ) : errorMessage ? (
        <View style={styles.centerContent}>
          <Ionicons name="alert-circle-outline" size={32} color="#EF4444" />
          <Text style={styles.errorText}>{errorMessage}</Text>
          <Pressable onPress={loadUsers} style={styles.retryButton}>
            <Ionicons name="refresh" size={16} color={BRAND_COLOR} />
            <Text style={styles.retryText}>Retry</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={filteredUsers}
          keyExtractor={(item) => String(item.userId)}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
          }
          ListEmptyComponent={
            <View style={styles.centerContent}>
              <Ionicons name="people-outline" size={32} color="#9CA3AF" />
              <Text style={styles.emptyText}>No users found.</Text>
            </View>
          }
          renderItem={({ item }) => (
            <View style={styles.userCard}>
              <View style={styles.avatarContainer}>
                <Ionicons name="person" size={20} color={BRAND_COLOR} />
              </View>
              <View style={styles.userInfo}>
                <Text style={styles.userName}>{item.userName}</Text>
                <View style={styles.userCodeRow}>
                  <Ionicons name="pricetag-outline" size={12} color="#6B7280" />
                  <Text style={styles.userCode}>{item.code}</Text>
                </View>
              </View>
              {access.EditUser && (
                <Pressable
                  onPress={() => openEditModal(item)}
                  style={styles.iconButton}
                >
                  <Ionicons name="create-outline" size={20} color="#208AEF" />
                </Pressable>
              )}
              {access.DeleteUser && (
                <Pressable
                  onPress={() => handleDelete(item)}
                  style={styles.iconButton}
                >
                  <Ionicons name="trash-outline" size={20} color="#EF4444" />
                </Pressable>
              )}
            </View>
          )}
        />
      )}

      <Modal
        visible={modalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeModal}
      >
        <KeyboardAvoidingView
          style={styles.modalOverlay}
          behavior={Platform.select({ ios: "padding", default: undefined })}
        >
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>
                {isEditing ? "Edit User" : "Add User"}
              </Text>
              <Pressable onPress={closeModal} style={styles.iconButton}>
                <Ionicons name="close" size={22} color="#6B7280" />
              </Pressable>
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>User Code</Text>
              <TextInput
                value={form.userCode}
                onChangeText={(value) =>
                  setForm((f) => ({ ...f, userCode: value }))
                }
                placeholder="e.g. EMP001"
                placeholderTextColor="#9CA3AF"
                autoCapitalize="none"
                autoCorrect={false}
                style={styles.formInput}
              />
            </View>

            <View style={styles.formField}>
              <Text style={styles.formLabel}>User Name</Text>
              <TextInput
                value={form.userName}
                onChangeText={(value) =>
                  setForm((f) => ({ ...f, userName: value }))
                }
                placeholder="Full name"
                placeholderTextColor="#9CA3AF"
                autoCorrect={false}
                style={styles.formInput}
              />
            </View>

            {!isEditing && (
              <View style={styles.formField}>
                <Text style={styles.formLabel}>Password</Text>
                <TextInput
                  value={form.password}
                  onChangeText={(value) =>
                    setForm((f) => ({ ...f, password: value }))
                  }
                  placeholder="Password"
                  placeholderTextColor="#9CA3AF"
                  secureTextEntry
                  autoCapitalize="none"
                  autoCorrect={false}
                  style={styles.formInput}
                />
              </View>
            )}

            {formError && <Text style={styles.errorText}>{formError}</Text>}

            <Pressable
              onPress={handleSubmit}
              disabled={submitting}
              style={({ pressed }) => [
                styles.submitButton,
                { opacity: submitting ? 0.7 : pressed ? 0.85 : 1 },
              ]}
            >
              {submitting ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <Text style={styles.submitButtonText}>
                  {isEditing ? "Save Changes" : "Create User"}
                </Text>
              )}
            </Pressable>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  searchRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    paddingHorizontal: Spacing.four,
    paddingTop: Spacing.three,
    paddingBottom: Spacing.two,
  },
  searchInputWrapper: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.two,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    height: 44,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#111827",
  },
  addButton: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
  },
  centerContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.two,
    paddingTop: Spacing.six,
  },
  retryButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
  },
  retryText: {
    color: BRAND_COLOR,
    fontWeight: "600",
    fontSize: 14,
  },
  errorText: {
    color: "#EF4444",
    fontSize: 13,
    textAlign: "center",
  },
  emptyText: {
    color: "#9CA3AF",
    fontSize: 14,
  },
  listContent: {
    paddingHorizontal: Spacing.four,
    paddingBottom: Spacing.six,
    gap: Spacing.two,
  },
  userCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
    borderRadius: 14,
    padding: Spacing.three,
    gap: Spacing.three,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: "#208AEF12",
    alignItems: "center",
    justifyContent: "center",
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: "600",
    color: "#111827",
    marginBottom: 2,
  },
  userCodeRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  userCode: {
    fontSize: 12,
    color: "#6B7280",
    fontWeight: "500",
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    alignItems: "center",
    justifyContent: "center",
    padding: Spacing.four,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: Spacing.one,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#111827",
  },
  formField: {
    gap: 6,
  },
  formLabel: {
    fontSize: 13,
    fontWeight: "600",
    color: "#374151",
  },
  formInput: {
    height: 48,
    borderRadius: 10,
    paddingHorizontal: Spacing.three,
    fontSize: 15,
    color: "#111827",
    backgroundColor: "#F3F4F6",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  submitButton: {
    height: 50,
    borderRadius: 12,
    backgroundColor: BRAND_COLOR,
    alignItems: "center",
    justifyContent: "center",
    marginTop: Spacing.one,
  },
  submitButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
});
