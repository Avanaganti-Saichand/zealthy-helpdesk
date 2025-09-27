import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  FlatList,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Linking,
} from "react-native";
import axios from "axios";

// const API_BASE = "http://localhost:4000"; // LOCAL testing

const API_BASE = "https://zealthy-helpdesk-m8le.onrender.com";

export default function AdminScreen() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [status, setStatus] = useState("");

  const load = async () => {
    const { data } = await axios.get(`${API_BASE}/api/tickets`);
    setTickets(data);
  };

  useEffect(() => {
    load();
  }, []);

  const save = async () => {
    if (!selected) return;
    try {
      const body = {};
      if (status) body.status = status.trim();
      if (adminResponse) body.admin_response = adminResponse.trim();

      const { data } = await axios.patch(
        `${API_BASE}/api/tickets/${selected.id}`,
        body,
        { headers: { "Content-Type": "application/json" } }
      );
      setSelected(data);
      setAdminResponse("");
      setStatus("");
      await load();
      Alert.alert("Saved", "Ticket updated.");
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update ticket.");
    }
  };

  if (selected) {
    const fullAttachmentUrl = selected.attachment_url
      ? `${API_BASE}${selected.attachment_url}`
      : null;

    return (
      <View style={styles.container}>
        <Button title="← Back to list" onPress={() => setSelected(null)} />
        <Text style={styles.title}>Ticket #{selected.id}</Text>
        <Text>Name: {selected.name}</Text>
        <Text>Email: {selected.email}</Text>
        <Text>Status: {selected.status}</Text>
        <Text>Description: {selected.description}</Text>

        {fullAttachmentUrl ? (
          <View style={{ marginTop: 10, gap: 8 }}>
            <Text style={{ fontWeight: "600" }}>Attachment:</Text>
            <Image
              source={{ uri: fullAttachmentUrl }}
              style={{
                width: 260,
                height: 260,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: "#ddd",
              }}
              resizeMode="cover"
            />
            <Button
              title="Open Attachment"
              onPress={() => Linking.openURL(fullAttachmentUrl)}
            />
          </View>
        ) : null}

        <TextInput
          style={[styles.input, { height: 100 }]}
          placeholder="Add admin response"
          value={adminResponse}
          onChangeText={setAdminResponse}
          multiline
        />
        <TextInput
          style={styles.input}
          placeholder="Set status: new | in_progress | resolved"
          value={status}
          onChangeText={setStatus}
        />
        <Button title="Save" onPress={save} />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Admin — Tickets</Text>
      <Button title="Refresh" onPress={load} />
      <FlatList
        data={tickets}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => setSelected(item)}
          >
            <Text style={{ fontWeight: "bold" }}>
              #{item.id} — {item.name}
            </Text>
            <Text>{item.email}</Text>
            <Text>Status: {item.status}</Text>
            <Text numberOfLines={2}>{item.description}</Text>
          </TouchableOpacity>
        )}
      />
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
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 12,
    marginVertical: 6,
  },
});
