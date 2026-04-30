import { create } from 'zustand';
import type { Folder, Context } from '@/src/models';
import * as db from '@/src/services/database';

interface FolderState {
  folders: Folder[];
  loadFolders: (context: Context) => Promise<void>;
  addFolder: (folder: Folder) => Promise<void>;
  updateFolder: (folder: Folder) => Promise<void>;
  deleteFolder: (id: string) => Promise<void>;
  getFolderById: (id: string) => Folder | undefined;
}

export const useFolderStore = create<FolderState>((set, get) => ({
  folders: [],

  loadFolders: async (context) => {
    const folders = await db.getAllFolders(context);
    set({ folders });
  },

  addFolder: async (folder) => {
    await db.insertFolder(folder);
    set((s) => ({ folders: [...s.folders, folder] }));
  },

  updateFolder: async (folder) => {
    await db.updateFolder(folder);
    set((s) => ({
      folders: s.folders.map((f) => (f.id === folder.id ? { ...folder, updatedAt: new Date().toISOString() } : f)),
    }));
  },

  deleteFolder: async (id) => {
    await db.deleteFolder(id);
    set((s) => ({ folders: s.folders.filter((f) => f.id !== id) }));
  },

  getFolderById: (id) => get().folders.find((f) => f.id === id),
}));
