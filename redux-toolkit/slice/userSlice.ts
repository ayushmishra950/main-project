import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { User } from "../../type";

// 1. STATE TYPE DEFINE KARO
interface UserState {
  userList: User[];
  userCount: number;
  userData: any | null;
}

// 2. INITIAL STATE WITH TYPE
const initialState: UserState = {
  userList: [],
  userCount: 0,
  userData: null,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserList: (state, action: PayloadAction<User[]>) => {
      state.userList = action.payload;
    },

    setUserCount: (state, action: PayloadAction<number>) => {
      state.userCount = action.payload;
    },

    setUserData: (state, action: PayloadAction<any>) => {
      state.userData = action.payload;
    },

    setUpdateUser: (state, action: PayloadAction<User>) => {
      if (state.userData?._id === action.payload?._id) {
        state.userData = action.payload;
      }
    },
  },
});


export const { setUserList, setUserCount, setUserData, setUpdateUser} = userSlice.actions;
export default userSlice.reducer;