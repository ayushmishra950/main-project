import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, TouchableWithoutFeedback, Image, StyleSheet, KeyboardAvoidingView, Platform, StatusBar, ActivityIndicator, Keyboard } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Phone, Video, MoveVertical as MoreVertical, Send, Smile, Paperclip, Mic, Image as ImageIcon } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import { CHATS } from '@/data/dummyData';
import { Alert } from 'react-native';
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import { getMessages, sendMessage } from "@/service/chat";
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getSocket } from '@/socket/socket';
import { setExitUserFromGroup, setMessageList, setMessageRefresh, setNewMessageAdd, setOfflineUser } from '@/redux-toolkit/slice/chatSlice';
import * as ImagePicker from 'expo-image-picker';
import { exitMemberFromGroup } from '@/service/group';
import ConfirmDialog from '@/components/forms/ConfirmDialog';


export default function ChatDetailScreen() {
  const socket = getSocket();
  const dispatch = useAppDispatch();
  const { id } = useLocalSearchParams<{ id: string }>();// y id hi chatId hai |||||
  const chat = CHATS.find(c => c.id === id) || CHATS[0];
  const [text, setText] = useState('');
  const [messages, setMessages] = useState(chat.messages);
  const [user, setUser] = useState<any | null>();
  const [loading, setLoading] = useState<boolean>(false);
  const [isTyping, setIsTyping] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);  
  const [selectedFile, setSelectedFile] = useState<any>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);
  const [deleteGroupData, setDeleteGroupData] = useState<any>(null);
  const [deleteGroupOpen, setDeleteGroupOpen] = useState(false);
  const userList = useAppSelector((state) => state?.chat?.userChatList);
  const chatUserData = userList.find((u) => u?.chatId === id);
  const messageList = useAppSelector((state) => state?.chat?.messageList);
  const flatRef = useRef<FlatList>(null);

  const handleDeleteUser = () => {
  console.log("Delete User");
};

 const handleExitGroup = async () => {
    try {
      setDeleteLoading(deleteGroupData?._id);
      const res = await exitMemberFromGroup({ chatId: id, userId: user?._id });
      if (res.status === 200 || res.status === 201) {
          Alert.alert(`${deleteGroupData?.isGroup ? "Exit Group" : "Leave Chat"}`, res?.data?.message || "You have exited the group successfully");
        setDeleteGroupData(null);
        setDeleteGroupOpen(false);
        dispatch(setExitUserFromGroup({ chatId: id , userId: user?._id}));
        router.replace('/(tabs)/chat');
      }
    } catch (err:any) {
      console.log(err);
        Alert.alert("Failed to Exit Group.", err?.response?.data?.message || err?.message || "An error occurred");
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleScroll = (event: any) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;

    const isNearBottom =
      layoutMeasurement.height + contentOffset.y >= contentSize.height - 50;

    setShowScrollBtn(!isNearBottom);
  };

  const pickMedia = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.All, quality: 0.8});

    if (!result.canceled) {
      const file = result.assets[0];

      const mimeType = file.mimeType || (file.uri.endsWith(".png") ? "image/png" : "image/jpeg");

      setSelectedFile({
        uri: file.uri,
        name: file.fileName || "photo.jpg",
        type: mimeType,
      });

      setPreviewUrl(file.uri);
    }
  };

  useEffect(() => {
    if (!socket) return;
    socket.on("messageRefresh", (newMessage: any, updatedAt: string) => {
      if (newMessage.chatId?.toString() === id?.toString()) {
        dispatch(setNewMessageAdd(newMessage));
        socket.emit("messageSeen", { chatId: newMessage.chatId, receiverUserId: user?._id, senderUserId: chatUserData?.friend?._id });
      }
      dispatch(setMessageRefresh({ newMessage, updatedAt }));
    });
    socket.on("typingChat", () => {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    });

     socket.on("userOffline", ({ userId }) => {
      if(chatUserData?.isGroup === false){
     dispatch(setOfflineUser({ userId }));
      }
    });

    socket.on("messageSeen", (data: any) => {
      if (data?.chatId === id) {
        dispatch(setMessageList(data?.messages));
      }
    });
    return () => {
      socket.off("messageRefresh");
      socket.off("messageSeen");
      socket.off("userOffline");
    }
  }, []);

  useEffect(() => {
    if (messageList?.length) {
      setTimeout(() => {
        flatRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messageList]);

  const handleGetMessages = async () => {
    if (!id) { return; }
    try {
      const res = await getMessages(id);
      if (res.status === 200) {
        dispatch(setMessageList(res?.data?.messages));
      }
    }
    catch (err) {
      console.log(err);
    }
  };
  useEffect(() => {
    if (id && messageList?.length === 0) {
      handleGetMessages();
    }
  }, [id]);

  useEffect(() => {
    const getUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      setUser(user);
    };
    getUser();
  }, []);

  const handleSendMessage = async () => {
    if (!text.trim() && !selectedFile) return;
    const form = new FormData();
    form.append("chatId", id);
    form.append("senderId", user?._id);
    form.append("text", text || "");

    if (selectedFile) {
      const fileToUpload = {
        uri: selectedFile.uri,
        name: selectedFile.name,
        type: selectedFile.type,
      } as any;

      form.append("image", fileToUpload);
    }
    setLoading(true);
    try {
      const res = await sendMessage(form);
      if (res.status === 201) {
        setText("");
        setSelectedFile(null);
        setPreviewUrl("");
      }
    }
    catch (err: any) {
      console.log(err?.response?.data?.message || err?.message);
      Alert.alert("Message Send Failed.", err?.response?.data?.message || err?.message);
    } finally {
      setLoading(false);
    }
  };

  const renderSingleMessage = ({ item, index }: any) => {
    const isSent = item?.sender?._id === user?._id;
    const prevMsg = messageList[index - 1];
    const prevIsSent = prevMsg?.sender?._id === user?._id;
    const showAvatar = !isSent && (!prevMsg || prevIsSent);

    return (
      <View>
        <View style={[styles.msgRow, isSent && styles.msgRowSent]}>
          {!isSent && (
            <View style={styles.msgAvatarArea}>
              {showAvatar ? (
                <Avatar
                  uri={item?.sender?.profileImage}
                  size={28}
                />
              ) : (
                <View style={{ width: 28 }} />
              )}
            </View>
          )}

          {/* ====== MESSAGE CONTENT ====== */}
          <View
            style={[
              styles.bubble,
              isSent ? styles.bubbleSent : styles.bubbleReceived,
            ]}
          >
            {/* ====== IF IMAGES EXIST ====== */}
            {item?.images && item.images.length > 0 ? (
              item.images.map((imgUrl: string, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri: imgUrl }}
                  style={styles.msgImage}
                />
              ))
            ) : (
              <Text
                style={[
                  styles.msgText,
                  isSent && styles.msgTextSent,
                ]}
              >
                {item?.text}
              </Text>
            )}

            <Text
              style={[
                styles.msgTime,
                isSent && styles.msgTimeSent,
              ]}
            >
              {new Date(item?.createdAt).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </Text>
          </View>
        </View>
      </View>
    );
  };


  
  const renderGroupMessage = ({ item, index }: any) => {
    const isSent = item?.sender?._id === user?._id;
    const prevMsg = messageList[index - 1];
    const prevIsSent = prevMsg?.sender?._id === user?._id;
    const showAvatar = !isSent && (!prevMsg || prevIsSent);

    return (
      <View>
        <View style={[styles.msgRow, isSent && styles.msgRowSent]}>
        {!isSent && (
  <View style={styles.msgAvatarArea}>
    {showAvatar ? (
      <>
        <Avatar
          uri={item?.sender?.profileImage}
          size={28}
        />

        <Text
          numberOfLines={1}
          style={styles.groupUserName}
        >
          {item?.sender?.fullName}
        </Text>
      </>
    ) : (
      <View style={{ width: 28 }} />
    )}
  </View>
)}
          {/* ====== MESSAGE CONTENT ====== */}
          <View
            style={[
              styles.bubble,
              isSent ? styles.bubbleSent : styles.bubbleReceived,
            ]}
          >
            {/* ====== IF IMAGES EXIST ====== */}
            {item?.images && item.images.length > 0 ? (
              item.images.map((imgUrl: string, idx: number) => (
                <Image
                  key={idx}
                  source={{ uri: imgUrl }}
                  style={styles.msgImage}
                />
              ))
            ) : (
              <Text
                style={[
                  styles.msgText,
                  isSent && styles.msgTextSent,
                ]}
              >
                {item?.text}
              </Text>
            )}



            <Text style={[ styles.msgTime, isSent && styles.msgTimeSent, ]} >
              {new Date(item?.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
            </Text>
          </View>
        </View>
      </View>
    );
  };
  return (
    <>
     <ConfirmDialog
        visible={deleteGroupOpen}
        onClose={() => setDeleteGroupOpen(false)}
        loading={deleteLoading === deleteGroupData?._id}
        title={`${deleteGroupData?.isGroup ? "Exit Group" : "Leave Chat"}`}
        description={`Are you sure you want to ${deleteGroupData?.isGroup ? "exit" : "leave"} this ${deleteGroupData?.isGroup ? "group" : "chat"}?`}
        buttonName="Exit"
        onConfirm={handleExitGroup}
      />
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : "height"}
    >
      <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
        <View style={[styles.container, { flex: 1 }]} >

          <StatusBar barStyle="light-content" />
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
              <ArrowLeft color={Colors.white} size={24} />
            </TouchableOpacity>
            <TouchableOpacity style={styles.userInfo}>
              <Avatar uri={chatUserData?.friend?.profileImage || chatUserData?.group?.images?.[0]} size={40} isOnline={chatUserData?.friend?.isOnline} />
              <View style={{ marginLeft: 10 }}>
                <Text style={styles.userName}>{chatUserData?.friend?.fullName || chatUserData?.group?.title}</Text>
                <Text style={styles.userStatus}>
                  {chatUserData?.isGroup ? 'Group' : chatUserData?.friend?.isOnline ? 'Online' : 'Offline'}
                </Text>
              </View>
            </TouchableOpacity>
            <View style={styles.headerActions}>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Phone color={Colors.gray300} size={22} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn}>
                <Video color={Colors.gray300} size={22} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.headerIconBtn} onPress={() => setShowMenu(!showMenu)}>
                <MoreVertical color={Colors.gray300} size={22} />
              </TouchableOpacity>
            </View>
          </View>
          {showMenu && (
  <View style={styles.dropdownMenu}>
    {chatUserData?.isGroup ? (
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => {setDeleteGroupData(chatUserData); setDeleteGroupOpen(true); setShowMenu(false); }}
      >
        <Text style={styles.dropdownText}>Exit Group</Text>
      </TouchableOpacity>
    ) : (
      <TouchableOpacity
        style={styles.dropdownItem}
        onPress={() => { setDeleteGroupData(chatUserData); setDeleteGroupOpen(true); setShowMenu(false);}}>
        <Text style={[styles.dropdownText, { color: "red" }]}>
          Delete User
        </Text>
      </TouchableOpacity>
    )}
  </View>
)}

          {/* Messages */}
          {chatUserData?.isGroup === false ?
          <FlatList
            ref={flatRef}
            data={messageList}
            renderItem={renderSingleMessage}
            keyExtractor={(m) => m?._id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              flatRef.current?.scrollToEnd({ animated: false });
            }}
          />
           :
          <FlatList
            ref={flatRef}
            data={messageList}
            renderItem={renderGroupMessage}
            keyExtractor={(m) => m?._id}
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onContentSizeChange={() => {
              flatRef.current?.scrollToEnd({ animated: false });
            }}
          />
}
          {showScrollBtn && (
            <TouchableOpacity
              onPress={() => {
                flatRef.current?.scrollToEnd({ animated: true });
              }}
              style={{
                position: "absolute",
                bottom: 90, // input ke upar
                right: 20,
                backgroundColor: "#000",
                width: 40,
                height: 40,
                borderRadius: 20,
                alignItems: "center",
                justifyContent: "center",
                elevation: 5,
              }}
            >
              <Text style={{ color: "#fff", fontSize: 18 }}>↓</Text>
            </TouchableOpacity>
          )}
          {previewUrl ? (
            <View style={{ paddingHorizontal: 12, paddingBottom: 6 }}>
              <View style={{ position: "relative", width: 60, height: 60 }}>
                <Image
                  source={{ uri: previewUrl }}
                  style={{
                    width: 60,
                    height: 60,
                    borderRadius: 8,
                  }}
                />

                <TouchableOpacity
                  onPress={() => {
                    setSelectedFile(null);
                    setPreviewUrl("");
                  }}
                  style={{
                    position: "absolute",
                    top: -6,
                    right: -6,
                    backgroundColor: "red",
                    width: 18,
                    height: 18,
                    borderRadius: 9,
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <Text style={{ color: "#fff", fontSize: 10 }}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : null}

          {/* Input */}

          <View style={styles.inputBar}>
            <TouchableOpacity style={styles.inputIconBtn}>
              <Smile color={Colors.gray500} size={22} />
            </TouchableOpacity>
            <TextInput
              style={styles.textInput}
              value={text}
              onChangeText={setText}
              placeholder="Message..."
              placeholderTextColor={Colors.gray500}
              multiline
            />
            {text.trim() || selectedFile ? (
              <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
                {loading ? <ActivityIndicator color={"white"} /> : <Send color={Colors.white} size={20} />}
              </TouchableOpacity>
            ) : (
              <View style={styles.inputRightIcons}>
                <TouchableOpacity style={styles.inputIconBtn}>
                  <Paperclip color={Colors.gray500} size={22} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.inputIconBtn} onPress={pickMedia}>
                  <ImageIcon color={Colors.gray500} size={22} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.micBtn}>
                  <Mic color={Colors.white} size={20} />
                </TouchableOpacity>
              </View>
            )}
          </View>

        </View>
      </TouchableWithoutFeedback>
    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.dark.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingTop: 52,
    paddingBottom: 12,
    backgroundColor: Colors.dark.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    gap: 4,
  },
  dropdownMenu: {
  position: "absolute",
  top: 95,
  right: 10,
  backgroundColor: Colors.dark.surface,
  borderRadius: 8,
  minWidth: 140,
  zIndex: 999,
  elevation: 10,
  borderWidth: 1,
  borderColor: Colors.dark.border,
},

dropdownItem: {
  paddingHorizontal: 16,
  paddingVertical: 12,
},

dropdownText: {
  color: "#fff",
  fontSize: 14,
},
  groupUserName: {
    width:80,
  color: Colors.gray500,
  fontSize: 10,
  textAlign: "center",
  marginTop: 2,
},
  postContainer: {
    padding: 8,
    borderRadius: 10,
    backgroundColor: "#fff",
  },

  videoPlaceholder: {
    width: "100%",
    height: 100,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
    borderRadius: 8,
    marginVertical: 4,
  },

  videoText: {
    color: "#fff",
    fontSize: 12,
  },

  postTitle: {
    fontWeight: "600",
    fontSize: 14,
  },

  postDesc: {
    fontSize: 12,
    color: "#666",
  },
  backBtn: { padding: 8 },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userName: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  userStatus: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.xs,
    marginTop: 2,
  },
  headerActions: { flexDirection: 'row', gap: 4 },
  headerIconBtn: { padding: 8 },
  msgList: { padding: 16, gap: 4, paddingBottom: 8 },
  msgRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 4,
    gap: 6,
  },
  msgRowSent: { justifyContent: 'flex-end' },
  msgAvatarArea: { width: 32 },
  bubble: {
    maxWidth: '72%',
    borderRadius: 18,
    padding: 12,
    paddingBottom: 8,
  },
  bubbleReceived: {
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
  },
  bubbleSent: {
    backgroundColor: Colors.primary,
    borderBottomRightRadius: 4,
  },
  msgText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
    lineHeight: 20,
    marginBottom: 4,
  },
  msgTextSent: { color: Colors.white },
  msgTime: {
    color: Colors.gray500,
    fontSize: 10,
    alignSelf: 'flex-end',
  },
  msgTimeSent: { color: 'rgba(255,255,255,0.65)' },
  imgBubble: {
    maxWidth: '72%',
    borderRadius: 14,
    overflow: 'hidden',
    backgroundColor: Colors.dark.surface,
    borderBottomLeftRadius: 4,
  },
  imgBubbleSent: { borderBottomLeftRadius: 14, borderBottomRightRadius: 4 },
  msgImage: { width: 120, height: 80, resizeMode: 'cover' },
  inputBar: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 6,
    padding: 12,
    paddingBottom: Platform.OS === 'ios' ? 24 : 12,
    backgroundColor: Colors.dark.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  inputIconBtn: { padding: 6 },
  textInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
    backgroundColor: Colors.dark.surfaceSecondary,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  sendBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputRightIcons: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  micBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
});




















//  {item?.postId ? (
//               <View style={styles.postContainer}>

//                 {/* POST IMAGE */}
//                 {item.postId.images?.length > 0 && (
//                   <Image
//                     source={{ uri: item.postId.images[0] }}
//                     style={styles.msgImage}
//                   />
//                 )}

//                 {/* POST VIDEO (basic fallback UI) */}
//                 {item.postId.video ? (
//                   <View style={styles.videoPlaceholder}>
//                     <Text style={styles.videoText}>Video Attached</Text>
//                   </View>
//                 ) : null}

//                 <Text style={styles.postTitle}>{item.postId.title}</Text>

//                 {item.postId.description && (
//                   <Text style={styles.postDesc}>
//                     {item.postId.description}
//                   </Text>
//                 )}

//               </View>
//             ) : item?.images?.length > 0 ? (
//               <View>
//                 {item.images.map((imgUrl: string, idx: number) => {
//                   const isVideo =
//                     imgUrl.includes(".mp4") ||
//                     imgUrl.includes(".mov") ||
//                     imgUrl.includes(".webm");

//                   return isVideo ? (
//                     <View key={idx} style={styles.videoPlaceholder}>
//                       <Text style={styles.videoText}>Video</Text>
//                     </View>
//                   ) : (
//                     <Image
//                       key={idx}
//                       source={{ uri: imgUrl }}
//                       style={styles.msgImage}
//                     />
//                   );
//                 })}
//               </View>
//             ) : (
//               <Text
//                 style={[
//                   styles.msgText,
//                   isSent && styles.msgTextSent,
//                 ]}
//               >
//                 {item?.text}
//               </Text>
//             )}