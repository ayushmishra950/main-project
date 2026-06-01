import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, FlatList, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { router } from 'expo-router';
import { Search, CreditCard as Edit, Check, X } from 'lucide-react-native';
import { Colors, Typography, BorderRadius } from '@/constants/theme';
import Avatar from '@/components/ui/Avatar';
import { CHATS, GROUP_CHATS } from '@/data/dummyData';
import { getChatUsers, sendMessage, getMessages, rejectGroupInvite, acceptGroupInvite } from "@/service/chat";
import { useAppDispatch, useAppSelector } from '@/redux-toolkit/customHook/hook';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { setMessageList, setMessageRefresh, setNewMessageAdd, setAcceptedInvite, setGroupInvited, setRejectGroupInvite, setUnreadCountRemove, setUserChatList } from '@/redux-toolkit/slice/chatSlice';
import {Alert} from "react-native";
import { getSocket } from '@/socket/socket';

export default function ChatScreen() {
  const socket = getSocket();
  const dispatch = useAppDispatch();
  const [search, setSearch] = useState('');
  const [rejectLoading, setRejectLoading] = useState(false);
  const [acceptLoading, setAcceptLoading] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const userList = useAppSelector((state) => state?.chat?.userChatList);
  const [user, setUser] = useState<any | null>();
  const filteredChats = userList?.filter((item) => item?.isGroup === false && item.friend?.fullName?.toLowerCase().includes(search.toLowerCase()));
  const filteredGroups = userList?.filter((item) => item?.isGroup === true && item?.group?.title?.toLowerCase().includes(search.toLowerCase()));
  

   useEffect(() => {
    if(!socket) return;
   
    socket.on("typingChat", () => {
      setIsTyping(true);

      setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    });

    socket.on("groupInvite", (data) => {
      handleGetFriendList();
    })

    socket.on("groupInviteAccepted", (data) => {
      dispatch(setAcceptedInvite(data));
    })

    socket.on("userOnline", (userId: string) => {
      setOnlineUsers(prev => [...prev, userId]);
    });
    socket.on("onlineUsersList", (users: string[]) => {
      setOnlineUsers(users);
    });
    socket.on("userOffline", (userId: string) => {
      setOnlineUsers(prev => prev.filter(id => id !== userId));
    });


    return () => {
      socket.off("messageRefresh");
      socket.off("typingChat");
      socket.off("userOnline");
      socket.off("userOffline");
      socket.off("onlineUsersList");
      socket.off("userOffline");
      socket.off("messageSeen");
      socket.off("userListUnReadChatCount");
      socket.off("groupInvite");
      socket.off("groupInviteAccepted");
    }
  }, [])

   const handleAcceptGroupInvite = async (chatId: string, userId: string) => {
    try {
      setAcceptLoading(true);
      const res = await acceptGroupInvite({ chatId, userId });
      if (res.status === 200 || res.status === 201) {
        dispatch(setAcceptedInvite({ chatId, userId }));
       Alert.alert("Group invite accepted successfully.", res?.data?.message);
      } else {
        Alert.alert("Failed to accept group invite", res?.data?.message || "invite accepted failed");
      }
    } catch (err: any) {
      console.log(err);
      Alert.alert("Failed to accept group invite", err?.response?.data?.message || err?.message);
    } finally {
      setAcceptLoading(false);
    }
  };

  const handleRejectGroupInvite = async (chatId: string, userId: string) => {
    try {
      setRejectLoading(true);
      const res = await rejectGroupInvite({ chatId, userId });
      if (res.status === 200 || res.status === 201) {
        Alert.alert("Group invite rejected successfully.", res?.data?.message);
        // setActiveChat(null);
        dispatch(setRejectGroupInvite({ chatId, userId }));
      } else {
        Alert.alert("Failed to reject group invite", res?.data?.message || "invite rejected failed");
      }
    } catch (err: any) {
      console.log(err);
      Alert.alert("Failed to reject group invite", err?.response?.data?.message || err?.message);
    } finally {
      setRejectLoading(false);
    }
  };


  const handleGetFriendList = async () => {
    const userData = await AsyncStorage.getItem("user");
    const userId = userData ? JSON.parse(userData)?._id : null;

    if (!userId) return;
    try {
      const res = await getChatUsers(userId);
      if (res.status === 200) {
        dispatch(setUserChatList(res?.data?.friends));
      }
    }
    catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    if (userList?.length === 0 || user?._id) {
      handleGetFriendList();
    }
  }, [user?._id]);

  useEffect(() => {
    const getUser = async () => {
      const userData = await AsyncStorage.getItem("user");
      const user = userData ? JSON.parse(userData) : null;
      setUser(user);
    };

    if (user === null) {
      getUser();
    }
  }, [user])

  const renderChat = ({ item }: any) => (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() => router.push({ pathname: '/chat/[id]', params: { id: item?.chatId } } as any)} >
      <Avatar uri={item?.friend?.profileImage} size={54} isOnline={item?.friend?.isOnline} />
      <View style={styles.chatInfo}>
        <View style={styles.chatTop}>
          <Text style={styles.chatName}>{item?.friend?.fullName}</Text>
          <Text style={[styles.chatTime, item.unread > 0 && styles.chatTimeActive]}>{new Date(item?.friend?.lastSeen)?.toLocaleString()} </Text>
        </View>
        <View style={styles.chatBottom}>
          <Text
            style={[styles.chatLast, item?.unread > 0 && styles.chatLastUnread]}
            numberOfLines={1}
          >
            {item?.isTyping ? (
              <Text style={styles.typingText}>typing...</Text>
            ) : (
             item?.lastMessage?.text 
              // item?.lastMessage
            )}
          </Text>
          {item?.unread > 0 && (
            <View style={styles.unreadBadge}>
              <Text style={styles.unreadText}>{item?.unread}</Text>
            </View>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );


  const renderGroupChat = ({ item }: any) =>{
    const isPending = item?.pendingMembers?.some((id:string) => id.toString() === user?._id);
    return (
    <TouchableOpacity
      style={styles.chatRow}
      onPress={() =>
        router.push({ pathname: '/chat/[id]', params: { id: item?.chatId },} as any)} >
      <Avatar uri={item?.group?.images?.[0]} size={54} />

      <View style={styles.chatInfo}>
        <View style={styles.chatTop}>
          <Text style={styles.chatName}>{item?.group?.title}</Text>

          <Text
            style={[
              styles.chatTime,
              item?.unread > 0 && styles.chatTimeActive,
            ]}
          >
            {item?.timestamp}
          </Text>
        </View>

        <View style={styles.chatBottom}>
          <Text
            numberOfLines={1}
            style={[
              styles.chatLast,
              item?.unread > 0 && styles.chatLastUnread,
            ]}
          >
            {/* {item?.lastMessage} */}
          </Text>

         {isPending ? (
  <View style={styles.pendingActions}>
    <TouchableOpacity
      style={styles.acceptBtn}
      onPress={() =>
        handleAcceptGroupInvite(item?.chatId, user?._id)
      }
    >
      <Check size={16} color="#22C55E" />
    </TouchableOpacity>

    <TouchableOpacity
      style={styles.rejectBtn}
      onPress={() =>
        handleRejectGroupInvite(item?.chatId, user?._id)
      }
    >
      <X size={16} color="#EF4444" />
    </TouchableOpacity>
  </View>
) : (
  item?.unread > 0 && (
    <View style={styles.unreadBadge}>
      <Text style={styles.unreadText}>{item?.unread}</Text>
    </View>
  )
)}
        </View>
      </View>
    </TouchableOpacity>
  )};

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" />
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.editBtn}>
          <Edit color={Colors.primary} size={22} />
        </TouchableOpacity>
      </View>

      <Text style={[styles.sectionLabel, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }]}>
        {activeTab === 'chats' ? 'Recent Chats' : 'Groups'}
      </Text>
      {/* Search */}
      <View style={styles.searchWrap}>
        <Search color={Colors.gray500} size={18} />
        <TextInput
          style={styles.searchInput}
          value={search}
          onChangeText={setSearch}
          placeholder="Search conversations..."
          placeholderTextColor={Colors.gray500}
        />
      </View>
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'chats' && styles.activeTab]}
          onPress={() => setActiveTab('chats')}
        >
          <Text style={[styles.tabText, activeTab === 'chats' && styles.activeTabText]}>
            Chats
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.tabButton, activeTab === 'groups' && styles.activeTab]}
          onPress={() => setActiveTab('groups')}
        >
          <Text style={[styles.tabText, activeTab === 'groups' && styles.activeTabText]} >
            Groups
          </Text>
        </TouchableOpacity>
      </View>

      {/* Chat List */}
      <Text style={[styles.sectionLabel, { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 4 }]}>
        Recent Chats
      </Text>
      {
        activeTab === 'chats' ? (
          <FlatList
            data={filteredChats}
            renderItem={renderChat}
            keyExtractor={(item) => item?.chatId}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No chats found</Text>
              </View>
            )}
          />
        ) : (
          <FlatList
            data={filteredGroups}
            renderItem={renderGroupChat}
            keyExtractor={(item) => item?.chatId}
            ListEmptyComponent={() => (
              <View style={styles?.emptyContainer}>
                <Text style={styles?.emptyText}>No Groups Found.</Text>
              </View>
        )}
          />
        )
      }
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.bg,
  },
  tabsContainer: {
    flexDirection: 'row',
    marginHorizontal: 16,
    marginBottom: 12,
    backgroundColor: Colors.dark.surface,
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 80,
  },

  emptyText: {
    color: Colors.gray400,
    fontSize: 16,
    fontWeight: '500',
  },
  pendingActions: {
  flexDirection: "row",
  alignItems: "center",
  gap: 8,
},

acceptBtn: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "rgba(34,197,94,0.15)",
  justifyContent: "center",
  alignItems: "center",
},

rejectBtn: {
  width: 28,
  height: 28,
  borderRadius: 14,
  backgroundColor: "rgba(239,68,68,0.15)",
  justifyContent: "center",
  alignItems: "center",
},

  tabButton: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },

  activeTab: {
    backgroundColor: Colors.primary,
  },

  tabText: {
    color: Colors.gray400,
    fontWeight: '600',
  },

  activeTabText: {
    color: Colors.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 56,
    paddingBottom: 16,
  },
  headerTitle: {
    color: Colors.white,
    fontSize: Typography.fontSizes['2xl'],
    fontWeight: Typography.fontWeights.bold,
  },
  editBtn: { padding: 4 },
  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 16,
    marginBottom: 16,
    backgroundColor: Colors.dark.surface,
    borderRadius: BorderRadius.xl,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  searchInput: {
    flex: 1,
    color: Colors.white,
    fontSize: Typography.fontSizes.base,
  },
  onlineSection: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
    paddingBottom: 8,
  },
  sectionLabel: {
    color: Colors.gray400,
    fontSize: Typography.fontSizes.sm,
    fontWeight: Typography.fontWeights.semibold,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  onlineUser: {
    alignItems: 'center',
    gap: 6,
    width: 64,
  },
  onlineName: {
    color: Colors.gray300,
    fontSize: Typography.fontSizes.xs,
    textAlign: 'center',
  },
  chatRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.dark.border,
  },
  chatInfo: { flex: 1 },
  chatTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  chatName: {
    color: Colors.white,
    fontSize: Typography.fontSizes.md,
    fontWeight: Typography.fontWeights.semibold,
  },
  chatTime: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.xs,
  },
  chatTimeActive: {
    color: Colors.primary,
  },
  chatBottom: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  chatLast: {
    color: Colors.gray500,
    fontSize: Typography.fontSizes.base,
    flex: 1,
  },
  chatLastUnread: {
    color: Colors.gray300,
    fontWeight: Typography.fontWeights.medium,
  },
  typingText: {
    color: Colors.primary,
    fontStyle: 'italic',
  },
  unreadBadge: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    minWidth: 22,
    height: 22,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
  },
  unreadText: {
    color: Colors.white,
    fontSize: Typography.fontSizes.xs,
    fontWeight: Typography.fontWeights.bold,
  },
});
