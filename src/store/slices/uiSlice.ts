import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface UIState {
  sidebar: {
    dashboard: {
      isOpen: boolean;
    };
    settings: {
      isOpen: boolean;
    };
  };
}

const initialState: UIState = {
  sidebar: {
    dashboard: {
      isOpen: true,
    },
    settings: {
      isOpen: true,
    },
  },
};

const uiSlice = createSlice({
  name: "ui",
  initialState,
  reducers: {
    toggleDashboardSidebar: (state) => {
      state.sidebar.dashboard.isOpen = !state.sidebar.dashboard.isOpen;
    },
    setDashboardSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.dashboard.isOpen = action.payload;
    },
    toggleSettingsSidebar: (state) => {
      state.sidebar.settings.isOpen = !state.sidebar.settings.isOpen;
    },
    setSettingsSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebar.settings.isOpen = action.payload;
    },
    closeAllSidebars: (state) => {
      state.sidebar.dashboard.isOpen = false;
      state.sidebar.settings.isOpen = false;
    },
  },
});

export const {
  toggleDashboardSidebar,
  setDashboardSidebarOpen,
  toggleSettingsSidebar,
  setSettingsSidebarOpen,
  closeAllSidebars,
} = uiSlice.actions;

export default uiSlice.reducer;
