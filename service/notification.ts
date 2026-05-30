import api from "@/axios/axios";



export const getAllNotifications = async(userId:string) =>{
            const res = await api.get(`/user/notification/get/${userId}`);
            return res;
};



export const getDeleteNotifications = async(userId:string) =>{
            const res = await api.delete(`/user/notification/delete/${userId}`);
            return res;
};