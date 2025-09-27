import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
  ScrollView,
  Pressable,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

const API_BASE = "https://zealthy-helpdesk-m8le.onrender.com";

function PrimaryButton({ title, onPress, disabled }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.btn,
        disabled && { opacity: 0.6 },
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

export default function SubmitScreen() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [desc, setDesc] = useState("");
  const [photo, setPhoto] = useState(null); // { uri, fileName, mimeType }
  const [submitting, setSubmitting] = useState(false);

  const pickImage = async () => {
    if (Platform.OS !== "web") {
      const { status } =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== "granted") {
        Alert.alert("Permission required", "We need access to your gallery.");
        return;
      }
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
    });
    if (!result.canceled) {
      const a = result.assets[0];
      setPhoto({
        uri: a.uri,
        fileName: a.fileName || "attachment.jpg",
        mimeType: a.mimeType || "image/jpeg",
      });
    }
  };

  const validate = () => {
    const n = name.trim();
    const e = email.trim();
    const d = desc.trim();
    if (!n || !e || !d) {
      Alert.alert(
        "Missing fields",
        "Name, Email, and Description are required."
      );
      return false;
    }
    if (n.length < 2) {
      Alert.alert("Invalid name", "Name should be at least 2 characters.");
      return false;
    }
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
    if (!emailOk) {
      Alert.alert("Invalid email", "Please enter a valid email address.");
      return false;
    }
    if (d.length < 10) {
      Alert.alert(
        "Too short",
        "Please describe the issue in at least 10 characters."
      );
      return false;
    }
    return { n, e, d };
  };

  const submit = async () => {
    if (submitting) return;
    const v = validate();
    if (!v) return;

    try {
      setSubmitting(true);
      const form = new FormData();
      form.append("name", v.n);
      form.append("email", v.e);
      form.append("description", v.d);

      if (photo) {
        if (Platform.OS === "web") {
          const resp = await fetch(photo.uri);
          const blob = await resp.blob();
          const file = new File([blob], photo.fileName, {
            type: photo.mimeType,
          });
          form.append("attachment", file, photo.fileName);
        } else {
          form.append("attachment", {
            uri: photo.uri,
            name: photo.fileName,
            type: photo.mimeType,
          });
        }
      }

      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: "POST",
        body: form, // let browser/native set Content-Type with boundary
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const msg =
          (data && (data.error || data.message)) || `HTTP ${res.status}`;
        Alert.alert("Error", `Submit failed: ${msg}`);
        return;
      }

      Alert.alert("Submitted ✅", "Your ticket has been submitted.");
      setName("");
      setEmail("");
      setDesc("");
      setPhoto(null);
    } catch (e) {
      console.error("submit error", e);
      Alert.alert("Error", "Could not submit ticket.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f6f7fb" }}
      edges={["top"]}
    >
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Submit a Ticket</Text>

          <Text style={styles.label}>Name</Text>
          <TextInput
            style={styles.input}
            placeholder="Your name"
            value={name}
            onChangeText={setName}
          />

          <Text style={styles.label}>Email</Text>
          <TextInput
            style={styles.input}
            placeholder="you@example.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />

          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, { height: 120 }]}
            placeholder="Describe the problem"
            value={desc}
            onChangeText={setDesc}
            multiline
          />

          {photo && (
            <Image
              source={{ uri: photo.uri }}
              style={{
                width: "100%",
                height: 220,
                marginBottom: 12,
                borderRadius: 12,
                borderWidth: 1,
                borderColor: "#e6e6e6",
              }}
              resizeMode="cover"
            />
          )}

          <View style={{ gap: 10 }}>
            <PrimaryButton
              title="Pick a Photo (optional)"
              onPress={pickImage}
            />
            {submitting ? (
              <View style={{ paddingVertical: 12 }}>
                <ActivityIndicator />
              </View>
            ) : (
              <PrimaryButton title="Submit Ticket" onPress={submit} />
            )}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    borderWidth: 1,
    borderColor: "#ececec",
    gap: 8,
  },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 8 },
  label: { fontSize: 13, color: "#555", marginTop: 6 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
  btn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
