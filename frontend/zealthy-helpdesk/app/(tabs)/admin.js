import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
  Image,
  Linking,
  ScrollView,
  Pressable,
  RefreshControl,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Picker } from "@react-native-picker/picker";
import axios from "axios";

const API_BASE = "https://zealthy-helpdesk-m8le.onrender.com";

function PrimaryButton({ title, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        styles.btn,
        pressed && { transform: [{ scale: 0.98 }] },
      ]}
    >
      <Text style={styles.btnText}>{title}</Text>
    </Pressable>
  );
}

export default function AdminScreen() {
  const [tickets, setTickets] = useState([]);
  const [selected, setSelected] = useState(null);
  const [adminResponse, setAdminResponse] = useState("");
  const [status, setStatus] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const load = async () => {
    const { data } = await axios.get(`${API_BASE}/api/tickets`);
    setTickets(data);
  };

  useEffect(() => {
    load();
  }, []);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await load();
    } finally {
      setRefreshing(false);
    }
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

      if (body.status) {
        Alert.alert("Updated", `Status changed to "${data.status}".`);
      } else {
        Alert.alert("Saved", "Ticket updated.");
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Error", "Could not update ticket.");
    }
  };

  // ---------- DETAIL (scrollable) ----------
  if (selected) {
    const fullAttachmentUrl = selected.attachment_url
      ? `${API_BASE}${selected.attachment_url}`
      : null;

    return (
      <SafeAreaView
        style={{ flex: 1, backgroundColor: "#f6f7fb" }}
        edges={["top"]}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <View style={styles.card}>
            <PrimaryButton
              title="← Back to list"
              onPress={() => setSelected(null)}
            />

            <Text style={styles.title}>Ticket #{selected.id}</Text>
            <Text style={styles.meta}>
              <Text style={styles.metaKey}>Name:</Text> {selected.name}
            </Text>
            <Text style={styles.meta}>
              <Text style={styles.metaKey}>Email:</Text> {selected.email}
            </Text>
            <Text style={styles.meta}>
              <Text style={styles.metaKey}>Status:</Text> {selected.status}
            </Text>

            <Text style={[styles.metaKey, { marginTop: 8 }]}>Description</Text>
            <Text style={styles.desc}>{selected.description}</Text>

            {fullAttachmentUrl ? (
              <View style={{ marginTop: 12, gap: 8 }}>
                <Text style={styles.metaKey}>Attachment</Text>
                <Image
                  source={{ uri: fullAttachmentUrl }}
                  style={{
                    width: "100%",
                    height: 260,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: "#e6e6e6",
                  }}
                  resizeMode="cover"
                />
                <PrimaryButton
                  title="Open Attachment"
                  onPress={() => Linking.openURL(fullAttachmentUrl)}
                />
              </View>
            ) : null}

            <Text style={[styles.metaKey, { marginTop: 16 }]}>
              Admin response
            </Text>
            <TextInput
              style={[styles.input, { height: 100 }]}
              placeholder="Write a reply to the user…"
              value={adminResponse}
              onChangeText={setAdminResponse}
              multiline
            />

            <Text style={[styles.metaKey, { marginTop: 12 }]}>
              Change status
            </Text>
            <View style={styles.pickerWrap}>
              <Picker
                selectedValue={status || selected.status}
                onValueChange={(val) => setStatus(val)}
                dropdownIconColor="#111"
              >
                <Picker.Item label="New" value="new" />
                <Picker.Item label="In Progress" value="in_progress" />
                <Picker.Item label="Resolved" value="resolved" />
              </Picker>
            </View>

            <PrimaryButton title="Save" onPress={save} />
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  // ---------- LIST (TOP-LEVEL FLATLIST, scrolls) ----------
  return (
    <SafeAreaView
      style={{ flex: 1, backgroundColor: "#f6f7fb" }}
      edges={["top"]}
    >
      <FlatList
        style={{ flex: 1 }}
        contentContainerStyle={styles.listContainer}
        data={tickets}
        keyExtractor={(item) => String(item.id)}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListHeaderComponent={
          <View style={[styles.card, { marginBottom: 10 }]}>
            <Text style={styles.title}>Admin — Tickets</Text>
            <PrimaryButton title="Refresh" onPress={load} />
          </View>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.listItem}
            onPress={() => setSelected(item)}
          >
            <View
              style={{ flexDirection: "row", justifyContent: "space-between" }}
            >
              <Text style={{ fontWeight: "700" }}>
                #{item.id} — {item.name}
              </Text>
              <Text style={styles.statusBadge}>
                {item.status === "in_progress"
                  ? "In Progress"
                  : item.status === "resolved"
                  ? "Resolved"
                  : "New"}
              </Text>
            </View>
            <Text style={{ color: "#666" }}>{item.email}</Text>
            <Text numberOfLines={2} style={{ marginTop: 4 }}>
              {item.description}
            </Text>
          </TouchableOpacity>
        )}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  listContainer: { padding: 16 },
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
  },
  title: { fontSize: 22, fontWeight: "700" },
  meta: { marginTop: 6, color: "#333" },
  metaKey: { fontWeight: "700", color: "#111" },
  desc: { marginTop: 6, lineHeight: 20, color: "#222" },
  input: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    padding: 10,
  },
  pickerWrap: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    overflow: "hidden",
    backgroundColor: "#fff",
    marginBottom: 12,
  },
  listItem: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#eee",
    borderRadius: 12,
    padding: 12,
  },
  statusBadge: {
    backgroundColor: "#eef2ff",
    color: "#1d4ed8",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    fontSize: 12,
    overflow: "hidden",
  },
  btn: {
    backgroundColor: "#3b82f6",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 8,
  },
  btnText: { color: "#fff", fontWeight: "700" },
});
