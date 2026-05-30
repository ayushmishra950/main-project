import React, { useEffect, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, ScrollView, Image, Alert, ActivityIndicator, Switch} from "react-native";
import * as ImagePicker from "expo-image-picker";
import { Eye, EyeOff, Plus, Trash2, ChevronDown, ChevronUp } from "lucide-react-native";
import { getSingleUser, updateUser } from "@/service/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { StyleSheet } from "react-native";
// import { useToast } from "@/hooks/use-toast";

export default function UserDialog() {
    // const { toast } = useToast();
    const [user, setUser] = useState<any | null>();  
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const [showBusiness, setShowBusiness] = useState(false);
    const [accountType, setAccountType] = useState("user");

    const [formData, setFormData] = useState<any>({
        userId: user?._id,
        accountType: "user",
        type: "public",
        businesses: [],
        children: [],
    });

    const [errors, setErrors] = useState({ skills: "", hobbies: "" });

    const [preview, setPreview] = useState<any>({
        profileImage: "",
        coverImage: "",
        businessCoverImages: {} as Record<number, string>,
    });

    // Image Picker Function
    const pickImage = async (field: string, index?: number) => {
        const result = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 0.8,
        });

        if (!result.canceled && result.assets[0]) {
            const uri = result.assets[0].uri;

            if (field === "profileImage" || field === "coverImage") {
                setFormData({ ...formData, [field]: { uri, name: "image.jpg", type: "image/jpeg" } });
                setPreview({ ...preview, [field]: uri });
            } else if (field === "businessCoverImage" && index !== undefined) {
                const updatedBusinesses = [...formData.businesses];
                updatedBusinesses[index].businessCoverImage = { uri, name: "image.jpg", type: "image/jpeg" };
                setFormData({ ...formData, businesses: updatedBusinesses });

                setPreview({
                    ...preview,
                    businessCoverImages: { ...preview.businessCoverImages, [index]: uri },
                });
            }
        }
    };

    const handleChange = (name: string, value: any) => {
        if (name === "skills" || name === "hobbies") {
            const items = value.split(",").map((item: string) => item.trim()).filter(Boolean);
            if (items.length > 5) {
                setErrors({ ...errors, [name]: "Maximum 5 items allowed" });
                return;
            } else {
                setErrors({ ...errors, [name]: "" });
            }
        }
        setFormData({ ...formData, [name]: value });
    };

    const handleChildChange = (index: number, name: string, value: any) => {
        const updatedChildren = [...(formData.children || [])];
        updatedChildren[index] = {
            ...updatedChildren[index],
            [name]: name === "age" ? Number(value) : value
        };
        setFormData({ ...formData, children: updatedChildren });
    };

    const handleBusinessChange = (index: number, name: string, value: any) => {
        const updatedBusinesses = [...formData.businesses];
        updatedBusinesses[index][name] = value;
        setFormData({ ...formData, businesses: updatedBusinesses });
    };

    const addBusiness = () => {
        setFormData({
            ...formData,
            businesses: [
                ...formData.businesses,
                {
                    businessName: "",
                    businessCategory: "",
                    website: "",
                    businessDescription: "",
                    businessPhone: "",
                    workingHours: "",
                    businessAddress: "",
                    businessCoverImage: null,
                }
            ]
        });
    };

    const removeBusiness = (index: number) => {
        const updatedBusinesses = formData.businesses.filter((_: any, i: number) => i !== index);
        const updatedPreviews = { ...preview.businessCoverImages };
        delete updatedPreviews[index];

        setPreview({ ...preview, businessCoverImages: updatedPreviews });
        setFormData({ ...formData, businesses: updatedBusinesses });
    };

    const handleSubmit = async () => {
        try {
            setIsLoading(true);
            const form = new FormData();

            const finalUserId = user?._id || formData?.userId;
            if (finalUserId) form.append("userId", finalUserId);

            Object.keys(formData).forEach((key) => {
                const excluded = ["businesses", "userId", "_id", "friends", "isOnline", "lastSeen", "role", "blocked", "children"];
                if (!excluded.includes(key) && formData[key] !== undefined && formData[key] !== null) {
                    form.append(key, formData[key]);
                }
            });

            if (formData.children) {
                form.append("children", JSON.stringify(formData.children));
            }

            const businessesForJSON = formData.businesses.map((biz: any) => {
                const bizCopy = { ...biz };
                if (bizCopy.businessCoverImage?.uri) delete bizCopy.businessCoverImage;
                return bizCopy;
            });

            form.append("businesses", JSON.stringify(businessesForJSON));

            formData.businesses.forEach((biz: any, index: number) => {
                if (biz.businessCoverImage?.uri) {
                    form.append(`businessCoverImage_${index}`, {
                        uri: biz.businessCoverImage.uri,
                        name: "business_cover.jpg",
                        type: "image/jpeg",
                    } as any);
                }
            });

            const res = await updateUser(form);
            if (res.status === 200) {
                const updatedUser = res.data.user;
                if (updatedUser) localStorage.setItem("user", JSON.stringify(updatedUser));
                // toast({ title: "Profile Updated Successfully", description: res.data.message });
                handleGetUser();
            }
        } catch (err: any) {
            // toast({
            //     title: "Update Failed",
            //     description: err?.response?.data?.message || err.message,
            //     variant: "destructive"
            // });
        } finally {
            setIsLoading(false);
        }
    };

    const handleGetUser = async () => {
        try {
            const res = await getSingleUser(user?._id);
            if (res.status === 200) {
                const data = res?.data?.data || {};
                setFormData({
                    ...data,
                    businesses: data.businesses?.length > 0 ? data.businesses : [{}],
                });
                setAccountType(data?.accountType || "user");
                if (data.accountType === "business") setShowBusiness(true);
            }
        } catch (err) {
            console.log(err);
        }
    };

    useEffect(() => {
        handleGetUser();
    }, []);


    useEffect(() => {
      const getUser = async() => {
        const userData = await AsyncStorage.getItem("user");
        const user = userData ? JSON.parse(userData) : null;
        setUser(user);
      };

      if(user === null){
        getUser()
      }
    },[user]);

    // return (
    //     <ScrollView className="flex-1 bg-gray-50" contentContainerStyle={{ padding: 16 }}>
    //         <Text className="text-3xl font-semibold text-gray-900 mt-4">Profile Settings</Text>
    //         <Text className="text-gray-600 mt-1 mb-8">Update your personal and business information</Text>

    //         {/* Cover + Profile Image */}
    //         <View className="bg-white rounded-3xl overflow-hidden border border-gray-200 mb-6">
    //             <View className="h-56 bg-gradient-to-r from-blue-600 to-indigo-600 relative">
    //                 {preview.coverImage || formData.coverImage ? (
    //                     <Image
    //                         source={{ uri: preview.coverImage || formData.coverImage }}
    //                         className="w-full h-full"
    //                         resizeMode="cover"
    //                     />
    //                 ) : null}

    //                 <TouchableOpacity
    //                     onPress={() => pickImage("coverImage")}
    //                     className="absolute top-4 right-4 bg-white/90 px-4 py-2 rounded-2xl"
    //                 >
    //                     <Text className="font-medium">Change Cover</Text>
    //                 </TouchableOpacity>

    //                 <View className="absolute -bottom-12 left-6">
    //                     <View className="relative">
    //                         <View className="w-28 h-28 rounded-3xl border-4 border-white overflow-hidden bg-white">
    //                             {(preview.profileImage || formData.profileImage) ? (
    //                                 <Image
    //                                     source={{ uri: preview.profileImage || formData.profileImage }}
    //                                     className="w-full h-full"
    //                                     resizeMode="cover"
    //                                 />
    //                             ) : (
    //                                 <View className="w-full h-full bg-gray-200 items-center justify-center">
    //                                     <Text className="text-gray-400">No Photo</Text>
    //                                 </View>
    //                             )}
    //                         </View>
    //                         <TouchableOpacity
    //                             onPress={() => pickImage("profileImage")}
    //                             className="absolute bottom-1 right-1 bg-white p-2 rounded-full shadow"
    //                         >
    //                             <Text>📸</Text>
    //                         </TouchableOpacity>
    //                     </View>
    //                 </View>
    //             </View>
    //             <View className="h-14" />
    //         </View>

    //         {/* Account Type */}
    //         <View className="bg-white p-6 rounded-3xl border border-gray-200 mb-6">
    //             <Text className="text-sm font-semibold text-gray-700 mb-3">Account Type</Text>
    //             <View className="flex-row bg-gray-100 rounded-2xl p-1">
    //                 <TouchableOpacity
    //                     onPress={() => { setAccountType("user"); setFormData({ ...formData, accountType: "user" }); }}
    //                     className={`flex-1 py-3 rounded-xl ${accountType === "user" ? "bg-white shadow" : ""}`}
    //                 >
    //                     <Text className="text-center font-medium">Personal User</Text>
    //                 </TouchableOpacity>
    //                 <TouchableOpacity
    //                     onPress={() => { setAccountType("business"); setFormData({ ...formData, accountType: "business" }); setShowBusiness(true); }}
    //                     className={`flex-1 py-3 rounded-xl ${accountType === "business" ? "bg-white shadow" : ""}`}
    //                 >
    //                     <Text className="text-center font-medium">Business Account</Text>
    //                 </TouchableOpacity>
    //             </View>
    //         </View>

    //         {/* Basic Information */}
    //         <View className="bg-white p-6 rounded-3xl border border-gray-200 mb-6">
    //             <Text className="text-xl font-semibold mb-6">Basic Information</Text>

    //             {/* Add all your TextInput fields similarly */}
    //             <TextInput
    //                 placeholder="Full Name"
    //                 value={formData.fullName || ""}
    //                 onChangeText={(text) => handleChange("fullName", text)}
    //                 className="border border-gray-300 rounded-2xl px-4 py-3 mb-4"
    //             />

    //             {/* Repeat for other fields: dob, occupation, mobile, spouseName, etc. */}

    //             {/* Children Section */}
    //             {formData.children?.map((child: any, index: number) => (
    //                 <View key={index} className="border border-gray-200 p-4 rounded-2xl bg-gray-50 mb-4">
    //                     <Text className="font-semibold mb-3">Child {index + 1}</Text>
    //                     <TextInput
    //                         placeholder="Child Name"
    //                         value={child.name || ""}
    //                         onChangeText={(text) => handleChildChange(index, "name", text)}
    //                         className="border border-gray-300 rounded-2xl px-4 py-3 mb-3"
    //                     />
    //                     <TextInput
    //                         placeholder="Age"
    //                         keyboardType="numeric"
    //                         value={child.age?.toString() || ""}
    //                         onChangeText={(text) => handleChildChange(index, "age", text)}
    //                         className="border border-gray-300 rounded-2xl px-4 py-3"
    //                     />
    //                 </View>
    //             ))}
    //         </View>

    //         {/* Business Section */}
    //         {formData.accountType === "business" && (
    //             <View className="bg-white rounded-3xl border border-gray-200 mb-6 overflow-hidden">
    //                 <TouchableOpacity
    //                     onPress={() => setShowBusiness(!showBusiness)}
    //                     className="p-6 flex-row justify-between items-center"
    //                 >
    //                     <View>
    //                         <Text className="text-xl font-semibold">Business Details</Text>
    //                         <Text className="text-sm text-gray-500">Add multiple businesses</Text>
    //                     </View>
    //                     {showBusiness ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
    //                 </TouchableOpacity>

    //                 {showBusiness && (
    //                     <View className="px-6 pb-6">
    //                         {formData.businesses.map((biz: any, index: number) => (
    //                             <View key={index} className="border border-gray-200 rounded-2xl p-5 bg-gray-50 mb-6">
    //                                 <View className="flex-row justify-between mb-4">
    //                                     <Text className="font-semibold text-lg">Business {index + 1}</Text>
    //                                     {formData.businesses.length > 1 && (
    //                                         <TouchableOpacity onPress={() => removeBusiness(index)}>
    //                                             <Trash2 size={22} color="red" />
    //                                         </TouchableOpacity>
    //                                     )}
    //                                 </View>

    //                                 <TextInput
    //                                     placeholder="Business Name"
    //                                     value={biz.businessName || ""}
    //                                     onChangeText={(text) => handleBusinessChange(index, "businessName", text)}
    //                                     className="border border-gray-300 rounded-2xl px-4 py-3 mb-3"
    //                                 />

    //                                 <TouchableOpacity
    //                                     onPress={() => pickImage("businessCoverImage", index)}
    //                                     className="border border-dashed border-gray-400 h-40 rounded-2xl items-center justify-center mb-4"
    //                                 >
    //                                     {preview.businessCoverImages[index] || biz.businessCoverImage ? (
    //                                         <Image
    //                                             source={{ uri: preview.businessCoverImages[index] || biz.businessCoverImage }}
    //                                             className="w-full h-full rounded-2xl"
    //                                             resizeMode="cover"
    //                                         />
    //                                     ) : (
    //                                         <Text className="text-blue-600">Upload Cover Image</Text>
    //                                     )}
    //                                 </TouchableOpacity>

    //                                 {/* Add other business fields similarly */}
    //                             </View>
    //                         ))}

    //                         <TouchableOpacity
    //                             onPress={addBusiness}
    //                             className="border-2 border-dashed border-blue-500 py-5 rounded-2xl flex-row justify-center items-center"
    //                         >
    //                             <Plus size={24} color="#3b82f6" />
    //                             <Text className="text-blue-600 font-medium ml-2">Add Another Business</Text>
    //                         </TouchableOpacity>
    //                     </View>
    //                 )}
    //             </View>
    //         )}

    //         {/* Password Section */}
    //         <View className="bg-white p-6 rounded-3xl border border-gray-200 mb-6">
    //             <Text className="text-xl font-semibold mb-6">Security</Text>
    //             <View className="relative">
    //                 <TextInput
    //                     placeholder="New Password"
    //                     secureTextEntry={!showPassword}
    //                     value={formData.password || ""}
    //                     onChangeText={(text) => handleChange("password", text)}
    //                     className="border border-gray-300 rounded-2xl px-4 py-3 pr-12"
    //                 />
    //                 <TouchableOpacity
    //                     onPress={() => setShowPassword(!showPassword)}
    //                     className="absolute right-4 top-4"
    //                 >
    //                     {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
    //                 </TouchableOpacity>
    //             </View>
    //         </View>

    //         {/* Submit Button */}
    //         <TouchableOpacity
    //             onPress={handleSubmit}
    //             disabled={isLoading}
    //             className="bg-blue-600 py-4 rounded-3xl items-center mt-4"
    //         >
    //             {isLoading ? (
    //                 <ActivityIndicator color="white" />
    //             ) : (
    //                 <Text className="text-white font-semibold text-lg">Save All Changes</Text>
    //             )}
    //         </TouchableOpacity>
    //     </ScrollView>
    // );






    return (
    <ScrollView style={styles.container}>
        <Text style={styles.headerTitle}>Profile Settings</Text>
        <Text style={styles.headerSubtitle}>Update your personal and business information</Text>

        {/* Cover + Profile Image */}
        <View style={styles.card}>
            <View style={styles.coverContainer}>
                {preview.coverImage || formData.coverImage ? (
                    <Image
                        source={{ uri: preview.coverImage || formData.coverImage }}
                        style={styles.coverImage}
                        resizeMode="cover"
                    />
                ) : null}

                <TouchableOpacity
                    onPress={() => pickImage("coverImage")}
                    style={styles.changeCoverButton}
                >
                    <Text style={styles.changeCoverText}>Change Cover</Text>
                </TouchableOpacity>

                <View style={styles.profileImageContainer}>
                    <View style={styles.profileImageWrapper}>
                        {(preview.profileImage || formData.profileImage) ? (
                            <Image
                                source={{ uri: preview.profileImage || formData.profileImage }}
                                style={styles.profileImage}
                                resizeMode="cover"
                            />
                        ) : (
                            <View style={styles.noPhotoContainer}>
                                <Text style={styles.noPhotoText}>No Photo</Text>
                            </View>
                        )}
                    </View>

                    <TouchableOpacity
                        onPress={() => pickImage("profileImage")}
                        style={styles.cameraButton}
                    >
                        <Text style={styles.cameraIcon}>📸</Text>
                    </TouchableOpacity>
                </View>
            </View>
            <View style={styles.coverBottomSpace} />
        </View>

        {/* Account Type */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Account Type</Text>
            <View style={styles.accountTypeContainer}>
                <TouchableOpacity
                    onPress={() => { setAccountType("user"); setFormData({ ...formData, accountType: "user" }); }}
                    style={[styles.accountTypeButton, accountType === "user" && styles.accountTypeButtonActive]}
                >
                    <Text style={[styles.accountTypeText, accountType === "user" && styles.accountTypeTextActive]}>
                        Personal User
                    </Text>
                </TouchableOpacity>

                <TouchableOpacity
                    onPress={() => { setAccountType("business"); setFormData({ ...formData, accountType: "business" }); setShowBusiness(true); }}
                    style={[styles.accountTypeButton, accountType === "business" && styles.accountTypeButtonActive]}
                >
                    <Text style={[styles.accountTypeText, accountType === "business" && styles.accountTypeTextActive]}>
                        Business Account
                    </Text>
                </TouchableOpacity>
            </View>
        </View>

        {/* Basic Information */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Basic Information</Text>

            <TextInput
                placeholder="Full Name"
                value={formData.fullName || ""}
                onChangeText={(text) => handleChange("fullName", text)}
                style={styles.input}
            />

            {/* Children Section */}
            {formData.children?.map((child: any, index: number) => (
                <View key={index} style={styles.childCard}>
                    <Text style={styles.childTitle}>Child {index + 1}</Text>
                    <TextInput
                        placeholder="Child Name"
                        value={child.name || ""}
                        onChangeText={(text) => handleChildChange(index, "name", text)}
                        style={styles.input}
                    />
                    <TextInput
                        placeholder="Age"
                        keyboardType="numeric"
                        value={child.age?.toString() || ""}
                        onChangeText={(text) => handleChildChange(index, "age", text)}
                        style={styles.input}
                    />
                </View>
            ))}
        </View>

        {/* Business Section */}
        {formData.accountType === "business" && (
            <View style={styles.card}>
                <TouchableOpacity
                    onPress={() => setShowBusiness(!showBusiness)}
                    style={styles.businessHeader}
                >
                    <View>
                        <Text style={styles.sectionTitle}>Business Details</Text>
                        <Text style={styles.businessSubtitle}>Add multiple businesses</Text>
                    </View>
                    {showBusiness ? <ChevronUp size={24} /> : <ChevronDown size={24} />}
                </TouchableOpacity>

                {showBusiness && (
                    <View style={styles.businessContent}>
                        {formData.businesses.map((biz: any, index: number) => (
                            <View key={index} style={styles.businessCard}>
                                <View style={styles.businessHeaderRow}>
                                    <Text style={styles.businessTitle}>Business {index + 1}</Text>
                                    {formData.businesses.length > 1 && (
                                        <TouchableOpacity onPress={() => removeBusiness(index)}>
                                            <Trash2 size={22} color="#ef4444" />
                                        </TouchableOpacity>
                                    )}
                                </View>

                                <TextInput
                                    placeholder="Business Name"
                                    value={biz.businessName || ""}
                                    onChangeText={(text) => handleBusinessChange(index, "businessName", text)}
                                    style={styles.input}
                                />

                                <TouchableOpacity
                                    onPress={() => pickImage("businessCoverImage", index)}
                                    style={styles.businessCoverUpload}
                                >
                                    {preview.businessCoverImages[index] || biz.businessCoverImage ? (
                                        <Image
                                            source={{ uri: preview.businessCoverImages[index] || biz.businessCoverImage }}
                                            style={styles.businessCoverImage}
                                            resizeMode="cover"
                                        />
                                    ) : (
                                        <Text style={styles.uploadText}>Upload Cover Image</Text>
                                    )}
                                </TouchableOpacity>
                            </View>
                        ))}

                        <TouchableOpacity onPress={addBusiness} style={styles.addBusinessButton}>
                            <Plus size={24} color="#3b82f6" />
                            <Text style={styles.addBusinessText}>Add Another Business</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        )}

        {/* Password Section */}
        <View style={styles.card}>
            <Text style={styles.sectionTitle}>Security</Text>
            <View style={styles.passwordContainer}>
                <TextInput
                    placeholder="New Password"
                    secureTextEntry={!showPassword}
                    value={formData.password || ""}
                    onChangeText={(text) => handleChange("password", text)}
                    style={styles.input}
                />
                <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.eyeIcon}
                >
                    {showPassword ? <EyeOff size={22} /> : <Eye size={22} />}
                </TouchableOpacity>
            </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
            onPress={handleSubmit}
            disabled={isLoading}
            style={styles.submitButton}
        >
            {isLoading ? (
                <ActivityIndicator color="#fff" />
            ) : (
                <Text style={styles.submitButtonText}>Save All Changes</Text>
            )}
        </TouchableOpacity>
    </ScrollView>
);
};




const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f9fafb',
        padding: 16,
    },
    headerTitle: {
        fontSize: 28,
        fontWeight: '700',
        color: '#111827',
        marginTop: 16,
    },
    headerSubtitle: {
        fontSize: 16,
        color: '#6b7280',
        marginBottom: 24,
    },
    card: {
        backgroundColor: '#fff',
        borderRadius: 24,
        padding: 20,
        marginBottom: 20,
        borderWidth: 1,
        borderColor: '#e5e7eb',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 3,
    },
    coverContainer: {
        height: 220,
        backgroundColor: '#4f46e5',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        overflow: 'hidden',
        position: 'relative',
    },
    coverImage: {
        width: '100%',
        height: '100%',
    },
    changeCoverButton: {
        position: 'absolute',
        top: 16,
        right: 16,
        backgroundColor: 'rgba(255,255,255,0.95)',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 16,
    },
    changeCoverText: {
        fontWeight: '600',
        color: '#1f2937',
    },
    profileImageContainer: {
        position: 'absolute',
        bottom: -48,
        left: 24,
    },
    profileImageWrapper: {
        width: 112,
        height: 112,
        borderRadius: 24,
        borderWidth: 4,
        borderColor: '#fff',
        backgroundColor: '#fff',
        overflow: 'hidden',
    },
    profileImage: {
        width: '100%',
        height: '100%',
    },
    noPhotoContainer: {
        flex: 1,
        backgroundColor: '#e5e7eb',
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPhotoText: {
        color: '#9ca3af',
    },
    cameraButton: {
        position: 'absolute',
        bottom: 8,
        right: 8,
        backgroundColor: '#fff',
        padding: 8,
        borderRadius: 999,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.2,
        shadowRadius: 4,
        elevation: 4,
    },
    cameraIcon: {
        fontSize: 18,
    },
    coverBottomSpace: {
        height: 56,
    },
    sectionTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: '#111827',
        marginBottom: 16,
    },
    accountTypeContainer: {
        flexDirection: 'row',
        backgroundColor: '#f3f4f6',
        borderRadius: 16,
        padding: 4,
    },
    accountTypeButton: {
        flex: 1,
        paddingVertical: 14,
        borderRadius: 14,
        alignItems: 'center',
    },
    accountTypeButtonActive: {
        backgroundColor: '#fff',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    accountTypeText: {
        fontWeight: '600',
        color: '#4b5563',
    },
    accountTypeTextActive: {
        color: '#111827',
    },
    input: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 16,
        paddingHorizontal: 16,
        paddingVertical: 14,
        fontSize: 16,
        marginBottom: 12,
        backgroundColor: '#fff',
    },
    childCard: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 16,
        padding: 16,
        marginBottom: 12,
    },
    childTitle: {
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 12,
        color: '#1f2937',
    },
    businessHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    businessSubtitle: {
        fontSize: 14,
        color: '#6b7280',
    },
    businessContent: {
        paddingTop: 8,
    },
    businessCard: {
        backgroundColor: '#f9fafb',
        borderWidth: 1,
        borderColor: '#e5e7eb',
        borderRadius: 20,
        padding: 20,
        marginBottom: 16,
    },
    businessHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    businessTitle: {
        fontSize: 18,
        fontWeight: '600',
    },
    businessCoverUpload: {
        height: 160,
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#9ca3af',
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        overflow: 'hidden',
    },
    businessCoverImage: {
        width: '100%',
        height: '100%',
        borderRadius: 14,
    },
    uploadText: {
        color: '#3b82f6',
        fontWeight: '600',
    },
    addBusinessButton: {
        borderWidth: 2,
        borderStyle: 'dashed',
        borderColor: '#3b82f6',
        borderRadius: 20,
        paddingVertical: 20,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    addBusinessText: {
        color: '#3b82f6',
        fontWeight: '600',
        marginLeft: 8,
        fontSize: 16,
    },
    passwordContainer: {
        position: 'relative',
    },
    eyeIcon: {
        position: 'absolute',
        right: 16,
        top: 18,
    },
    submitButton: {
        backgroundColor: '#2563eb',
        paddingVertical: 18,
        borderRadius: 20,
        alignItems: 'center',
        marginTop: 12,
    },
    submitButtonText: {
        color: '#fff',
        fontSize: 18,
        fontWeight: '700',
    },
});