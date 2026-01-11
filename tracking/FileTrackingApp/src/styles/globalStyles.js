import { StyleSheet } from "react-native";

export const colors = {
  primary: "#ff3d00",
  secondary: "#4CAF50",
  danger: "#F44336",
  warning: "#FF9800",
  white: "#FFFFFF",
  black: "#000000",
  gray: "#9E9E9E",
  lightGray: "#F5F5F5",
};

export const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  card: {
    backgroundColor: colors.white,
    borderRadius: 8,
    padding: 15,
    marginVertical: 8,
    marginHorizontal: 15,
    elevation: 3,
    shadowColor: colors.black,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  button: {
    backgroundColor: colors.primary,
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginVertical: 10,
    marginHorizontal: 15,
  },
  buttonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "bold",
  },
  input: {
    borderWidth: 1,
    borderColor: colors.gray,
    borderRadius: 8,
    padding: 12,
    marginVertical: 8,
    marginHorizontal: 15,
    fontSize: 16,
  },
});
