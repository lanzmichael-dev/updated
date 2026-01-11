import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  TextInput,
  Image,
} from "react-native";
import DateTimePicker from "@react-native-community/datetimepicker";
import { colors, globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000"; // Your local server IP

const SemiAdminDashboard = ({ navigation, route }) => {
  const { user } = route.params;
  const [folders, setFolders] = useState([]);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [folderName, setFolderName] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState(new Date());
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const encodedDepartment = encodeURIComponent(user.department);
      const res = await fetch(`${API_URL}/folders/${encodedDepartment}`);
      const data = await res.json();
      if (data.success) setFolders(data.folders);
    } catch (e) {
      console.error(e);
    }
  };

  const handleSave = async () => {
    if (!folderName.trim())
      return Alert.alert("Required", "Please enter a folder name");
    try {
      // helper: parse response as JSON if possible, otherwise return text
      const parseResponse = async (res) => {
        const text = await res.text();
        try {
          return { ok: res.ok, parsed: JSON.parse(text), raw: text };
        } catch (e) {
          return { ok: res.ok, parsed: null, raw: text };
        }
      };

      if (editingId) {
        const encodedDepartment = encodeURIComponent(user.department);
        const url = `${API_URL}/update-folder/${encodedDepartment}/${editingId}`;
        console.log("Update request URL:", url);
        console.log("Update request data:", {
          name: folderName,
          description,
          deadline: deadline.toISOString(),
        });
        const res = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            description,
            deadline: deadline.toISOString(),
          }),
        });
        console.log("Update response status:", res.status, res.statusText);
        const { ok, parsed, raw } = await parseResponse(res);
        if (!ok || !parsed || !parsed.success) {
          console.error("Update failed (non-JSON or error):", {
            status: res.status,
            statusText: res.statusText,
            ok,
            parsed,
            raw: raw?.substring(0, 500),
          });
          let msg = "Server rejected update";
          if (parsed && parsed.error) {
            msg = parsed.error;
          } else if (parsed && parsed.message) {
            msg = parsed.message;
          } else if (raw) {
            // If raw is HTML, try to extract text content
            if (raw.includes("<html") || raw.includes("<!DOCTYPE")) {
              msg = `Server error (${res.status}). Please check if the server is running and the route is correct.`;
            } else {
              msg = raw;
            }
          }
          return Alert.alert(
            "Update Failed",
            msg.substring ? msg.substring(0, 200) : String(msg)
          );
        }
        setFolders(
          folders.map((f) => (f._id === editingId ? parsed.folder : f))
        );
        setIsModalVisible(false);
        setEditingId(null);
        setFolderName("");
        setDescription("");
      } else {
        const res = await fetch(`${API_URL}/create-folder`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          body: JSON.stringify({
            name: folderName,
            description,
            deadline: deadline.toISOString(),
            createdBy: user.username,
            department: user.department,
          }),
        });
        const { ok, parsed, raw } = await parseResponse(res);
        if (!ok || !parsed || !parsed.success) {
          console.error("Create failed (non-JSON or error):", {
            ok,
            parsed,
            raw,
          });
          const msg =
            parsed && parsed.error
              ? parsed.error
              : parsed && parsed.message
              ? parsed.message
              : raw || "Server rejected create";
          return Alert.alert(
            "Save Failed",
            msg.substring ? msg.substring(0, 800) : String(msg)
          );
        }
        setFolders([parsed.folder, ...folders]);
        setIsModalVisible(false);
        setFolderName("");
        setDescription("");
      }
    } catch (e) {
      console.error("Save error:", e);
      Alert.alert("Error", e.message || "Save failed");
    }
  };

  const handleDelete = (id) => {
    Alert.alert("Delete", "Delete folder?", [
      { text: "Cancel" },
      {
        text: "Delete",
        onPress: async () => {
          const encodedDepartment = encodeURIComponent(user.department);
          await fetch(`${API_URL}/delete-folder/${encodedDepartment}/${id}`, {
            method: "DELETE",
          });
          setFolders(folders.filter((f) => f._id !== id));
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/translogo.png")}
            style={styles.headerLogo}
          />
          <View>
            <Text style={styles.welcome}>welcome back</Text>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.dept}>{user.department}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.createBtn}
          onPress={() => {
            setEditingId(null);
            setFolderName("");
            setDescription("");
            setDeadline(new Date());
            setIsModalVisible(true);
          }}
        >
          <Text style={styles.createBtnText}>+ Create a folder</Text>
        </TouchableOpacity>

        <FlatList
          data={folders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <TouchableOpacity
                style={{ flex: 1 }}
                onPress={() =>
                  navigation.navigate("SubmissionDetails", { folder: item })
                }
              >
                <Text style={styles.cardTitle}>📁 {item.name}</Text>
                <Text style={styles.cardDate}>
                  Deadline: {new Date(item.deadline).toLocaleDateString()}
                </Text>
              </TouchableOpacity>
              <View style={styles.cardActions}>
                <TouchableOpacity
                  style={styles.editBtn}
                  onPress={() => {
                    // open modal with prefilled values for editing
                    setEditingId(item._id);
                    setFolderName(item.name || "");
                    setDescription(item.description || "");
                    setDeadline(
                      item.deadline ? new Date(item.deadline) : new Date()
                    );
                    setIsModalVisible(true);
                  }}
                >
                  <Text style={styles.btnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.delBtn}
                  onPress={() => handleDelete(item._id)}
                >
                  <Text style={styles.btnText}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      </View>

      <Modal visible={isModalVisible} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>
              {editingId ? "Edit Folder" : "New Folder"}
            </Text>
            <TextInput
              style={globalStyles.input}
              placeholder="Folder Name"
              value={folderName}
              onChangeText={setFolderName}
            />
            <TextInput
              style={[globalStyles.input, { height: 60 }]}
              placeholder="Description"
              multiline
              value={description}
              onChangeText={setDescription}
            />

            <TouchableOpacity
              style={globalStyles.input}
              onPress={() => setShowPicker(true)}
            >
              <Text>📅 Deadline: {deadline.toLocaleDateString()}</Text>
            </TouchableOpacity>

            {showPicker && (
              <DateTimePicker
                value={deadline}
                mode="date"
                onChange={(e, date) => {
                  setShowPicker(false);
                  if (date) setDeadline(date);
                }}
              />
            )}

            <View style={styles.modalRow}>
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => setIsModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.save} onPress={handleSave}>
                <Text style={styles.btnText}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  header: {
    flexDirection: "row",
    paddingTop: 50,
    paddingHorizontal: 12,
    backgroundColor: "#242323",
    elevation: 0,
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
  },
  headerLogo: {
    width: 60,
    height: 60,
    opacity: 1,
  },
  welcome: { fontSize: 12, color: "white" },
  name: { fontSize: 18, fontWeight: "bold", color: "white" },
  dept: { fontSize: 11, color: "#f2760a", fontWeight: "bold", marginBottom: 8 },
  logout: {
    color: "#c15e0e",
    fontWeight: "bold",
  },
  content: { flex: 1, padding: 20 },
  createBtn: {
    alignSelf: "flex-end",
    backgroundColor: "#ff3d00",
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  createBtnText: { color: "white", fontWeight: "bold" },
  card: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardDate: { fontSize: 12, color: "red" },
  cardActions: { flexDirection: "row" },
  editBtn: {
    backgroundColor: "#4CAF50",
    padding: 8,
    borderRadius: 5,
    marginRight: 5,
  },
  delBtn: { backgroundColor: "#f44336", padding: 8, borderRadius: 5 },
  btnText: { color: "white", fontWeight: "bold", fontSize: 12 },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "85%",
    backgroundColor: "white",
    borderRadius: 15,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
    textAlign: "center",
  },
  modalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 15,
  },
  cancel: {
    flex: 0.45,
    backgroundColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  save: {
    flex: 0.45,
    backgroundColor: "#ff3d00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default SemiAdminDashboard;
