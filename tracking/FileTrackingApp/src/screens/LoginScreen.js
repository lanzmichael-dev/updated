import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Animated,
} from "react-native";
import { globalStyles } from "../styles/globalStyles";

const API_URL = "http://192.168.1.245:3000"; // Your local server IP

const LoginScreen = ({ navigation }) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showLoadingScreen, setShowLoadingScreen] = useState(false);
  const [showSplash, setShowSplash] = useState(true);
  const spinValue = new Animated.Value(0);
  const fadeValue = new Animated.Value(0);

  useEffect(() => {
    // Show splash screen with fade-in effect for 3 seconds
    Animated.timing(fadeValue, {
      toValue: 1,
      duration: 1500,
      useNativeDriver: true,
    }).start();

    const splashTimer = setTimeout(() => {
      Animated.timing(fadeValue, {
        toValue: 0,
        duration: 1000,
        useNativeDriver: true,
      }).start(() => {
        setShowSplash(false);
      });
    }, 3000);

    return () => clearTimeout(splashTimer);
  }, []);

  useEffect(() => {
    if (showLoadingScreen) {
      Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [showLoadingScreen]);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ["0deg", "360deg"],
  });

  const handleLogin = async () => {
    if (!username || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (data.success) {
        setShowLoadingScreen(true);
        // Wait 2 seconds to show loading screen before navigating
        setTimeout(() => {
          // Navigate based on user role
          if (data.user.role === "admin") {
            navigation.replace("AdminDashboard", { user: data.user });
          } else if (data.user.role === "semi-admin") {
            navigation.replace("SemiAdminDashboard", { user: data.user });
          } else {
            navigation.replace("UserDashboard", { user: data.user });
          }
        }, 2000);
      } else {
        Alert.alert("Login Failed", data.message || "Invalid credentials");
        setLoading(false);
      }
    } catch (error) {
      console.error(error);
      Alert.alert("Error", "Failed to connect to server");
      setLoading(false);
    } finally {
      if (!showLoadingScreen) {
        setLoading(false);
      }
    }
  };

  // Splash Screen
  if (showSplash) {
    return (
      <View style={styles.splashContainer}>
        <Animated.Image
          source={require("../../assets/images/logo_withname.png")}
          style={[
            styles.splashLogo,
            {
              opacity: fadeValue,
            },
          ]}
        />
      </View>
    );
  }

  // Loading Screen
  if (showLoadingScreen) {
    return (
      <View style={styles.loadingScreenContainer}>
        <Animated.Image
          source={require("../../assets/images/logo.png")}
          style={[
            styles.logo,
            {
              transform: [{ rotate: spin }],
            },
          ]}
        />
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Image
        source={require("../../assets/images/translogo.png")}
        style={styles.backgroundLogo}
      />
      <Image
        source={require("../../assets/images/translogo.png")}
        style={styles.topLogo}
      />
      <View style={styles.loginBox}>
        <Text style={styles.title}>ColTrace: File System </Text>
        <Text style={styles.subtitle}>Sign In</Text>

        <TextInput
          style={styles.input}
          placeholder="Username"
          value={username}
          onChangeText={setUsername}
          editable={!loading}
        />

        <TextInput
          style={styles.input}
          placeholder="Password"
          secureTextEntry
          value={password}
          onChangeText={setPassword}
          editable={!loading}
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleLogin}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? "Signing In..." : "Sign In"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#ff533171",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  loginBox: {
    backgroundColor: "white",
    padding: 30,
    borderRadius: 10,
    elevation: 5,
    width: "100%",
    maxWidth: 400,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 10,
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    textAlign: "center",
    marginBottom: 30,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    marginBottom: 15,
    borderRadius: 5,
    fontSize: 14,
  },
  button: {
    backgroundColor: "#ff3d00",
    padding: 15,
    borderRadius: 5,
    alignItems: "center",
    marginTop: 10,
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "bold",
  },
  hint: {
    fontSize: 12,
    textAlign: "center",
    marginTop: 20,
    color: "#999",
  },
  loadingScreenContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#ff3d00",
    fontWeight: "bold",
  },
  splashContainer: {
    flex: 1,
    backgroundColor: "#ffffff",
    justifyContent: "center",
    alignItems: "center",
  },
  splashLogo: {
    width: 350,
    height: 350,
    resizeMode: "contain",
  },
  topLogo: {
    width: 220,
    height: 220,
    marginBottom: -105,
    zIndex: 10,
    resizeMode: "contain",
  },
  backgroundLogo: {
    position: "absolute",
    width: 1500,
    height: 1500,
    opacity: 0.1,
    resizeMode: "contain",
  },
});

export default LoginScreen;
