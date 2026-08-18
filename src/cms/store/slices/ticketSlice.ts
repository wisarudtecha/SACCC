// /src/store/slices/ticketSlice.ts
/**
 * Ticket Management State Slice
 * Handles ticket-related UI state and local operations
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type { TicketState, Ticket, Filter, PaginationInfo } from "@/cms/types";

const initialState: TicketState = {
  tickets: [],
  currentTicket: null,
  filters: [],
  pagination: {
    page: 1,
    limit: 20,
    total: 0,
    totalPages: 0,
    hasNext: false,
    hasPrev: false,
  },
  isLoading: false,
  error: null,
  selectedTickets: [],
};

const ticketSlice = createSlice({
  name: "tickets",
  initialState,
  reducers: {
    // Loading states
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.isLoading = action.payload;
    },

    // Error handling
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },

    clearError: (state) => {
      state.error = null;
    },

    // Ticket management
    setTickets: (state, action: PayloadAction<Ticket[]>) => {
      state.tickets = action.payload;
    },

    addTicket: (state, action: PayloadAction<Ticket>) => {
      state.tickets.unshift(action.payload);
    },

    updateTicket: (state, action: PayloadAction<{ id: string; updates: Partial<Ticket> }>) => {
      const { id, updates } = action.payload;
      const ticketIndex = state.tickets.findIndex(ticket => ticket.id === id);
      
      if (ticketIndex !== -1) {
        state.tickets[ticketIndex] = { ...state.tickets[ticketIndex], ...updates };
      }
      
      // Update current ticket if it"s the same one
      if (state.currentTicket?.id === id) {
        state.currentTicket = { ...state.currentTicket, ...updates };
      }
    },

    removeTicket: (state, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      state.tickets = state.tickets.filter(ticket => ticket.id !== ticketId);
      
      // Clear current ticket if it was deleted
      if (state.currentTicket?.id === ticketId) {
        state.currentTicket = null;
      }
      
      // Remove from selected tickets
      state.selectedTickets = state.selectedTickets.filter(id => id !== ticketId);
    },

    setCurrentTicket: (state, action: PayloadAction<Ticket | null>) => {
      state.currentTicket = action.payload;
    },

    // Pagination
    setPagination: (state, action: PayloadAction<PaginationInfo>) => {
      state.pagination = action.payload;
    },

    // Filters
    addFilter: (state, action: PayloadAction<Filter>) => {
      const existingFilterIndex = state.filters.findIndex(
        filter => filter.field === action.payload.field
      );
      
      if (existingFilterIndex !== -1) {
        state.filters[existingFilterIndex] = action.payload;
      } else {
        state.filters.push(action.payload);
      }
    },

    removeFilter: (state, action: PayloadAction<string>) => {
      const fieldName = action.payload;
      state.filters = state.filters.filter(filter => filter.field !== fieldName);
    },

    clearFilters: (state) => {
      state.filters = [];
    },

    setFilters: (state, action: PayloadAction<Filter[]>) => {
      state.filters = action.payload;
    },

    // Selection management
    selectTicket: (state, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      if (!state.selectedTickets.includes(ticketId)) {
        state.selectedTickets.push(ticketId);
      }
    },

    deselectTicket: (state, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      state.selectedTickets = state.selectedTickets.filter(id => id !== ticketId);
    },

    // selectAllTickets: (state) => {
    //   state.selectedTickets = state.tickets.map(ticket => ticket.id);
    // },

    clearSelection: (state) => {
      state.selectedTickets = [];
    },

    toggleTicketSelection: (state, action: PayloadAction<string>) => {
      const ticketId = action.payload;
      const isSelected = state.selectedTickets.includes(ticketId);
      
      if (isSelected) {
        state.selectedTickets = state.selectedTickets.filter(id => id !== ticketId);
      } else {
        state.selectedTickets.push(ticketId);
      }
    },

    // Bulk operations
    // updateMultipleTickets: (state, action: PayloadAction<{ ids: string[]; updates: Partial<Ticket> }>) => {
    //   const { ids, updates } = action.payload;
      
    //   state.tickets = state.tickets.map(ticket => 
    //     ids.includes(ticket.id) ? { ...ticket, ...updates } : ticket
    //   );
    // },

    // Reset state
    resetTicketState: (state) => {
      console.log(state);
      return { ...initialState };
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setTickets,
  addTicket,
  updateTicket,
  removeTicket,
  setCurrentTicket,
  setPagination,
  addFilter,
  removeFilter,
  clearFilters,
  setFilters,
  // selectTicket,
  deselectTicket,
  // selectAllTickets,
  clearSelection,
  toggleTicketSelection,
  // updateMultipleTickets,
  resetTicketState,
} = ticketSlice.actions;

export default ticketSlice.reducer;
