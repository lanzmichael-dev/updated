import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Image,
} from "react-native";
import { globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000"; // Your local server IP

const UserDashboard = ({ navigation, route }) => {
  const { user } = route.params;
  const [folders, setFolders] = useState([]);
  const [submissions, setSubmissions] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const fRes = await fetch(`${API_URL}/folders/${user.department}`);
      const sRes = await fetch(`${API_URL}/user-submissions/${user.username}`);
      const fData = await fRes.json();
      const sData = await sRes.json();
      if (fData.success) setFolders(fData.folders);
      if (sData.success) setSubmissions(sData.submissions);
    };

    fetchData();
    const unsubscribe = navigation.addListener("focus", fetchData);
    return unsubscribe;
  }, [navigation]);

  const isSubmitted = (id) => submissions.some((s) => s.folderId === id);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Image
            source={require("../../assets/images/translogo.png")}
            style={styles.headerLogo}
          />
          <View>
            <Text style={styles.welcome}>Student Portal</Text>
            <Text style={styles.name}>{user.name}</Text>
            <Text style={styles.dept}>{user.department}</Text>
          </View>
        </View>
        <TouchableOpacity onPress={() => navigation.replace("Login")}>
          <Text style={styles.logout}>Logout</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        <FlatList
          data={folders}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => {
            const done = isSubmitted(item._id);
            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate("FolderUpload", {
                    folder: item,
                    user,
                    done,
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>📁 {item.name}</Text>
                  <Text style={styles.cardDate}>
                    Due: {new Date(item.deadline).toLocaleDateString()}
                  </Text>
                </View>
                <View
                  style={[
                    styles.badge,
                    { backgroundColor: done ? "#28a745" : "#ffc107" },
                  ]}
                >
                  <Text style={styles.statusText}>
                    {done ? "Submitted" : "Not Yet"}
                  </Text>
                </View>
              </TouchableOpacity>
            );
          }}
        />
      </View>
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
    marginRight: 6,
  },
  welcome: { fontSize: 12, color: "white" },
  name: { fontSize: 18, fontWeight: "bold", color: "white" },
  dept: { fontSize: 11, color: "#f2760a", fontWeight: "bold", marginBottom: 8 },
  logout: {
    color: "#c15e0e",
    fontWeight: "bold",
  },
  content: { flex: 1, padding: 20 },
  card: {
    flexDirection: "row",
    backgroundColor: "#e8e8e8",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold" },
  cardDate: { fontSize: 12, color: "gray" },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 5 },
  statusText: { color: "white", fontSize: 10, fontWeight: "bold" },
});

export default UserDashboard;
