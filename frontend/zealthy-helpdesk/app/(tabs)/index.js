import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  Button,
  Image,
  Alert,
  Platform,
  ActivityIndicator,
} from "react-native";
import * as ImagePicker from "expo-image-picker";

// const API_BASE = "http://localhost:4000"; // LOCAL testing

const API_BASE = "https://zealthy-helpdesk-m8le.onrender.com";

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
          // Convert blob: URL to real File on web
          const resp = await fetch(photo.uri);
          const blob = await resp.blob();
          const file = new File([blob], photo.fileName, {
            type: photo.mimeType,
          });
          form.append("attachment", file, photo.fileName);
        } else {
          // Native
          form.append("attachment", {
            uri: photo.uri,
            name: photo.fileName,
            type: photo.mimeType,
          });
        }
      }

      // IMPORTANT: don't set Content-Type; browser/native will add boundary
      const res = await fetch(`${API_BASE}/api/tickets`, {
        method: "POST",
        body: form,
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
    <View style={styles.container}>
      <Text style={styles.title}>Submit a Ticket</Text>
      <TextInput
        style={styles.input}
        placeholder="Name"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
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
          style={{ width: 160, height: 160, marginBottom: 8, borderRadius: 8 }}
        />
      )}

      <View style={{ gap: 8 }}>
        <Button title="Pick a Photo (optional)" onPress={pickImage} />
        {submitting ? (
          <View style={{ paddingVertical: 8 }}>
            <ActivityIndicator />
          </View>
        ) : (
          <Button title="Submit" onPress={submit} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, gap: 12, backgroundColor: "#f7f7f7" },
  title: { fontSize: 20, fontWeight: "600", marginVertical: 8 },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
});
