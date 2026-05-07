import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const useUIStore = create(
  persist(
    (set) => ({
      // Sidebar state
      sidebarOpen: true,
      toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
      
      // Current mode: seller or buyer
      currentMode: 'seller',
      setCurrentMode: (mode) => set({ currentMode: mode }),
      
      // Modal states
      visitCardModalOpen: false,
      setVisitCardModalOpen: (open) => set({ visitCardModalOpen: open }),
      
      // Theme (for future use)
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'ui-storage',
      partialize: (state) => ({
        currentMode: state.currentMode,
        sidebarOpen: state.sidebarOpen,
      }),
    }
  )
);

export default useUIStore;
