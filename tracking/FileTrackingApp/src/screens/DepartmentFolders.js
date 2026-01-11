import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
} from "react-native";

const API_URL = "http://192.168.1.245:3000";

const DepartmentFolders = ({ navigation, route }) => {
  const { department } = route.params;
  const [folders, setFolders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFolders();
  }, []);

  const fetchFolders = async () => {
    try {
      const res = await fetch(`${API_URL}/folders/${department}`);
      const data = await res.json();
      if (data.success) {
        setFolders(data.folders);
      }
    } catch (error) {
      console.error("Error fetching folders:", error);
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
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backText}>‹ Back</Text>
        </TouchableOpacity>
        <View style={styles.backBtn} />
      </View>

      <View style={styles.header}>
        <View>
          <Text style={styles.title}>📁 {department}</Text>
          <Text style={styles.subtitle}>Folders ({folders.length})</Text>
        </View>
      </View>

      <View style={styles.content}>
        {folders.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No folders found</Text>
          </View>
        ) : (
          <FlatList
            data={folders}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("SubmissionDetails", { folder: item })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>📁 {item.name}</Text>
                  <Text style={styles.cardDate}>
                    Deadline: {new Date(item.deadline).toLocaleDateString()}
                  </Text>
                  {item.description && (
                    <Text style={styles.cardDesc} numberOfLines={2}>
                      {item.description}
                    </Text>
                  )}
                </View>
                <Text style={styles.arrow}>›</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingTop: Platform.OS === "ios" ? 60 : 50,
    paddingBottom: 20,
    paddingHorizontal: 8,
  },
  backBtn: { width: 70 },
  backText: { color: "#007aff", fontWeight: "600" },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#242323",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
    elevation: 2,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 5,
    color: "white",
  },
  subtitle: {
    fontSize: 14,
    color: "#f2760a",
  },
  content: { flex: 1, padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.22,
    shadowRadius: 2.22,
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", marginBottom: 5 },
  cardDate: { fontSize: 12, color: "red", marginBottom: 5 },
  cardDesc: { fontSize: 12, color: "#666" },
  arrow: { fontSize: 24, color: "#999", marginLeft: 10 },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
});

export default DepartmentFolders;
