import { create } from "zustand";
import axios from "axios";


axios.defaults.withCredentials = true;

interface User {
  _id: string;
  email: string;
  name: string;
}

interface UserStore {
  user: User | null;
  setUser: (user: User | null) => void;
  refetchUser: () => Promise<User | null>;
  logout: () => Promise<void>;
}

const useUserStore = create<UserStore>((set) => ({
  user: null,
  setUser: (user) => set({ user }),

  refetchUser: async () => {
    try {
      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/api/user/auth/refetch`
      );

      console.log("User data received:", response.data);
      set({ user: response.data });
      return response.data;
    } catch (error) {
      console.error("Error refetching user:", error);
      set({ user: null });
      return null;
    }
  },

  logout: async () => {
    try {
      await axios.get(`${import.meta.env.VITE_API_URL}/api/user/auth/logout`);
      set({ user: null });
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  },
}));

useUserStore.getState().refetchUser();

export default useUserStore;
