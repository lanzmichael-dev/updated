import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const API_URL = "http://192.168.1.245:3000";

const UsersManagement = ({ navigation, route }) => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [modalVisible, setModalVisible] = useState(false);

  // Filter state
  const [filterDepartment, setFilterDepartment] = useState("");
  const [filterRole, setFilterRole] = useState("");

  // Form state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [department, setDepartment] = useState("");
  const [newDepartment, setNewDepartment] = useState("");

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`${API_URL}/all-users`);
      const data = await res.json();
      if (data.success) {
        setUsers(data.users);
      }
    } catch (error) {
      console.error("Error fetching users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/departments`);
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
    }
  };

  const handleCreateUser = async () => {
    if (!username.trim() || !password.trim() || !name.trim()) {
      return Alert.alert("Error", "Please fill in all required fields");
    }

    const selectedDept =
      department === "new" ? newDepartment.trim() : department;
    if (!selectedDept) {
      return Alert.alert("Error", "Please select or enter a department");
    }

    try {
      const res = await fetch(`${API_URL}/create-user`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password: password.trim(),
          name: name.trim(),
          role,
          department: selectedDept,
        }),
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("Success", "User created successfully!");
        setModalVisible(false);
        // Reset form
        setUsername("");
        setPassword("");
        setName("");
        setRole("user");
        setDepartment("");
        setNewDepartment("");
        // Refresh users list
        fetchUsers();
        fetchDepartments();
      } else {
        Alert.alert("Error", data.error || "Failed to create user");
      }
    } catch (error) {
      console.error("Error creating user:", error);
      Alert.alert("Error", "Failed to create user");
    }
  };

  const getRoleColor = (userRole) => {
    return userRole === "semi-admin" ? "#ff9800" : "#28a745";
  };

  const getRoleBadge = (userRole) => {
    return userRole === "semi-admin" ? "👨‍💼 Semi-Admin" : "👤 User";
  };

  // Filter users based on selected filters
  const filteredUsers = users.filter((user) => {
    const matchesDepartment = !filterDepartment || user.department === filterDepartment;
    const matchesRole = !filterRole || user.role === filterRole;
    return matchesDepartment && matchesRole;
  });

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backButton}>← Back</Text>
        </TouchableOpacity>
        <Text style={styles.title}>Users Management</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)}>
          <Text style={styles.addButton}>+ Add</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>All Users ({filteredUsers.length})</Text>

        {/* Filter Section */}
        <View style={styles.filterContainer}>
          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Department:</Text>
            <View style={styles.filterPickerContainer}>
              <Picker
                selectedValue={filterDepartment}
                onValueChange={(itemValue) => setFilterDepartment(itemValue)}
                style={styles.filterPicker}
              >
                <Picker.Item label="All Departments" value="" />
                {departments.map((dept) => (
                  <Picker.Item key={dept} label={dept} value={dept} />
                ))}
              </Picker>
            </View>
          </View>

          <View style={styles.filterRow}>
            <Text style={styles.filterLabel}>Role:</Text>
            <View style={styles.filterPickerContainer}>
              <Picker
                selectedValue={filterRole}
                onValueChange={(itemValue) => setFilterRole(itemValue)}
                style={styles.filterPicker}
              >
                <Picker.Item label="All Roles" value="" />
                <Picker.Item label="👤 User" value="user" />
                <Picker.Item label="👨‍💼 Semi-Admin" value="semi-admin" />
              </Picker>
            </View>
          </View>
        </View>

        {filteredUsers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No users found</Text>
          </View>
        ) : (
          <FlatList
            data={filteredUsers}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <View style={styles.userCard}>
                <View style={{ flex: 1 }}>
                  <View style={styles.userHeader}>
                    <Text style={styles.userName}>{item.name}</Text>
                    <View
                      style={[
                        styles.roleBadge,
                        { backgroundColor: getRoleColor(item.role) },
                      ]}
                    >
                      <Text style={styles.roleBadgeText}>
                        {getRoleBadge(item.role)}
                      </Text>
                    </View>
                  </View>
                  <Text style={styles.userUsername}>@{item.username}</Text>
                  <Text style={styles.userDepartment}>
                    {item.department}
                  </Text>
                </View>
              </View>
            )}
          />
        )}
      </View>

      {/* Create User Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <ScrollView showsVerticalScrollIndicator={false}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Create New User</Text>
                <TouchableOpacity
                  onPress={() => setModalVisible(false)}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </TouchableOpacity>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Full Name *"
                value={name}
                onChangeText={setName}
              />

              <TextInput
                style={styles.input}
                placeholder="Username *"
                value={username}
                onChangeText={setUsername}
                autoCapitalize="none"
              />

              <TextInput
                style={styles.input}
                placeholder="Password *"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
              />

              <Text style={styles.label}>Role *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={role}
                  onValueChange={(itemValue) => setRole(itemValue)}
                  style={styles.picker}
                >
                  <Picker.Item label="👤 User" value="user" />
                  <Picker.Item label="👨‍💼 Semi-Admin" value="semi-admin" />
                </Picker>
              </View>

              <Text style={styles.label}>Department *</Text>
              <View style={styles.pickerContainer}>
                <Picker
                  selectedValue={department}
                  onValueChange={(itemValue) => {
                    setDepartment(itemValue);
                    if (itemValue !== "new") {
                      setNewDepartment("");
                    }
                  }}
                  style={styles.picker}
                >
                  <Picker.Item label="Select Department" value="" />
                  {departments.map((dept) => (
                    <Picker.Item key={dept} label={dept} value={dept} />
                  ))}
                  <Picker.Item label="+ Add New Department" value="new" />
                </Picker>
              </View>

              {department === "new" && (
                <TextInput
                  style={styles.input}
                  placeholder="Enter New Department Name"
                  value={newDepartment}
                  onChangeText={setNewDepartment}
                />
              )}

              <View style={styles.modalRow}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={() => {
                    setModalVisible(false);
                    setUsername("");
                    setPassword("");
                    setName("");
                    setRole("user");
                    setDepartment("");
                    setNewDepartment("");
                  }}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.createBtn}
                  onPress={handleCreateUser}
                >
                  <Text style={styles.createBtnText}>Create</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 50,
    backgroundColor: "white",
    elevation: 2,
  },
  backButton: { fontSize: 16, color: "#007bff", fontWeight: "600" },
  title: { fontSize: 18, fontWeight: "bold", flex: 1, textAlign: "center" },
  addButton: { fontSize: 16, color: "#ff3d00", fontWeight: "bold" },
  content: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  filterContainer: {
    backgroundColor: "#f8f9fa",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  filterRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
    width: 100,
  },
  filterPickerContainer: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    overflow: "hidden",
    backgroundColor: "white",
  },
  filterPicker: {
    height: 40,
    fontSize: 11,
  },
  userCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  userHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 5,
  },
  userName: { fontSize: 16, fontWeight: "bold", flex: 1 },
  roleBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  roleBadgeText: {
    color: "white",
    fontSize: 11,
    fontWeight: "bold",
  },
  userUsername: { fontSize: 13, color: "#666", marginBottom: 3 },
  userDepartment: { fontSize: 13, color: "#007bff", fontWeight: "600" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: { fontSize: 14, color: "#999" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    maxHeight: "80%",
    backgroundColor: "white",
    borderRadius: 15,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: { fontSize: 20, fontWeight: "bold", color: "#333" },
  closeButton: { padding: 5 },
  closeButtonText: { fontSize: 24, color: "#999", fontWeight: "bold" },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    padding: 12,
    marginHorizontal: 20,
    marginTop: 10,
    fontSize: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginTop: 15,
    marginHorizontal: 20,
    marginBottom: 5,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 8,
    marginHorizontal: 20,
    marginTop: 5,
    overflow: "hidden",
  },
  picker: {
    height: 50,
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
    paddingHorizontal: 20,
  },
  cancelBtn: {
    flex: 0.45,
    backgroundColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  cancelBtnText: { color: "white", fontWeight: "bold" },
  createBtn: {
    flex: 0.45,
    backgroundColor: "#ff3d00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  createBtnText: { color: "white", fontWeight: "bold" },
});

export default UsersManagement;
