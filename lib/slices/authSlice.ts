import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  id: number;
  name: string;
  email: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

const getInitialState = (): AuthState => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("authToken");
    const userStr = localStorage.getItem("user");
    if (token) {
      try {
        const user = userStr ? JSON.parse(userStr) : { id: 1, name: "Admin", email: "admin@dreamdollars.com" };
        return {
          user,
          isAuthenticated: true,
        };
      } catch {
        return {
          user: { id: 1, name: "Admin", email: "admin@dreamdollars.com" },
          isAuthenticated: true,
        };
      }
    }
  }
  return {
    user: null,
    isAuthenticated: false,
  };
};

const initialState: AuthState = getInitialState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    login: (state, action: PayloadAction<any | undefined>) => {
      state.isAuthenticated = true;
      if (action.payload) {
        state.user = action.payload;
      } else if (!state.user) {
        state.user = { id: 1, name: 'Admin', email: 'admin@dreamdollars.com' };
      }
    },
    updateUser: (state, action: PayloadAction<any>) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
      } else {
        state.user = action.payload;
      }
      if (typeof window !== "undefined") {
        localStorage.setItem("user", JSON.stringify(state.user));
      }
    },
    logout: (state) => {
      state.isAuthenticated = false;
      state.user = null;
      if (typeof window !== "undefined") {
        localStorage.removeItem("authToken");
        localStorage.removeItem("user");
        localStorage.removeItem("fcmToken");
        localStorage.removeItem("deviceuniqueid");
      }
    },
  },
});

export const { login, logout, updateUser } = authSlice.actions;
export default authSlice.reducer;