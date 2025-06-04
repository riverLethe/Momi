import { create } from "zustand";
import { FamilySpace } from "@/types/family.types";

type ViewMode = "personal" | "family";

interface ViewState {
  viewMode: ViewMode;
  currentFamilySpace: FamilySpace | null;
  setViewMode: (mode: ViewMode) => void;
  setCurrentFamilySpace: (familySpace: FamilySpace | null) => void;
}

export const useViewStore = create<ViewState>((set) => ({
  viewMode: "personal",
  currentFamilySpace: null,

  setViewMode: (mode) => set({ viewMode: mode }),
  setCurrentFamilySpace: (familySpace) =>
    set({
      currentFamilySpace: familySpace,
      // If setting a family space, automatically switch to family view
      viewMode: familySpace ? "family" : "personal",
    }),
}));
