import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UiState {
  hasServerError: boolean;
}

const initialState: UiState = {
  hasServerError: false,
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    setServerError: (state, action: PayloadAction<boolean>) => {
      state.hasServerError = action.payload;
    },
  },
});

export const { setServerError } = uiSlice.actions;
export default uiSlice.reducer;
