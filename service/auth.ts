import api from "@/axios/axios";


export const registerUser = async(obj:any) => {
   const res  = await api.post(`/user/auth/register`, obj);
   return res;
};


export const loginUser = async(obj:any) => {
    const res = await api.post(`/user/auth/login`, obj);
    return res;
}



export const updateUser = async (obj: any) => {
    const res = await api.put(`/user/auth/update`, obj, {
        headers: {
            "Content-Type": "multipart/form-data",
        }
    });
    return res;
}



export const getSingleUser = async (id:string) => {
    const res = await api.get(`/user/auth/getbyid/${id}`);
    return res;
}


export const getAllUser = async () => {
    const res = await api.get(`/user/auth/get`);
    return res;
};



export const convertPremiumUser = async (obj: any) => {
    const res = await api.put(`/user/auth/convert-premium`, obj,
        {
            headers:{
                "Content-Type": "multipart/form-data",
            }
        }
    );
    return res;
};




export const getSingleUserDetail = async(id:string) => {
  const res = await api.get(`/user/auth/get-by-id/${id}`);
  return res;
};




export const deleteUserRequest = async(id:string) => {
    const res = await api.delete(`/user/auth/delete/user/${id}`);
    return res;
};


export const recoverAccount = async(id:string) => {
    const res = await api.patch(`/user/auth/recover/account/${id}`);
    return res;
}