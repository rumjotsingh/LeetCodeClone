import axiosInstance from "@/config/axios";
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

// Async thunk to create a contest
export const createContest = createAsyncThunk(
  "contest/createContest",
  async (contestData, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.post("/api/v1/contest", contestData);
      return response.data; // assuming the created contest info is returned
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk to get all contests
export const fetchContests = createAsyncThunk(
  "contest/fetchContests",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get("/api/v1/contest");
      return response.data; // assuming an array of contests
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

// Async thunk to get a contest by ID
export const fetchContestById = createAsyncThunk(
  "contest/fetchContestById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axiosInstance.get(`/api/v1/contest/${id}`);
      return response.data; // single contest obj
    } catch (error) {
      return rejectWithValue(error.response?.data || error.message);
    }
  }
);

const contestSlice = createSlice({
  name: "contest",
  initialState: {
    contests: [],
    contest: null,
    loading: false,
    error: null,
    createSuccess: false,
  },
  reducers: {
    clearCreateSuccess(state) {
      state.createSuccess = false;
    },
    clearError(state) {
      state.error = null;
    },
    clearContest(state) {
      state.contest = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Create Contest
      .addCase(createContest.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.createSuccess = false;
      })
      .addCase(createContest.fulfilled, (state, action) => {
        state.loading = false;
        state.createSuccess = true;
        state.contests.unshift(action.payload);
      })
      .addCase(createContest.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to create contest";
      })

      // Fetch all Contests
      .addCase(fetchContests.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchContests.fulfilled, (state, action) => {
        state.loading = false;

        state.contests = action.payload;
      })
      .addCase(fetchContests.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch contests";
      })

      // Fetch contest by ID
      .addCase(fetchContestById.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.contest = null;
      })
      .addCase(fetchContestById.fulfilled, (state, action) => {
        state.loading = false;
        state.contest = action.payload;
      })
      .addCase(fetchContestById.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload || "Failed to fetch contest";
      });
  },
});

export const { clearCreateSuccess, clearError, clearContest } =
  contestSlice.actions;

export default contestSlice.reducer;
