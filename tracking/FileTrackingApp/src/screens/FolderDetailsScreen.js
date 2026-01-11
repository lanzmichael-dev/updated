import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from "react-native";
import * as DocumentPicker from "expo-document-picker"; // Requires: npx expo install expo-document-picker
import { globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000";

const FolderUploadDetail = ({ route, navigation }) => {
  const { folder, user, submitted } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [notes, setNotes] = useState("");

  const pickFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: "*/*" }); // Accepts any extension
    if (!result.canceled) {
      setSelectedFile(result.assets[0]);
    }
  };

  const handleSubmit = async () => {
    if (!selectedFile)
      return Alert.alert("Error", "Please select a file first");

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.mimeType || "application/octet-stream",
      });
      formData.append("folderId", folder._id);
      formData.append("username", user.username);
      formData.append("notes", notes || "");

      const res = await fetch(`${API_URL}/submit-file`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (data.success) {
        Alert.alert("Success", "File uploaded!");
        setModalVisible(false);
        navigation.goBack();
      } else {
        Alert.alert("Error", data.error || "Upload failed");
      }
    } catch (e) {
      console.error("Upload error:", e);
      Alert.alert("Error", "Upload failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{folder.name}</Text>
      <Text style={styles.desc}>
        {folder.description || "No description provided."}
      </Text>
      <Text style={styles.deadline}>
        Deadline: {new Date(folder.deadline).toLocaleDateString()}
      </Text>

      {!submitted && (
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={styles.btnText}>Upload a File</Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>Submit Assignment</Text>

            <TouchableOpacity style={styles.filePicker} onPress={pickFile}>
              <Text>
                {selectedFile ? selectedFile.name : "Select File (Any type)"}
              </Text>
            </TouchableOpacity>

            <TextInput
              style={[globalStyles.input, { height: 80 }]}
              placeholder="Add notes..."
              multiline
              onChangeText={setNotes}
            />

            <View style={styles.row}>
              <TouchableOpacity
                style={styles.cancel}
                onPress={() => setModalVisible(false)}
              >
                <Text style={styles.btnText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.submit} onPress={handleSubmit}>
                <Text style={styles.btnText}>Submit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20, backgroundColor: "#ffffff" },
  title: { fontSize: 24, fontWeight: "bold" },
  desc: { marginVertical: 15, color: "#666" },
  deadline: { color: "red", fontWeight: "bold" },
  uploadBtn: {
    backgroundColor: "#ff3d00",
    padding: 15,
    borderRadius: 10,
    marginTop: 30,
    alignItems: "center",
  },
  btnText: { color: "white", fontWeight: "bold" },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    width: "90%",
    backgroundColor: "white",
    borderRadius: 20,
    padding: 20,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 20 },
  filePicker: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
    borderStyle: "dashed",
  },
  row: { flexDirection: "row", justifyContent: "space-between", marginTop: 10 },
  cancel: {
    flex: 0.45,
    backgroundColor: "gray",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  submit: {
    flex: 0.45,
    backgroundColor: "#ff3d00",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default FolderUploadDetail;
