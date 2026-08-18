// /src/store/slices/realtimeSlice.ts
/**
 * Real-time Communication State Slice
 * Handles WebSocket connections, live updates, user presence
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { RealtimeState, User, RealtimeEvent } from "@/cms/types";

const initialState: RealtimeState = {
  connected: false,
  lastPing: null,
  activeUsers: [],
  events: [],
};

const realtimeSlice = createSlice({
  name: "realtime",
  initialState,
  reducers: {
    // Connection management
    setConnected: (state, action: PayloadAction<boolean>) => {
      state.connected = action.payload;
      if (action.payload) {
        state.lastPing = new Date();
      }
    },

    updateLastPing: (state) => {
      state.lastPing = new Date();
    },

    // Connection lost
    connectionLost: (state) => {
      state.connected = false;
      state.activeUsers = [];
    },

    // User presence
    setActiveUsers: (state, action: PayloadAction<User[]>) => {
      state.activeUsers = action.payload;
    },

    addActiveUser: (state, action: PayloadAction<User>) => {
      const user = action.payload;
      const exists = state.activeUsers.some(u => u.id === user.id);
      
      if (!exists) {
        state.activeUsers.push(user);
      }
    },

    removeActiveUser: (state, action: PayloadAction<string>) => {
      const userId = action.payload;
      state.activeUsers = state.activeUsers.filter(user => user.id !== userId);
    },

    updateActiveUser: (state, action: PayloadAction<{ userId: string; updates: Partial<User> }>) => {
      const { userId, updates } = action.payload;
      const userIndex = state.activeUsers.findIndex(user => user.id === userId);
      
      if (userIndex !== -1) {
        state.activeUsers[userIndex] = { ...state.activeUsers[userIndex], ...updates };
      }
    },

    // Real-time events
    addEvent: (state, action: PayloadAction<RealtimeEvent>) => {
      state.events.unshift(action.payload);
      
      // Keep only the last 100 events to prevent memory issues
      if (state.events.length > 100) {
        state.events = state.events.slice(0, 100);
      }
    },

    clearEvents: (state) => {
      state.events = [];
    },

    removeEvent: (state, action: PayloadAction<string>) => {
      const eventId = action.payload;
      state.events = state.events.filter(event => event.id !== eventId);
    },

    // Event handlers for different types
    handleTicketUpdate: (state, action: PayloadAction<{ ticketId: string; updates: unknown }>) => {
      const event: RealtimeEvent = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "TICKET_UPDATED",
        data: action.payload,
        timestamp: new Date(),
      };
      
      state.events.unshift(event);
    },

    handleNewComment: (state, action: PayloadAction<{ ticketId: string; comment: unknown }>) => {
      const event: RealtimeEvent = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "NEW_COMMENT",
        data: action.payload,
        timestamp: new Date(),
      };
      
      state.events.unshift(event);
    },

    handleWorkflowEvent: (state, action: PayloadAction<{ workflowId: string; event: string; data: unknown }>) => {
      const event: RealtimeEvent = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "WORKFLOW_EVENT",
        data: action.payload,
        timestamp: new Date(),
      };
      
      state.events.unshift(event);
    },

    handleUserStatusChange: (state, action: PayloadAction<{ userId: string; status: string }>) => {
      const event: RealtimeEvent = {
        id: Date.now().toString() + Math.random().toString(36),
        type: "USER_STATUS_CHANGE",
        data: action.payload,
        timestamp: new Date(),
      };
      
      state.events.unshift(event);
    },

    // Generic event handler
    handleGenericEvent: (state, action: PayloadAction<{ type: string; data: unknown }>) => {
      const event: RealtimeEvent = {
        id: Date.now().toString() + Math.random().toString(36),
        type: action.payload.type,
        data: action.payload.data,
        timestamp: new Date(),
      };
      
      state.events.unshift(event);
    },

    // Connection statistics
    updateConnectionStats: (state, action: PayloadAction<{
      latency?: number;
      reconnectAttempts?: number;
      messagesReceived?: number;
      messagesSent?: number;
    }>) => {
      // This could be expanded to track connection quality
      state.lastPing = new Date();
      console.log(action);
    },

    // Reset state
    resetRealtimeState: (state) => {
      console.log(state);
      return { ...initialState };
    },

    // Cleanup old events (for performance)
    cleanupOldEvents: (state, action: PayloadAction<number>) => {
      const maxAge = action.payload; // milliseconds
      const cutoff = new Date(Date.now() - maxAge);
      
      state.events = state.events.filter(event => 
        new Date(event.timestamp) > cutoff
      );
    },
  },
});

export const {
  setConnected,
  updateLastPing,
  connectionLost,
  setActiveUsers,
  addActiveUser,
  removeActiveUser,
  updateActiveUser,
  addEvent,
  clearEvents,
  removeEvent,
  handleTicketUpdate,
  handleNewComment,
  handleWorkflowEvent,
  handleUserStatusChange,
  handleGenericEvent,
  updateConnectionStats,
  resetRealtimeState,
  cleanupOldEvents,
} = realtimeSlice.actions;

export default realtimeSlice.reducer;
