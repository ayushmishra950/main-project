// components/groups/CreateGroupModal.tsx

import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Modal, StyleSheet, Image, ScrollView, Alert, ActivityIndicator} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import {createGroup} from "@/service/group";

import { Colors, Typography, BorderRadius } from "@/constants/theme";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface Props {
  visible: boolean;
  onClose: () => void;
  onSubmit?: (data: any) => void;
}

export default function CreateGroupModal({
  visible,
  onClose,
  onSubmit,
}: Props) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [images, setImages] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // PICK IMAGES
  const pickImages = async () => {
    try {
      if (images.length >= 4) {
        Alert.alert("Limit Reached", "Maximum 4 images allowed.");
        return;
      }

      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();

      if (!permission.granted) {
        Alert.alert("Permission required");
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.7,
        allowsMultipleSelection: true,
        selectionLimit: 4 - images.length,
      });

      if (!result.canceled) {
        const selected = result.assets;

        setImages((prev) => [...prev, ...selected].slice(0, 4));
      }
    } catch (error) {
      console.log(error);
    }
  };

  // REMOVE IMAGE
  const removeImage = (index: number) => {
    const updated = [...images];
    updated.splice(index, 1);
    setImages(updated);
  };

  // SUBMIT
  const handleCreateGroup = async () => {
    const userData = await AsyncStorage.getItem("user");
    const userId = userData ? JSON.parse(userData)?._id : null;
    if (!title.trim()) {
      Alert.alert("Title is required");
      return;
    }

    if (!description.trim()) {
      Alert.alert("Description is required");
      return;
    }

    try {
      setLoading(true);

    const formData = new FormData();
    formData.append("title",title );
    formData.append("description",description );
    formData.append("createdBy",userId );
   images.forEach((file: any, index: number) => { 
  formData.append("media", {
    uri: file.uri,
    name: file.fileName || `image-${index}.jpg`,
    type: file.mimeType || "image/jpeg",
  } as any);
});
   const res = await createGroup(formData);
   
   if(res.status === 201 || res.status === 200){
    Alert.alert("Group Created Successfully.", res?.data?.message);
       setTitle("");
      setDescription("");
      setImages([]);
      onClose();
   }
    } catch (error:any) {
      console.log(error?.reponse?.data?.message);
      Alert.alert("Group Create Failed.", error?.response?.data?.message || error?.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* HEADER */}
          <View style={styles.header}>
            <Text style={styles.heading}>Create Group</Text>

            <TouchableOpacity onPress={onClose}>
              <Ionicons name="close" size={24} color="#fff" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false}>
            {/* TITLE */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Group Title</Text>

              <TextInput
                placeholder="Enter group title"
                placeholderTextColor="#777"
                value={title}
                onChangeText={setTitle}
                style={styles.input}
              />
            </View>

            {/* DESCRIPTION */}
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Description</Text>

              <TextInput
                placeholder="Enter group description"
                placeholderTextColor="#777"
                value={description}
                onChangeText={setDescription}
                multiline
                textAlignVertical="top"
                style={[styles.input, styles.textArea]}
              />
            </View>

            {/* IMAGE PICKER */}
            <View style={styles.inputWrapper}>
              <View style={styles.imageTopRow}>
                <Text style={styles.label}>Images</Text>

                <Text style={styles.countText}>
                  {images.length}/4
                </Text>
              </View>

              <TouchableOpacity
                style={styles.imagePicker}
                onPress={pickImages}
              >
                <Ionicons
                  name="image-outline"
                  size={28}
                  color={Colors.primary}
                />

                <Text style={styles.pickText}>
                  Select Images
                </Text>
              </TouchableOpacity>

              {/* PREVIEW */}
              <View style={styles.previewContainer}>
                {images.map((img, index) => (
                  <View key={index} style={styles.previewWrapper}>
                    <Image
                      source={{ uri: img.uri }}
                      style={styles.previewImage}
                    />

                    <TouchableOpacity
                      style={styles.removeBtn}
                      onPress={() => removeImage(index)}
                    >
                      <Ionicons
                        name="close"
                        size={14}
                        color="#fff"
                      />
                    </TouchableOpacity>
                  </View>
                ))}
              </View>
            </View>

            {/* BUTTON */}
            <TouchableOpacity
              disabled={loading}
              onPress={handleCreateGroup}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={ loading ? ["#666", "#666"] : Colors.gradients.primary }
                style={styles.button}
                 >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text style={styles.buttonText}>
                    Create Group
                  </Text>
                )}
              </LinearGradient>
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "flex-end",
  },

  container: {
    backgroundColor: Colors.dark.bg,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    maxHeight: "90%",
  },

  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },

  heading: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "700",
  },

  inputWrapper: {
    marginBottom: 18,
  },

  label: {
    color: "#fff",
    marginBottom: 10,
    fontSize: Typography.fontSizes.base,
    fontWeight: "600",
  },

  input: {
    backgroundColor: Colors.dark.surface,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 14,
    color: "#fff",
    fontSize: 15,
  },

  textArea: {
    height: 120,
  },

  imagePicker: {
    height: 120,
    borderWidth: 1.5,
    borderColor: Colors.primary,
    borderStyle: "dashed",
    borderRadius: 18,
    justifyContent: "center",
    alignItems: "center",
    gap: 10,
  },

  pickText: {
    color: Colors.primary,
    fontWeight: "600",
  },

  previewContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 14,
  },

  previewWrapper: {
    position: "relative",
  },

  previewImage: {
    width: 72,
    height: 72,
    borderRadius: 14,
  },

  removeBtn: {
    position: "absolute",
    top: -6,
    right: -6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: "red",
    alignItems: "center",
    justifyContent: "center",
  },

  imageTopRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },

  countText: {
    color: Colors.gray400,
    fontSize: 13,
  },

  button: {
    paddingVertical: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 10,
    marginBottom: 30,
  },

  buttonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});