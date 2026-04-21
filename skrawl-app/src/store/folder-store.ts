import { create } from 'zustand';
import type { Folder, Context } from '@/src/models';
import * as db from '@/src/services/database';

interface FolderState {
  folders: Folder[];
  loadFolders: (context: Context) => Promise<void>;
  addFolder: (folder: Folder) => Promise<void>;
}

export const useFolderStore = create<FolderState>((set) => ({
  folders: [],

  loadFolders: async (context) => {
    const folders = await db.getAllFolders(context);
    set({ folders });
  },

  addFolder: async (folder) => {
    await db.insertFolder(folder);
    set((s) => ({ folders: [...s.folders, folder] }));
  },
}));
