// /src/store/slices/workflowSlice.ts
/**
 * Workflow Management State Slice
 * Handles workflow designer and execution state
 */

import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import type {
  WorkflowState,
  // WorkflowStep
} from "@/cms/types";
import type { Workflow } from "@/cms/types/workflow"

const initialState: WorkflowState = {
  workflows: [],
  currentWorkflow: null,
  templates: [],
  isDesignerOpen: false,
  isLoading: false,
  error: null,
};

const workflowSlice = createSlice({
  name: "workflows",
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

    // Workflow management
    setWorkflows: (state, action: PayloadAction<Workflow[]>) => {
      state.workflows = action.payload;
    },

    addWorkflow: (state, action: PayloadAction<Workflow>) => {
      state.workflows.push(action.payload);
    },

    updateWorkflow: (state, action: PayloadAction<{ id: string; updates: Partial<Workflow> }>) => {
      const { id, updates } = action.payload;
      const workflowIndex = state.workflows.findIndex(workflow => workflow.id === id);
      
      if (workflowIndex !== -1) {
        state.workflows[workflowIndex] = { ...state.workflows[workflowIndex], ...updates };
      }
      
      // Update current workflow if it"s the same one
      if (state.currentWorkflow?.id === id) {
        state.currentWorkflow = { ...state.currentWorkflow, ...updates };
      }
    },

    removeWorkflow: (state, action: PayloadAction<string>) => {
      const workflowId = action.payload;
      state.workflows = state.workflows.filter(workflow => workflow.id !== workflowId);
      
      // Clear current workflow if it was deleted
      if (state.currentWorkflow?.id === workflowId) {
        state.currentWorkflow = null;
      }
    },

    setCurrentWorkflow: (state, action: PayloadAction<Workflow | null>) => {
      state.currentWorkflow = action.payload;
    },

    // Workflow Designer
    openDesigner: (state, action: PayloadAction<Workflow | null>) => {
      state.isDesignerOpen = true;
      state.currentWorkflow = action.payload;
    },

    closeDesigner: (state) => {
      state.isDesignerOpen = false;
      state.currentWorkflow = null;
    },

    // Workflow Steps Management (for designer)
    // addWorkflowStep: (state, action: PayloadAction<WorkflowStep>) => {
    //   if (state.currentWorkflow) {
    //     state.currentWorkflow.steps.push(action.payload);
    //   }
    // },

    // updateWorkflowStep: (state, action: PayloadAction<{ stepId: string; updates: Partial<WorkflowStep> }>) => {
    //   const { stepId, updates } = action.payload;
      
    //   if (state.currentWorkflow) {
    //     const stepIndex = state.currentWorkflow.steps.findIndex(step => step.id === stepId);
    //     if (stepIndex !== -1) {
    //       state.currentWorkflow.steps[stepIndex] = {
    //         ...state.currentWorkflow.steps[stepIndex],
    //         ...updates
    //       };
    //     }
    //   }
    // },

    // removeWorkflowStep: (state, action: PayloadAction<string>) => {
    //   const stepId = action.payload;
      
    //   if (state.currentWorkflow) {
    //     state.currentWorkflow.steps = state.currentWorkflow.steps.filter(step => step.id !== stepId);
    //   }
    // },

    // reorderWorkflowSteps: (state, action: PayloadAction<WorkflowStep[]>) => {
    //   if (state.currentWorkflow) {
    //     state.currentWorkflow.steps = action.payload;
    //   }
    // },

    // Templates
    setTemplates: (state, action: PayloadAction<Workflow[]>) => {
      state.templates = action.payload;
    },

    addTemplate: (state, action: PayloadAction<Workflow>) => {
      state.templates.push(action.payload);
    },

    // Reset state
    resetWorkflowState: (state) => {
      console.log(state);
      return { ...initialState };
    },
  },
});

export const {
  setLoading,
  setError,
  clearError,
  setWorkflows,
  addWorkflow,
  updateWorkflow,
  removeWorkflow,
  setCurrentWorkflow,
  openDesigner,
  closeDesigner,
  // addWorkflowStep,
  // updateWorkflowStep,
  // removeWorkflowStep,
  // reorderWorkflowSteps,
  setTemplates,
  addTemplate,
  resetWorkflowState,
} = workflowSlice.actions;

export default workflowSlice.reducer;
