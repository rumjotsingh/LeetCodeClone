import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axiosInstance from "../../config/axios";
import { act } from "react";

// Initial State
const initialState = {
  user: null,
  token: null,
  streaks: {}, // date: count format
  loading: false,
  profile: null,
  error: null,
};

// ========== Thunks ==========

// Register
export const registerUser = createAsyncThunk(
  "auth/registerUser",
  async (formData, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/api/v1/register", formData);
      return { user: res.data.user };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Registration failed"
      );
    }
  }
);

// Normal Login
export const loginUser = createAsyncThunk(
  "auth/loginUser",
  async (credentials, thunkAPI) => {
    try {
      const res = await axiosInstance.post("/api/v1/login", credentials);
      return {
        user: res.data.user,
        token: res.data.token,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Login failed"
      );
    }
  }
);

// Google Login
export const loginWithGoogle = createAsyncThunk(
  "auth/loginWithGoogle",
  async (id_token, thunkAPI) => {
    try {
      // Send token from query param to your backend for verification
      const res = await axiosInstance.post("/api/v1/auth/google", {
        id_token,
      });

      const { user, token: authToken } = res.data;

      // Optionally: set default auth header here
      axiosInstance.defaults.headers.common[
        "Authorization"
      ] = `Bearer ${authToken}`;

      return {
        user,
        token: authToken,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Google login failed"
      );
    }
  }
);

// Get User Profile
export const getUserProfile = createAsyncThunk(
  "auth/getUserProfile",
  async (_, thunkAPI) => {
    try {
      const res = await axiosInstance.get("/api/v1/user/profile");

      return res.data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Failed to fetch profile"
      );
    }
  }
);

// Load User from Storage
export const loadUserFromStorage = createAsyncThunk(
  "auth/loadUserFromStorage",
  async (_, thunkAPI) => {
    try {
      const user = localStorage.getItem("user");
      const token = localStorage.getItem("token");

      if (!user || !token) {
        return thunkAPI.rejectWithValue("No user data in storage");
      }

      return {
        user: JSON.parse(user),
        token: token,
      };
    } catch (error) {
      return thunkAPI.rejectWithValue("Failed to load user data");
    }
  }
);

// Update User Info
export const updateUserProfile = createAsyncThunk(
  "auth/updateUserProfile",
  async (updatedData, thunkAPI) => {
    try {
      const res = await axiosInstance.put("/api/v1/user/profile", updatedData);
      return res.data.user;
    } catch (error) {
      return thunkAPI.rejectWithValue(
        error.response?.data?.message || "Update failed"
      );
    }
  }
);

// ========== Slice ==========

const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    logoutUser: (state) => {
      state.user = null;
      state.token = null;
      state.streaks = {};
      localStorage.removeItem("user");
      localStorage.removeItem("token");
    },
    setUserFromStorage: (state, action) => {
      state.user = action.payload.user;
      state.token = action.payload.token;
    },
    updateUserStreak: (state, action) => {
      const date = action.payload;
      state.streaks[date] = (state.streaks[date] || 0) + 1;
    },
    setUserStreaks: (state, action) => {
      state.streaks = action.payload; // should be a { "2025-06-27": 1, ... } object
    },
  },
  extraReducers: (builder) => {
    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Google Login
    builder
      .addCase(loginWithGoogle.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginWithGoogle.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
        localStorage.setItem("user", JSON.stringify(action.payload.user));
        localStorage.setItem("token", action.payload.token);
      })
      .addCase(loginWithGoogle.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Get Profile
    builder
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;

        state.profile = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.profile = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });

    // Load User from Storage
    builder
      .addCase(loadUserFromStorage.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadUserFromStorage.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loadUserFromStorage.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
        state.user = null;
        state.token = null;
      });
  },
});

export const {
  logoutUser,
  setUserFromStorage,
  updateUserStreak,
  setUserStreaks,
} = authSlice.actions;

export default authSlice.reducer;
