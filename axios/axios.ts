// import axios from "axios";
// import AsyncStorage from "@react-native-async-storage/async-storage";

// const base_url = process.env.EXPO_PUBLIC_BACKEND_URL;

// const axiosInstance = axios.create({
//   baseURL: base_url,
 
// });

// // REQUEST INTERCEPTOR
// axiosInstance.interceptors.request.use(
//   async (config) => {
//     try {
//       const token = await AsyncStorage.getItem("accessToken");

//       if (token) {
//         config.headers.Authorization = `Bearer ${token}`;
//       }

//       return config;
//     } catch (error) {
//       return Promise.reject(error);
//     }
//   },
//   (error) => {
//     return Promise.reject(error);
//   }
// );

// // RESPONSE INTERCEPTOR
// axiosInstance.interceptors.response.use(
//   (response) => response,

//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url?.includes("/login")
//     ) {
//       originalRequest._retry = true;

//       try {
//         const res = await axios.post(
//           `${base_url}/user/auth/refresh`,
//           {},
        
//         );

//         const newAccessToken = res.data.accessToken;

//         // SAVE NEW TOKEN
//         await AsyncStorage.setItem("accessToken", newAccessToken);

//         // UPDATE HEADER
//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//         // RETRY ORIGINAL REQUEST
//         return axiosInstance(originalRequest);
//       } catch (err) {
//         // REMOVE TOKEN
//         await AsyncStorage.removeItem("accessToken");

//         // React Native me window.location nahi hota
//         // Yahan navigation use karna padega

//         return Promise.reject(err);
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default axiosInstance;












import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const base_url = process.env.EXPO_PUBLIC_BACKEND_URL;

const axiosInstance = axios.create({
  baseURL: base_url,
});

// REQUEST INTERCEPTOR
axiosInstance.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem("accessToken");

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }

      return config;
    } catch (error) {
      return Promise.reject(error);
    }
  },
  (error) => Promise.reject(error)
);

// RESPONSE INTERCEPTOR
axiosInstance.interceptors.response.use(
  (response) => response,

  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url?.includes("/login")
    ) {
      originalRequest._retry = true;

      try {
        // ✅ 🔥 CHANGE: send refreshToken in body
        const refreshToken = await AsyncStorage.getItem("refreshToken");

        const res = await axios.post(
          `${base_url}/user/auth/refresh`,
          {
            refreshToken, // ✅ BODY ME TOKEN SEND
          }
        );

        const newAccessToken = res.data.accessToken;

        await AsyncStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization =
          `Bearer ${newAccessToken}`;

        return axiosInstance(originalRequest);
      } catch (err) {
        await AsyncStorage.removeItem("accessToken");
        await AsyncStorage.removeItem("refreshToken");

        return Promise.reject(err);
      }
    }

    return Promise.reject(error);
  }
);

export default axiosInstance;