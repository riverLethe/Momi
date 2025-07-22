import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { FamilySpace } from "@/types/family.types";
import { updateUserPreferences, getUserPreferences } from "@/utils/userPreferences.utils";
import { storage, STORAGE_KEYS } from "@/utils/storage.utils";

type ViewMode = "personal" | "family";

interface ViewState {
  viewMode: ViewMode;
  currentFamilySpace: FamilySpace | null;
  setViewMode: (mode: ViewMode) => void;
  setCurrentFamilySpace: (familySpace: FamilySpace | null) => void;
  initializeViewMode: () => Promise<void>;
}

export const useViewStore = create<ViewState>()(
  persist(
    (set, get) => ({
      viewMode: "personal",
      currentFamilySpace: null,

      setViewMode: async (mode) => {
        set({ viewMode: mode });
        // 同时更新用户偏好设置
        try {
          await updateUserPreferences({ viewMode: mode });
        } catch (error) {
          console.error("Failed to save view mode preference:", error);
        }
      },

      setCurrentFamilySpace: async (familySpace) => {
        const newViewMode = familySpace ? "family" : "personal";
        set({
          currentFamilySpace: familySpace,
          // If setting a family space, automatically switch to family view
          viewMode: newViewMode,
        });
        
        // 保存视图模式偏好
        try {
          await updateUserPreferences({ viewMode: newViewMode });
        } catch (error) {
          console.error("Failed to save view mode preference:", error);
        }
      },

      initializeViewMode: async () => {
        try {
          const preferences = await getUserPreferences();
          if (preferences.viewMode) {
            set({ viewMode: preferences.viewMode });
          }
        } catch (error) {
          console.error("Failed to initialize view mode from preferences:", error);
        }
      },
    }),
    {
      name: STORAGE_KEYS.VIEW_STORE, // 使用统一的存储键名
      storage: createJSONStorage(() => ({
        getItem: async (name: string) => {
          const value = await storage.getItem<string>(name);
          return value;
        },
        setItem: async (name: string, value: string) => {
          await storage.setItem(name, value);
        },
        removeItem: async (name: string) => {
          await storage.removeItem(name);
        },
      })),
      // 只持久化 viewMode，不持久化 currentFamilySpace（因为家庭空间信息可能会变化）
      partialize: (state) => ({ viewMode: state.viewMode }),
    }
  )
);
