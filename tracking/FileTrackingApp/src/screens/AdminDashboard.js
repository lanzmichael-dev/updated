import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { colors, globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000";

const AdminDashboard = ({ navigation, route }) => {
  const { user } = route.params;
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      const res = await fetch(`${API_URL}/semiadmin-departments`);
      const data = await res.json();
      if (data.success) {
        setDepartments(data.departments);
      }
    } catch (error) {
      console.error("Error fetching departments:", error);
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
      <View style={styles.header}>
        <Image
          source={require("../../assets/images/translogo.png")}
          style={styles.headerLogo}
        />
        <View>
          <Text style={styles.welcome}>welcome back</Text>
          <Text style={styles.name}>{user.name}</Text>
          <Text style={styles.role}>Admin</Text>
        </View>
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <TouchableOpacity
          style={styles.menuCard}
          onPress={() => navigation.navigate("UsersManagement")}
        >
          <Text style={styles.menuCardTitle}>👥 Manage Users</Text>
          <Text style={styles.menuCardSubtitle}>
            View and create user accounts
          </Text>
        </TouchableOpacity>

        <Text style={styles.sectionTitle}>Departments</Text>

        {departments.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No departments found</Text>
          </View>
        ) : (
          <FlatList
            data={departments}
            keyExtractor={(item, index) => item + index}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("DepartmentFolders", { department: item })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>🏢 {item}</Text>
                  <Text style={styles.cardSubtitle}>View folders</Text>
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
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ffffff",
  },
  header: {
    flexDirection: "row",
    paddingTop: 50,
    paddingHorizontal: 12,
    backgroundColor: "#242323",
    elevation: 0,
    alignItems: "center",
  },
  headerLogo: {
    width: 60,
    height: 60,
    opacity: 1,
    marginRight: 6,
  },
  welcome: { fontSize: 12, color: "white" },
  name: { fontSize: 18, fontWeight: "bold", color: "white" },
  role: { fontSize: 11, color: "#f2760a", fontWeight: "bold", marginBottom: 8 },
  logout: {
    color: "#c15e0e",
    fontWeight: "bold",
    marginTop: 10,
    marginLeft: 120,
  },
  content: { flex: 1, padding: 20 },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "bold",
    marginBottom: 15,
    color: "#333",
  },
  card: {
    flexDirection: "row",
    backgroundColor: "white",
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
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardSubtitle: { fontSize: 12, color: "#666", marginTop: 3 },
  arrow: { fontSize: 24, color: "#999" },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
  },
  menuCard: {
    backgroundColor: "#ff3d00",
    padding: 20,
    borderRadius: 10,
    marginBottom: 20,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  menuCardTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "white",
    marginBottom: 5,
  },
  menuCardSubtitle: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
  },
});

export default AdminDashboard;
