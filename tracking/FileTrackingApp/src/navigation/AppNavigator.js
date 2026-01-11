import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import LoginScreen from "../screens/LoginScreen";
import AdminDashboard from "../screens/AdminDashboard";
import SemiAdminDashboard from "../screens/SemiAdminDashboard";
import UserDashboard from "../screens/UserDashboard";
import FolderUpload from "../screens/FolderUpload";
import FolderDetailsScreen from "../screens/FolderDetailsScreen";
import SubmissionDetails from "../screens/SubmissionDetails";
import DepartmentFolders from "../screens/DepartmentFolders";
import UsersManagement from "../screens/UsersManagement";

const Stack = createStackNavigator();

const AppNavigator = () => {
  return (
    <Stack.Navigator initialRouteName="Login">
      <Stack.Screen
        name="Login"
        component={LoginScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="AdminDashboard"
        component={AdminDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SemiAdminDashboard"
        component={SemiAdminDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UserDashboard"
        component={UserDashboard}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FolderUpload"
        component={FolderUpload}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="FolderUploadDetail"
        component={FolderDetailsScreen}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="SubmissionDetails"
        component={SubmissionDetails}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="DepartmentFolders"
        component={DepartmentFolders}
        options={{ headerShown: false }}
      />
      <Stack.Screen
        name="UsersManagement"
        component={UsersManagement}
        options={{ headerShown: false }}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
