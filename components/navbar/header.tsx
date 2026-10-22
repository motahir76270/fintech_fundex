import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    StyleSheet,
    Text,
    TouchableOpacity,
    useColorScheme,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


export default function HeaderSection({ title }:any) {
  const router = useRouter();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";

  const headerColor = isDark ? "#032834" : "#350083";

  return (
    <SafeAreaView style={[styles.header, { backgroundColor: headerColor }]}>
      <TouchableOpacity onPress={() => router.back()}>
        <Ionicons name="arrow-back" size={24} color="#fff" />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{title}</Text>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 16,
    paddingBottom:-10
  },
  headerTitle: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "600",
    marginLeft: 16,
  },
});