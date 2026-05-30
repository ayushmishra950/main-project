

import api from "@/axios/axios";



export const roleAssign = async (obj: any) => {
    const res = await api.patch(`/admin/user/role/assign`, obj);
    return res;
}