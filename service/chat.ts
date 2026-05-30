import api from "@/axios/axios";



export const getChatUsers = async (userId: string) => {
    const res = await api.get(`/user/chat/users/${userId}`);
    return res;
};


export const addUserFromChat = async (obj: any) => {
    const res = await api.post(`/user/chat/user/add`, obj);
    return res;
};


export const sendMessage = async (obj: any) => {
    const res = await api.post(`/user/chat/message/send`, obj,
        { headers: { "Content-Type": "multipart/form-data" } }
    );
    return res;
};

export const getMessages = async (chatId: string) => {
    const res = await api.get(`/user/chat/messages/${chatId}`);
    return res;
}

export const rejectGroupInvite = async (obj: any) => {
    const res = await api.post(`/user/chat/user/reject-group-invite`, obj);
    return res;
}


export const acceptGroupInvite = async (obj: any) => {
    const res = await api.post(`/user/chat/user/accept-group-invite`, obj);
    return res;
}
