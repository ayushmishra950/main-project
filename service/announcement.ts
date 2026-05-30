
import api from "@/axios/axios";



export const getAllAnnouncement = async() => {
   const res  = await api.get(`/admin/announcement/get`);
   return res;
};



export const getSingleAnnouncement = async(id:string) => {
   const res  = await api.get(`/admin/announcement/getbyid/${id}`);
   return res;
};