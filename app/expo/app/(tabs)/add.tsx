import React, { useEffect } from "react";
import { useRouter } from "expo-router";
import { useAppStore } from "@/hooks/useStore";

export default function AddPage() {
  const router = useRouter();
  const { currentView, currentFamilySpace } = useAppStore();

  useEffect(() => {
    // 立即重定向到聊天界面，并传递当前上下文
    const params = new URLSearchParams();
    params.append("context", currentView);
    if (currentView === "family" && currentFamilySpace) {
      params.append("familySpaceName", currentFamilySpace.name);
      params.append("familySpaceId", currentFamilySpace.id);
    }

    router.replace(`/chat?${params.toString()}`);
  }, [currentView, currentFamilySpace]);

  // 这个页面不应该显示任何内容，因为会立即重定向
  return null;
}
