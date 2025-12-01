import React from "react";
import { StyleSheet, View, Text, Pressable } from "react-native";
import { StatusBar } from "expo-status-bar";

export default function App() {
  return (
    <View style={styles.container}>
      <StatusBar style="light" hidden />
      <Text style={styles.title}>StreamPlayer</Text>
      <Text style={styles.subtitle}>Video Player for Android TV</Text>
      
      <Pressable style={styles.button}>
        <Text style={styles.buttonText}>Play Sample Video</Text>
      </Pressable>
      
      <Pressable style={[styles.button, styles.secondaryButton]}>
        <Text style={styles.buttonText}>Settings</Text>
      </Pressable>

      <View style={styles.info}>
        <Text style={styles.infoTitle}>Features:</Text>
        <Text style={styles.infoText}>- Playback controls</Text>
        <Text style={styles.infoText}>- Stremio integration</Text>
        <Text style={styles.infoText}>- Android TV support</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 48,
    fontWeight: "700",
    color: "#E50914",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 18,
    color: "#CCCCCC",
    marginBottom: 40,
  },
  button: {
    backgroundColor: "#E50914",
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 8,
    marginVertical: 12,
    minWidth: 200,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: "#333333",
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  info: {
    marginTop: 40,
    backgroundColor: "#1C1C1C",
    padding: 20,
    borderRadius: 8,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#FFFFFF",
    marginBottom: 12,
  },
  infoText: {
    fontSize: 14,
    color: "#AAAAAA",
    marginBottom: 8,
  },
});
