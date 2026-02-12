import { createSlice } from '@reduxjs/toolkit'

interface User {
  _id: string;
  userName: string;
  email: string;
  role: number;
  designation: string;
  manager?: string[];
  subordinate?: string[];
  isActive: boolean;
}

interface HierarchyState {
  currentUser: User | null;
  immediateManager: User | null;
  allManagers: User[]; // All managers above the current user
  immediateSubordinates: User[]; // Direct reports
  allSubordinates: User[]; // All subordinates in the hierarchy
  hierarchyMap: Record<string, User[]>; // Role-based mapping
}

const initialState = {
  loader: false,
  alert: false,
  sidebar: false,
  addStaff: false,
  notification: false,
  form: {},
  link: "",
  lms: "",
  snackbar: {
    visible: false,
    message: "default message",
  },
  selectedUserIds: [],
  hierarchy: {
    currentUser: null,
    immediateManager: null,
    allManagers: [],
    immediateSubordinates: [],
    allSubordinates: [],
    hierarchyMap: {}
  } as HierarchyState,
}

export const store = createSlice({
  name: 'store',
  initialState,
  reducers: {
    snackbar: (state, action) => {
      state.snackbar = action.payload
    },
    loader: (state, action) => {
      state.loader = action.payload
    },
    alert: (state, action) => {
      state.alert = action.payload
    },
    sidebar: (state, action) => {
      state.sidebar = action.payload
    },
    form: (state, action) => {
      state.form = action.payload
    },
    link: (state, action) => {
      state.link = action.payload
    },
    lms: (state, action) => {
      state.lms = action.payload
    },
    addStaff: (state, action) => {
      state.addStaff = action.payload
    },
    toggleUserSelection: (state: any, action: any) => {
      const payload = action.payload;

      if (Array.isArray(payload)) {
        state.selectedUserIds = [...payload];
      } else {
        const userId = payload;
        if (state.selectedUserIds.includes(userId)) {
          state.selectedUserIds = state.selectedUserIds.filter((id: any) => id !== userId);
        } else {
          state.selectedUserIds.push(userId);
        }
      }
    },
    setNotification: (state, action) => {
      state.notification = action.payload
    },
    clearUserSelection: (state) => {
      state.selectedUserIds = [];
    },
    // New hierarchy management actions
    setUserHierarchy: (state, action) => {
      state.hierarchy = action.payload;
    },
    setCurrentUser: (state, action) => {
      state.hierarchy.currentUser = action.payload;
    },
    setImmediateManager: (state, action) => {
      state.hierarchy.immediateManager = action.payload;
    },
    setAllManagers: (state, action) => {
      state.hierarchy.allManagers = action.payload;
    },
    setImmediateSubordinates: (state, action) => {
      state.hierarchy.immediateSubordinates = action.payload;
    },
    setAllSubordinates: (state, action) => {
      state.hierarchy.allSubordinates = action.payload;
    },
    setHierarchyMap: (state, action) => {
      state.hierarchy.hierarchyMap = action.payload;
    },
    clearHierarchy: (state) => {
      state.hierarchy = {
        currentUser: null,
        immediateManager: null,
        allManagers: [],
        immediateSubordinates: [],
        allSubordinates: [],
        hierarchyMap: {}
      };
    },
  },
})

export const { 
  alert, 
  loader, 
  sidebar, 
  form, 
  link, 
  lms, 
  addStaff, 
  snackbar, 
  toggleUserSelection, 
  clearUserSelection, 
  setNotification,
  setUserHierarchy,
  setCurrentUser,
  setImmediateManager,
  setAllManagers,
  setImmediateSubordinates,
  setAllSubordinates,
  setHierarchyMap,
  clearHierarchy
} = store.actions;

export default store.reducer;