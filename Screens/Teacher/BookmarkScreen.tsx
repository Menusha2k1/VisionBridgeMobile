import React, { useEffect, useState } from "react";
import { ScrollView, Text, StyleSheet, Platform, View } from "react-native";
import Screen from "./components/layout/Screen";
import PageHeader from "./components/layout/PageHeader";
import Card from "./components/ui/Card";
import Button from "./components/ui/Button";

export default function BookmarkScreen() {
  const [bookmarks, setBookmarks] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const baseUrl =
    Platform.OS === "web"
      ? "http://localhost:3000"
      : "http://10.0.2.2:3000";

  useEffect(() => {
    fetchBookmarks();
  }, []);

  const fetchBookmarks = async () => {
    try {
      const res = await fetch(`${baseUrl}/api/bookmarks/all`);
      const data = await res.json();
      setBookmarks(data.bookmarks || []);
    } catch (err) {
      console.error("Fetch bookmarks error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await fetch(`${baseUrl}/api/bookmarks/${id}`, { method: 'DELETE' });
      fetchBookmarks();
    } catch (err) {
      console.error("Delete error:", err);
    }
  };

  return (
    <Screen>
      <PageHeader
        title="All Bookmarked Scripts"
        subtitle="Manage your saved lesson segments"
      />

      <ScrollView contentContainerStyle={styles.container}>
        {loading ? (
          <Text style={styles.emptyText}>Loading...</Text>
        ) : bookmarks.length === 0 ? (
          <Text style={styles.emptyText}>No bookmarks found.</Text>
        ) : (
          bookmarks.map((b) => (
            <Card key={b.id} title={b.source_filename || "Unknown File"}>
              <View style={styles.infoRow}>
                <Text style={styles.label}>Pages:</Text>
                <Text style={styles.value}>{b.start_page} - {b.end_page}</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Text style={styles.label}>Created:</Text>
                <Text style={styles.value}>{new Date(b.created_at).toLocaleDateString()}</Text>
              </View>

              <View style={styles.buttonRow}>
                <Button 
                  title="Remove" 
                  onPress={() => handleDelete(b.id)} 
                />
              </View>
            </Card>
          ))
        )}
      </ScrollView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
    color: "#666",
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 4,
  },
  label: {
    fontWeight: "bold",
    width: 70,
  },
  value: {
    flex: 1,
  },
  buttonRow: {
    marginTop: 10,
    alignItems: 'flex-end'
  }
});