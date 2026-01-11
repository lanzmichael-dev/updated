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
import * as DocumentPicker from "expo-document-picker";
import { globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000";

const FolderUpload = ({ route, navigation }) => {
  const { folder, user, done } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");

  const pickFile = async () => {
    let result = await DocumentPicker.getDocumentAsync({ type: "*/*" });
    if (!result.canceled) setFile(result.assets[0]);
  };

  const submit = async () => {
    if (!file) return Alert.alert("Error", "Pick a file");

    try {
      const formData = new FormData();
      formData.append("file", {
        uri: file.uri,
        name: file.name,
        type: file.mimeType || "application/octet-stream",
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
        Alert.alert("Success", "Submitted!");
        navigation.goBack();
      } else {
        Alert.alert("Error", data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Upload failed");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{folder.name}</Text>
      <Text style={styles.desc}>{folder.description}</Text>
      <Text style={styles.deadline}>
        Deadline: {new Date(folder.deadline).toLocaleDateString()}
      </Text>

      {!done && (
        <TouchableOpacity
          style={styles.uploadBtn}
          onPress={() => setModalVisible(true)}
        >
          <Text style={{ color: "white", fontWeight: "bold" }}>
            Upload a File
          </Text>
        </TouchableOpacity>
      )}

      <Modal visible={modalVisible} transparent>
        <View style={styles.overlay}>
          <View style={styles.box}>
            <TouchableOpacity style={styles.picker} onPress={pickFile}>
              <Text>{file ? file.name : "Select File (Any extension)"}</Text>
            </TouchableOpacity>
            <TextInput
              style={globalStyles.input}
              placeholder="Notes..."
              onChangeText={setNotes}
            />
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={submit}>
                <Text style={{ color: "blue" }}>Submit</Text>
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
  title: { fontSize: 22, fontWeight: "bold" },
  desc: { marginVertical: 10, color: "#666" },
  deadline: { color: "red", fontWeight: "bold" },
  uploadBtn: {
    backgroundColor: "#ff3d00",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  box: {
    width: "85%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 15,
  },
  picker: {
    borderWidth: 1,
    borderStyle: "dashed",
    padding: 20,
    marginBottom: 15,
    alignItems: "center",
  },
});

export default FolderUpload;
