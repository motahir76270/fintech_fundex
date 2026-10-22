import React from "react";
import { TouchableOpacity, Text, View, StyleSheet } from "react-native";

export default function ReportButton({ title, icon, onPress }:any) {
  return (
    <TouchableOpacity style={styles.card} activeOpacity={0.8} onPress={onPress}>
      <View style={styles.iconContainer}>{icon}</View>
      <Text style={styles.label}>{title}</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "30%",
    backgroundColor: "#fff",
    borderRadius: 16,
    height: 120,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 15,
    elevation: 3,
  },
  iconContainer: {
    backgroundColor: "#0B76A8",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  label: {
    fontSize: 13,
    fontWeight: "500",
    color: "#0B76A8",
    textAlign: "center",
  },
});
