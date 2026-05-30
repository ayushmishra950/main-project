import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface ChatType {
  userChatList : any[],
  messageList : any[]
}


const initialState : ChatType = {
  userChatList: [],
  messageList: []
};


const chatSlice = createSlice({
  name: "Chat",
  initialState,
  reducers: {
    setUserChatList: (state, action: PayloadAction<any[]>) => {
      state.userChatList = action.payload;
    },
    setMessageRefresh: (state, action: PayloadAction<{ newMessage: any, updatedAt: string }>) => {
      const { newMessage, updatedAt } = action.payload;

      if (!newMessage || !newMessage.chatId) return;

      state.userChatList = state.userChatList.map((chat) => {

        if (!chat || !chat.chatId) return chat;

        if (chat.chatId?.toString() === newMessage.chatId?.toString()) {

          const deliveredMessages = Array.isArray(chat.deliveredMessages)
            ? chat.deliveredMessages
            : [];

          const updatedDelivered = deliveredMessages
            .filter((dm:any) => dm._id?.toString() !== newMessage._id?.toString())
            .concat(newMessage.status !== "seen" ? [newMessage] : []);

          return {
            ...chat,
            lastMessage: newMessage,
            deliveredMessages: updatedDelivered,
            updatedAt: updatedAt ?? new Date().toISOString(),
          };
        }

        return chat;
      });
      state.userChatList = [...state.userChatList].sort(
        (a, b) =>
          new Date(b.updatedAt || 0).getTime() -
          new Date(a.updatedAt || 0).getTime()
      );
    },

    setUnreadCountRemove: (state, action: PayloadAction<{ chat: any }>) => {
      const { chat } = action.payload;

      state.userChatList = state.userChatList.map((c) => {
        if (c.chatId === chat?.chatId) { return { ...c, deliveredMessages: [] }; }
        return c;
      });
    },

    setMessageList: (state, action: PayloadAction<any[]>) => {
      state.messageList = action.payload
    },
    setNewMessageAdd: (state, action: PayloadAction<any>) => {
      state.messageList.push(action.payload);
    },


    setGroupInvited: (state, action: PayloadAction<any>) => {
      const { groupId, chatId, userId } = action.payload;
      const group = state.userChatList.find((chat) => chat.chatId?.toString() === chatId?.toString());
      if (group) {
        group.groupId = groupId;
      }
    },

    setRejectGroupInvite: (state, action: PayloadAction<any>) => {
      const { chatId, userId } = action.payload;

      // 🔍 find chat index
      const index = state.userChatList.findIndex(
        (chat) => chat.chatId?.toString() === chatId?.toString()
      );

      if (index !== -1) {
        const group = state.userChatList[index];

        // 1️⃣ remove from pendingMembers
        if (group.pendingMembers) {
          group.pendingMembers = group.pendingMembers.filter(
            (id: string) => id.toString() !== userId.toString()
          );
        }

        state.userChatList.splice(index, 1);
      }
    },

    setAcceptedInvite: (state, action) => {
      const { chatId, userId } = action.payload;

      const chat = state.userChatList.find((c) => c.chatId?.toString() === chatId?.toString());

      if (chat) {
        if (chat.pendingMembers) {
          chat.pendingMembers = chat.pendingMembers.filter((id: string) => id.toString() !== userId.toString());
        }

        if (!chat.members) {
          chat.members = [];
        }

        const exists = chat.members.some((id: string) => id.toString() === userId.toString());

        if (!exists) {
          chat.members.push(userId);
        }
      }
    }
  }
});

export const { setUserChatList, setAcceptedInvite, setMessageRefresh, setRejectGroupInvite, setGroupInvited, setUnreadCountRemove, setMessageList, setNewMessageAdd } = chatSlice.actions;

export default chatSlice.reducer;

