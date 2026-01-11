import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  Platform,
} from "react-native";
import * as DocumentPicker from "expo-document-picker";
import { globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000";

const FolderUpload = ({ route, navigation }) => {
  const { folder, user, done } = route.params;
  const [modalVisible, setModalVisible] = useState(false);
  const [file, setFile] = useState(null);
  const [notes, setNotes] = useState("");
  const [uploadedFileName, setUploadedFileName] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  useEffect(() => {
    const fetchSubmission = async () => {
      try {
        const res = await fetch(
          `${API_URL}/submission/${folder._id}/${user.username}`
        );
        const data = await res.json();
        if (data.success && data.submission) {
          setSubmissionData(data.submission);
        }
      } catch (error) {
        console.error("Fetch submission error:", error);
      }
    };

    fetchSubmission();

    const unsubscribe = navigation.addListener("focus", fetchSubmission);
    return unsubscribe;
  }, [folder._id, user.username, navigation]);

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
        setUploadedFileName(file.name || data.fileName || "Uploaded file");
        setSubmissionData(data.submission || { filename: file.name, notes });
        setFile(null);
        setNotes("");
        setModalVisible(false);
        Alert.alert("Success", "Submitted!");
      } else {
        Alert.alert("Error", data.error || "Upload failed");
      }
    } catch (error) {
      console.error("Upload error:", error);
      Alert.alert("Error", "Upload failed");
    }
  };

  const unsubmit = async () => {
    Alert.alert("Unsubmit", "Remove your submission?", [
      { text: "Cancel" },
      {
        text: "Unsubmit",
        onPress: async () => {
          try {
            const res = await fetch(`${API_URL}/unsubmit-file`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                folderId: folder._id,
                username: user.username,
              }),
            });
            const data = await res.json();
            if (data.success) {
              setSubmissionData(null);
              setUploadedFileName(null);
              Alert.alert("Success", "Submission removed");
            } else {
              Alert.alert("Error", data.error || "Unsubmit failed");
            }
          } catch (error) {
            console.error("Unsubmit error:", error);
            Alert.alert("Error", "Unsubmit failed");
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.backBtn} />
      </View>

      <Text style={styles.titleCentered}>{folder.name}</Text>
      <Text style={styles.descCentered}>{folder.description}</Text>
      <Text style={styles.deadlineCentered}>
        Deadline: {new Date(folder.deadline).toLocaleDateString()}
      </Text>

      {(submissionData || uploadedFileName) && (
        <View style={styles.uploadedBox}>
          <Text style={styles.uploadedLabel}>Uploaded:</Text>
          <Text style={styles.uploadedName}>
            {submissionData ? submissionData.filename : uploadedFileName}
          </Text>
          {(submissionData?.notes || false) && (
            <>
              <Text style={styles.notesLabel}>Notes:</Text>
              <Text style={styles.notesText}>{submissionData.notes}</Text>
            </>
          )}
        </View>
      )}

      {submissionData ? (
        <TouchableOpacity style={styles.unsubmitBtn} onPress={unsubmit}>
          <Text style={{ color: "white", fontWeight: "bold" }}>Unsubmit</Text>
        </TouchableOpacity>
      ) : (
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
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 50 : 20,
    paddingBottom: 10,
    paddingHorizontal: 8,
  },
  backBtn: { width: 70 },
  backText: { color: "#007aff", fontWeight: "600" },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    fontSize: 20,
    fontWeight: "700",
  },
  titleCentered: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginTop: 80,
    marginBottom: 12,
  },
  title: { fontSize: 22, fontWeight: "bold" },
  desc: { marginVertical: 10, color: "#666" },
  descCentered: {
    marginVertical: 8,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
  deadline: { color: "red", fontWeight: "bold" },
  deadlineCentered: {
    color: "red",
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 8,
  },
  uploadBtn: {
    backgroundColor: "#ff3d00",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  unsubmitBtn: {
    backgroundColor: "#f44336",
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
  uploadedBox: {
    backgroundColor: "#f1f1f1",
    padding: 10,
    borderRadius: 8,
    marginVertical: 10,
    alignItems: "center",
  },
  uploadedLabel: { fontSize: 12, color: "#444" },
  uploadedName: { fontSize: 14, fontWeight: "600", marginTop: 4 },
  notesLabel: {
    fontSize: 11,
    color: "#666",
    fontWeight: "600",
    marginTop: 8,
  },
  notesText: {
    fontSize: 12,
    color: "#666",
    marginTop: 3,
    fontStyle: "italic",
  },
});

export default FolderUpload;
