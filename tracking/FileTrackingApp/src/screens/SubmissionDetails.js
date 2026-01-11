import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  ScrollView,
  Image,
  Dimensions,
  Alert,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { WebView } from "react-native-webview";

const API_URL = "http://192.168.1.245:3000";
const { width: screenWidth, height: screenHeight } = Dimensions.get("window");

const SubmissionDetails = ({ navigation, route }) => {
  const { folder } = route.params;
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedFile, setSelectedFile] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [pdfViewerVisible, setPdfViewerVisible] = useState(false);
  const [pdfUrl, setPdfUrl] = useState(null);

  const isImageFile = (fileType) => {
    return fileType && fileType.startsWith("image/");
  };

  const isPdfFile = (fileType) => {
    return fileType === "application/pdf";
  };

  const openFile = async (fileUrl, fileType, fileName) => {
    try {
      console.log(
        "Opening file:",
        fileUrl,
        "Type:",
        fileType,
        "Name:",
        fileName
      );

      if (isImageFile(fileType)) {
        // Images will be shown in the modal
        return;
      } else if (isPdfFile(fileType)) {
        // For PDFs, show in WebView modal using Google Docs Viewer
        // This is more reliable than displaying PDF directly in WebView
        console.log("Opening PDF in WebView:", fileUrl);
        // Use Google Docs Viewer for better PDF display compatibility
        const googleDocsViewerUrl = `https://docs.google.com/viewer?url=${encodeURIComponent(
          fileUrl
        )}&embedded=true`;
        setPdfUrl(googleDocsViewerUrl);
        setPdfViewerVisible(true);
      } else {
        // Try to open other files using Linking
        const canOpen = await Linking.canOpenURL(fileUrl);
        if (canOpen) {
          await Linking.openURL(fileUrl);
        } else {
          Alert.alert("Error", "Cannot open this file type");
        }
      }
    } catch (error) {
      console.error("Error opening file:", error);
      Alert.alert("Error", "Failed to open file: " + error.message);
    }
  };

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      // Fetch submissions for this folder
      const res = await fetch(`${API_URL}/folder-submissions/${folder._id}`);
      const data = await res.json();

      if (data.success) {
        console.log("Submissions fetched:", data.submissions);
        setSubmissions(data.submissions);
      }
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📁 {folder.name}</Text>
        <Text style={styles.description}>{folder.description}</Text>
        <Text style={styles.deadline}>
          Deadline: {new Date(folder.deadline).toLocaleDateString()}
        </Text>
      </View>

      {/* Submissions List */}
      <View style={styles.content}>
        <Text style={styles.sectionTitle}>
          Submissions ({submissions.length})
        </Text>

        {submissions.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No submissions yet</Text>
          </View>
        ) : (
          <FlatList
            data={submissions}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.submissionCard}
                onPress={() => {
                  setSelectedFile(item);
                  setModalVisible(true);
                }}
                activeOpacity={0.7}
              >
                <View style={styles.submissionInfo}>
                  <Text style={styles.submitterName}>{item.username}</Text>
                  <Text style={styles.fileName}>📄 {item.fileName}</Text>
                  {item.notes && (
                    <Text style={styles.notes}>Notes: {item.notes}</Text>
                  )}
                  <Text style={styles.submittedDate}>
                    Submitted: {new Date(item.submittedAt).toLocaleString()}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}
      </View>

      {/* Back Button */}
      <TouchableOpacity
        style={styles.backButton}
        onPress={() => navigation.goBack()}
      >
        <Text style={styles.backButtonText}>Back</Text>
      </TouchableOpacity>

      {/* File Details Modal */}
      <Modal
        visible={modalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>File Details</Text>
              <TouchableOpacity
                onPress={() => setModalVisible(false)}
                style={styles.closeButton}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody}>
              {selectedFile && (
                <>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>File Name:</Text>
                    <Text style={styles.modalValue}>
                      {selectedFile.fileName}
                    </Text>
                  </View>

                  {/* Show message if file URL is not available */}
                  {!selectedFile.fileUrl && (
                    <View style={styles.modalRow}>
                      <Text style={styles.warningText}>
                        ⚠️ File was uploaded before file viewing was enabled.
                        Please upload the file again to view it.
                      </Text>
                    </View>
                  )}

                  {/* Show image if it's an image file */}
                  {selectedFile.fileUrl &&
                    selectedFile.fileType &&
                    isImageFile(selectedFile.fileType) && (
                      <View style={styles.imageContainer}>
                        <Image
                          source={{ uri: selectedFile.fileUrl }}
                          style={styles.previewImage}
                          resizeMode="contain"
                          onError={(e) => {
                            console.error("Image load error:", e);
                            Alert.alert(
                              "Error",
                              "Failed to load image. Please check the server connection."
                            );
                          }}
                        />
                      </View>
                    )}

                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Submitted By:</Text>
                    <Text style={styles.modalValue}>
                      {selectedFile.username}
                    </Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Submitted At:</Text>
                    <Text style={styles.modalValue}>
                      {new Date(selectedFile.submittedAt).toLocaleString()}
                    </Text>
                  </View>
                  {selectedFile.notes && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Notes:</Text>
                      <Text style={styles.modalValue}>
                        {selectedFile.notes}
                      </Text>
                    </View>
                  )}

                  {/* View File Button for non-images */}
                  {selectedFile.fileUrl &&
                    selectedFile.fileType &&
                    !isImageFile(selectedFile.fileType) && (
                      <TouchableOpacity
                        style={styles.viewFileButton}
                        onPress={() =>
                          openFile(
                            selectedFile.fileUrl,
                            selectedFile.fileType,
                            selectedFile.fileName
                          )
                        }
                      >
                        <Text style={styles.viewFileButtonText}>
                          {isPdfFile(selectedFile.fileType)
                            ? "📄 View PDF"
                            : "📎 Open File"}
                        </Text>
                      </TouchableOpacity>
                    )}
                </>
              )}
            </ScrollView>
            <TouchableOpacity
              style={styles.modalCloseBtn}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.modalCloseBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* PDF Viewer Modal */}
      <Modal
        visible={pdfViewerVisible}
        animationType="slide"
        onRequestClose={() => setPdfViewerVisible(false)}
      >
        <View style={styles.pdfViewerContainer}>
          <View style={styles.pdfViewerHeader}>
            <Text style={styles.pdfViewerTitle}>PDF Viewer</Text>
            <TouchableOpacity
              onPress={() => setPdfViewerVisible(false)}
              style={styles.closePdfButton}
            >
              <Text style={styles.closePdfButtonText}>✕ Close</Text>
            </TouchableOpacity>
          </View>
          {pdfUrl && (
            <WebView
              source={{ uri: pdfUrl }}
              style={styles.webview}
              startInLoadingState={true}
              renderLoading={() => (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#007bff" />
                  <Text style={styles.loadingText}>Loading PDF...</Text>
                </View>
              )}
              onError={(syntheticEvent) => {
                const { nativeEvent } = syntheticEvent;
                console.error("WebView error:", nativeEvent);
                Alert.alert(
                  "Error",
                  "Failed to load PDF. Please check your connection."
                );
              }}
            />
          )}
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ffffff",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "white",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
    color: "#333",
  },
  description: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  deadline: {
    fontSize: 13,
    color: "#007bff",
    fontWeight: "600",
  },
  content: {
    flex: 1,
    padding: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  submissionCard: {
    backgroundColor: "white",
    padding: 15,
    borderRadius: 10,
    marginBottom: 12,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  submissionInfo: {
    marginRight: 10,
  },
  submitterName: {
    fontSize: 15,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 5,
  },
  fileName: {
    fontSize: 13,
    color: "#666",
    marginBottom: 5,
  },
  notes: {
    fontSize: 12,
    color: "#999",
    fontStyle: "italic",
    marginBottom: 8,
  },
  submittedDate: {
    fontSize: 11,
    color: "#bbb",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  backButton: {
    backgroundColor: "#ff3d00",
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: "center",
    margin: 15,
    borderRadius: 8,
  },
  backButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
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
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 24,
    color: "#999",
    fontWeight: "bold",
  },
  modalBody: {
    padding: 20,
    maxHeight: 400,
  },
  modalRow: {
    marginBottom: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#666",
    marginBottom: 5,
  },
  modalValue: {
    fontSize: 16,
    color: "#333",
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  modalCloseBtn: {
    backgroundColor: "#ff3d00",
    padding: 15,
    borderBottomLeftRadius: 15,
    borderBottomRightRadius: 15,
    alignItems: "center",
  },
  modalCloseBtnText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  imageContainer: {
    width: "100%",
    alignItems: "center",
    marginVertical: 15,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    padding: 10,
  },
  previewImage: {
    width: screenWidth * 0.75,
    height: screenHeight * 0.4,
    borderRadius: 8,
  },
  viewFileButton: {
    backgroundColor: "#ff3d00",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  viewFileButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  warningText: {
    fontSize: 14,
    color: "#ff9800",
    backgroundColor: "#fff3e0",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  pdfViewerContainer: {
    flex: 1,
    backgroundColor: "#fff",
  },
  pdfViewerHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 15,
    paddingTop: 50,
    backgroundColor: "#007bff",
    elevation: 3,
  },
  pdfViewerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
  },
  closePdfButton: {
    padding: 8,
  },
  closePdfButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  webview: {
    flex: 1,
  },
  loadingContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    color: "#666",
  },
});

export default SubmissionDetails;
