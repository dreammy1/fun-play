import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export const fetchThemeColors = createAsyncThunk(
  "themeColor/fetchThemeColors",
  async (_, { rejectWithValue }) => {
    try {
      const baseURL =
        import.meta.env.VITE_BASE_API_URL ||
        (typeof window !== "undefined" ? window.location.origin : "");
      const response = await fetch(`${baseURL}/theme-color`, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to fetch theme colors");
      }
      const data = await response.json();
      return {
        mainColor: data.mainColor || "#bf70ff",
        backgroundColor: data.backgroundColor || "#852100",
        mainBackgroundColor: data.mainBackgroundColor || "#0558ff",
        mainBackgroundTextColor: data.mainBackgroundTextColor || "#f9fd17",
        mobileSidebarMenuBackgroundColor: data.mobileSidebarMenuBackgroundColor || "#7757ea",
        mobileSidebarMenuIconColor: data.mobileSidebarMenuIconColor || "#880707",
        mobileSidebarMenuTextColor: data.mobileSidebarMenuTextColor || "#ffadad",
        noticeBackgroundColor: data.noticeBackgroundColor || "#c21414",
        noticeTextColor: data.noticeTextColor || "#f9861a",
        secondaryButtonBackgroundColor: data.secondaryButtonBackgroundColor || "#85ff0a",
        secondaryButtonTextColor: data.secondaryButtonTextColor || "#c2c1bd",
        secondaryColor: data.secondaryColor || "#ff0000",
        textColor: data.textColor || "#ffd814",
      };
    } catch (err) {
      return rejectWithValue(err.message || "Network error");
    }
  }
);

const initialState = {
  mainColor: "#bf70ff",
  backgroundColor: "#852100",
  mainBackgroundColor: "#0558ff",
  mainBackgroundTextColor: "#f9fd17",
  mobileSidebarMenuBackgroundColor: "#7757ea",
  mobileSidebarMenuIconColor: "#880707",
  mobileSidebarMenuTextColor: "#ffadad",
  noticeBackgroundColor: "#c21414",
  noticeTextColor: "#f9861a",
  secondaryButtonBackgroundColor: "#85ff0a",
  secondaryButtonTextColor: "#c2c1bd",
  secondaryColor: "#ff0000",
  textColor: "#ffd814",
  loading: false,
  error: null,
};

const themeColorSlice = createSlice({
  name: "themeColor",
  initialState,
  reducers: {
    setMainColor: (state, action) => {
      state.mainColor = action.payload;
    },
    setBackgroundColor: (state, action) => {
      state.backgroundColor = action.payload;
    },
    setMainBackgroundColor: (state, action) => {
      state.mainBackgroundColor = action.payload;
    },
    setMainBackgroundTextColor: (state, action) => {
      state.mainBackgroundTextColor = action.payload;
    },
    setMobileSidebarMenuBackgroundColor: (state, action) => {
      state.mobileSidebarMenuBackgroundColor = action.payload;
    },
    setMobileSidebarMenuIconColor: (state, action) => {
      state.mobileSidebarMenuIconColor = action.payload;
    },
    setMobileSidebarMenuTextColor: (state, action) => {
      state.mobileSidebarMenuTextColor = action.payload;
    },
    setNoticeBackgroundColor: (state, action) => {
      state.noticeBackgroundColor = action.payload;
    },
    setNoticeTextColor: (state, action) => {
      state.noticeTextColor = action.payload;
    },
    setSecondaryButtonBackgroundColor: (state, action) => {
      state.secondaryButtonBackgroundColor = action.payload;
    },
    setSecondaryButtonTextColor: (state, action) => {
      state.secondaryButtonTextColor = action.payload;
    },
    setSecondaryColor: (state, action) => {
      state.secondaryColor = action.payload;
    },
    setTextColor: (state, action) => {
      state.textColor = action.payload;
    },
    resetColors: (state) => {
      state.mainColor = "";
      state.backgroundColor = "";
      state.mainBackgroundColor = "";
      state.mainBackgroundTextColor = "";
      state.mobileSidebarMenuBackgroundColor = "";
      state.mobileSidebarMenuIconColor = "";
      state.mobileSidebarMenuTextColor = "";
      state.noticeBackgroundColor = "";
      state.noticeTextColor = "";
      state.secondaryButtonBackgroundColor = "";
      state.secondaryButtonTextColor = "";
      state.secondaryColor = "";
      state.textColor = "";
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchThemeColors.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchThemeColors.fulfilled, (state, action) => {
        state.loading = false;
        state.mainColor = action.payload.mainColor;
        state.backgroundColor = action.payload.backgroundColor;
        state.mainBackgroundColor = action.payload.mainBackgroundColor;
        state.mainBackgroundTextColor = action.payload.mainBackgroundTextColor;
        state.mobileSidebarMenuBackgroundColor = action.payload.mobileSidebarMenuBackgroundColor;
        state.mobileSidebarMenuIconColor = action.payload.mobileSidebarMenuIconColor;
        state.mobileSidebarMenuTextColor = action.payload.mobileSidebarMenuTextColor;
        state.noticeBackgroundColor = action.payload.noticeBackgroundColor;
        state.noticeTextColor = action.payload.noticeTextColor;
        state.secondaryButtonBackgroundColor = action.payload.secondaryButtonBackgroundColor;
        state.secondaryButtonTextColor = action.payload.secondaryButtonTextColor;
        state.secondaryColor = action.payload.secondaryColor;
        state.textColor = action.payload.textColor;
      })
      .addCase(fetchThemeColors.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      });
  },
});

export const {
  setMainColor,
  setBackgroundColor,
  setMainBackgroundColor,
  setMainBackgroundTextColor,
  setMobileSidebarMenuBackgroundColor,
  setMobileSidebarMenuIconColor,
  setMobileSidebarMenuTextColor,
  setNoticeBackgroundColor,
  setNoticeTextColor,
  setSecondaryButtonBackgroundColor,
  setSecondaryButtonTextColor,
  setSecondaryColor,
  setTextColor,
  resetColors,
} = themeColorSlice.actions;
export default themeColorSlice.reducer;
