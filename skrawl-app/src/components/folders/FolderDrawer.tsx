import { useState, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, Modal, ScrollView } from 'react-native';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { useFolderStore } from '@/src/store/folder-store';
import { useNoteStore } from '@/src/store/note-store';
import { useUndoStore } from '@/src/store/undo-store';
import type { Folder } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

interface Props {
  visible: boolean;
  onClose: () => void;
}

const folderColors = ['#FF5A5A', '#FFB86A', '#FFE66A', '#6AFFCB', '#6AB4FF', '#B06AFF', '#FF6AC2', '#9595A5'];

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
}

export function FolderDrawer({ visible, onClose }: Props) {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const currentFolder = useUIStore((s) => s.currentFolder);
  const setCurrentFolder = useUIStore((s) => s.setCurrentFolder);
  const folders = useFolderStore((s) => s.folders);
  const addFolder = useFolderStore((s) => s.addFolder);
  const updateFolder = useFolderStore((s) => s.updateFolder);
  const deleteFolder = useFolderStore((s) => s.deleteFolder);
  const loadNotes = useNoteStore((s) => s.loadNotes);
  const updateNote = useNoteStore((s) => s.updateNote);
  const notes = useNoteStore((s) => s.notes);
  const pushUndo = useUndoStore((s) => s.push);

  const [editingFolder, setEditingFolder] = useState<Folder | null>(null);
  const [newName, setNewName] = useState('');
  const [newColor, setNewColor] = useState<string | null>(null);
  const [newParentId, setNewParentId] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [moveMode, setMoveMode] = useState<string | null>(null); // noteId being moved

  // Build folder tree: top-level folders + their children
  const { topLevel, childrenMap } = useMemo(() => {
    const top = folders.filter((f) => !f.parentId);
    const childMap: Record<string, Folder[]> = {};
    for (const f of folders) {
      if (f.parentId) {
        if (!childMap[f.parentId]) childMap[f.parentId] = [];
        childMap[f.parentId].push(f);
      }
    }
    return { topLevel: top, childrenMap: childMap };
  }, [folders]);

  const openCreateEditor = (parentId: string | null = null) => {
    setEditingFolder(null);
    setNewName('');
    setNewColor(folderColors[0]);
    setNewParentId(parentId);
    setShowEditor(true);
  };

  const openEditEditor = (folder: Folder) => {
    setEditingFolder(folder);
    setNewName(folder.name);
    setNewColor(folder.color);
    setNewParentId(folder.parentId);
    setShowEditor(true);
  };

  const handleSave = async () => {
    const name = newName.trim();
    if (!name) return;

    if (editingFolder) {
      await updateFolder({ ...editingFolder, name, color: newColor, parentId: newParentId });
    } else {
      const folder: Folder = {
        id: generateId(),
        name,
        context,
        parentId: newParentId,
        icon: 'folder',
        color: newColor,
        sort: folders.length,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        isDirty: true,
      };
      await addFolder(folder);
    }
    setShowEditor(false);
  };

  const handleDelete = async () => {
    if (!editingFolder) return;
    // Also delete sub-folders
    const children = childrenMap[editingFolder.id] || [];
    for (const child of children) {
      await deleteFolder(child.id);
    }
    if (currentFolder === editingFolder.id) setCurrentFolder(null);
    await deleteFolder(editingFolder.id);
    await loadNotes(context);
    setShowEditor(false);

    pushUndo('Folder deleted', async () => {
      // Undo just reloads — folder is gone from DB
      await loadNotes(context);
    });
  };

  const handleMoveNote = async (noteId: string, targetFolderId: string | null) => {
    const note = notes.find((n) => n.id === noteId);
    if (!note) return;
    const prevFolderId = note.folderId;
    await updateNote({ ...note, folderId: targetFolderId });
    setMoveMode(null);

    const folderName = targetFolderId
      ? folders.find((f) => f.id === targetFolderId)?.name || 'folder'
      : 'All Notes';
    pushUndo(`Moved to ${folderName}`, async () => {
      const current = notes.find((n) => n.id === noteId);
      if (current) await updateNote({ ...current, folderId: prevFolderId });
    });
  };

  const selectFolder = (folderId: string | null) => {
    if (moveMode) return; // Don't navigate in move mode
    setCurrentFolder(folderId);
    onClose();
  };

  const getNoteCount = (folderId: string | null) => {
    if (!folderId) return notes.filter((n) => !n.isDone).length;
    return notes.filter((n) => n.folderId === folderId && !n.isDone).length;
  };

  const renderFolderRow = (folder: Folder, indent: number = 0) => {
    const isSelected = currentFolder === folder.id;
    const children = childrenMap[folder.id] || [];

    return (
      <View key={folder.id}>
        <Pressable
          style={[styles.folderRow, isSelected && { backgroundColor: c.accentGlow }, { paddingLeft: 12 + indent * 24 }]}
          onPress={() => moveMode ? handleMoveNote(moveMode, folder.id) : selectFolder(folder.id)}
          onLongPress={() => openEditEditor(folder)}
        >
          <View style={[styles.folderIcon, { backgroundColor: folder.color ? `${folder.color}22` : c.bgCard }]}>
            <Ionicons
              name={children.length > 0 ? 'folder-open' : 'folder'}
              size={18}
              color={folder.color || c.textDim}
            />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={[typography.label, { color: isSelected ? c.accent : c.text }]}>
              {folder.name}
            </Text>
          </View>
          <Text style={[typography.caption, { color: c.textMuted }]}>{getNoteCount(folder.id)}</Text>
          {!moveMode && (
            <Pressable onPress={() => openEditEditor(folder)} hitSlop={8}>
              <Ionicons name="ellipsis-horizontal" size={16} color={c.textMuted} />
            </Pressable>
          )}
          {moveMode && (
            <Ionicons name="arrow-forward-circle-outline" size={20} color={c.accent} />
          )}
        </Pressable>

        {/* Sub-folders */}
        {children.map((child) => renderFolderRow(child, indent + 1))}

        {/* Add sub-folder button (only for top-level in non-move mode) */}
        {!moveMode && indent === 0 && children.length === 0 && null}
      </View>
    );
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: c.bg }]}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={[typography.heading, { color: c.text }]}>
            {moveMode ? 'Move to Folder' : 'Folders'}
          </Text>
          <View style={styles.headerActions}>
            {moveMode && (
              <Pressable onPress={() => setMoveMode(null)} style={[styles.headerBtn, { borderColor: c.border }]}>
                <Text style={[typography.caption, { color: c.textDim }]}>Cancel</Text>
              </Pressable>
            )}
            <Pressable onPress={onClose} hitSlop={8}>
              <Ionicons name="close" size={24} color={c.textDim} />
            </Pressable>
          </View>
        </View>

        {moveMode && (
          <View style={[styles.moveBanner, { backgroundColor: c.accentGlow, borderColor: c.accent }]}>
            <Ionicons name="move-outline" size={16} color={c.accent} />
            <Text style={[typography.caption, { color: c.accent, flex: 1 }]}>
              Tap a folder to move the item
            </Text>
          </View>
        )}

        <ScrollView style={styles.list} contentContainerStyle={{ paddingBottom: 40 }}>
          {/* All Notes */}
          <Pressable
            style={[styles.folderRow, currentFolder === null && !moveMode && { backgroundColor: c.accentGlow }]}
            onPress={() => moveMode ? handleMoveNote(moveMode, null) : selectFolder(null)}
          >
            <View style={[styles.folderIcon, { backgroundColor: c.bgCard }]}>
              <Ionicons name="layers-outline" size={18} color={c.accent} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.label, { color: currentFolder === null ? c.accent : c.text }]}>
                {moveMode ? 'No Folder' : 'All Notes'}
              </Text>
            </View>
            <Text style={[typography.caption, { color: c.textMuted }]}>{getNoteCount(null)}</Text>
          </Pressable>

          {/* Folder tree */}
          {topLevel.map((folder) => renderFolderRow(folder))}

          {/* Create folder button */}
          {!moveMode && (
            <Pressable style={styles.createBtn} onPress={() => openCreateEditor()}>
              <Ionicons name="add-circle-outline" size={20} color={c.accent} />
              <Text style={[typography.label, { color: c.accent }]}>New Folder</Text>
            </Pressable>
          )}
        </ScrollView>

        {/* Notes in current folder — quick move action */}
        {!moveMode && currentFolder && (
          <View style={[styles.folderNotes, { borderTopColor: c.border }]}>
            <Text style={[typography.sectionHeader, { color: c.textMuted, paddingHorizontal: 16, paddingVertical: 8 }]}>
              ITEMS IN FOLDER
            </Text>
            <ScrollView style={{ maxHeight: 200 }}>
              {notes
                .filter((n) => n.folderId === currentFolder && !n.isDone)
                .map((note) => (
                  <Pressable
                    key={note.id}
                    style={styles.noteRow}
                    onLongPress={() => setMoveMode(note.id)}
                  >
                    <Text style={[typography.body, { color: c.text, flex: 1 }]} numberOfLines={1}>
                      {note.title || 'Untitled'}
                    </Text>
                    <Pressable onPress={() => setMoveMode(note.id)} hitSlop={8}>
                      <Ionicons name="swap-horizontal-outline" size={16} color={c.textMuted} />
                    </Pressable>
                  </Pressable>
                ))}
            </ScrollView>
          </View>
        )}

        {/* Folder editor overlay */}
        {showEditor && (
          <View style={[styles.editorOverlay, { backgroundColor: c.overlay }]}>
            <View style={[styles.editor, { backgroundColor: c.bgElevated, borderColor: c.border }]}>
              <Text style={[typography.label, { color: c.text, marginBottom: 12 }]}>
                {editingFolder ? 'Edit Folder' : 'New Folder'}
              </Text>

              <TextInput
                style={[styles.nameInput, typography.body, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput }]}
                value={newName}
                onChangeText={setNewName}
                placeholder="Folder name"
                placeholderTextColor={c.textMuted}
                autoFocus
              />

              {/* Parent folder selector */}
              <Text style={[typography.tiny, { color: c.textMuted, marginTop: 12, marginBottom: 8 }]}>PARENT FOLDER</Text>
              <View style={styles.parentRow}>
                <Pressable
                  style={[
                    styles.parentChip,
                    { borderColor: !newParentId ? c.accent : c.border },
                    !newParentId && { backgroundColor: c.accentGlow },
                  ]}
                  onPress={() => setNewParentId(null)}
                >
                  <Text style={[styles.parentLabel, { color: !newParentId ? c.accent : c.textDim }]}>None</Text>
                </Pressable>
                {topLevel
                  .filter((f) => f.id !== editingFolder?.id)
                  .map((f) => {
                    const selected = newParentId === f.id;
                    return (
                      <Pressable
                        key={f.id}
                        style={[
                          styles.parentChip,
                          { borderColor: selected ? c.accent : c.border },
                          selected && { backgroundColor: c.accentGlow },
                        ]}
                        onPress={() => setNewParentId(f.id)}
                      >
                        {f.color && <View style={[styles.parentDot, { backgroundColor: f.color }]} />}
                        <Text style={[styles.parentLabel, { color: selected ? c.accent : c.textDim }]} numberOfLines={1}>
                          {f.name}
                        </Text>
                      </Pressable>
                    );
                  })}
              </View>

              <Text style={[typography.tiny, { color: c.textMuted, marginTop: 12, marginBottom: 8 }]}>COLOR</Text>
              <View style={styles.colorRow}>
                {folderColors.map((fc) => (
                  <Pressable
                    key={fc}
                    style={[styles.colorDot, { backgroundColor: fc, borderColor: newColor === fc ? c.text : 'transparent' }]}
                    onPress={() => setNewColor(fc)}
                  >
                    {newColor === fc && <Ionicons name="checkmark" size={12} color="#fff" />}
                  </Pressable>
                ))}
              </View>

              <View style={styles.editorActions}>
                {editingFolder && (
                  <Pressable onPress={handleDelete} style={[styles.deleteBtn, { borderColor: c.danger }]}>
                    <Ionicons name="trash-outline" size={16} color={c.danger} />
                    <Text style={[typography.caption, { color: c.danger }]}>Delete</Text>
                  </Pressable>
                )}
                <View style={{ flex: 1 }} />
                <Pressable onPress={() => setShowEditor(false)} style={styles.cancelBtn}>
                  <Text style={[typography.label, { color: c.textDim }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  onPress={handleSave}
                  style={[styles.saveBtn, { backgroundColor: newName.trim() ? c.accent : c.bgCard }]}
                  disabled={!newName.trim()}
                >
                  <Text style={[typography.label, { color: newName.trim() ? '#fff' : c.textMuted }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 12,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  headerBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  moveBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 8,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  list: {
    flex: 1,
    paddingHorizontal: 12,
  },
  folderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: radii.sm,
    marginBottom: 2,
  },
  folderIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  createBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 14,
    paddingHorizontal: 12,
    marginTop: 8,
  },
  folderNotes: {
    borderTopWidth: 1,
    maxHeight: 260,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  editorOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  editor: {
    width: '100%',
    borderRadius: radii.lg,
    borderWidth: 1,
    padding: 20,
  },
  nameInput: {
    borderWidth: 1,
    borderRadius: radii.sm,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  parentRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  parentChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  parentLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  parentDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  colorRow: {
    flexDirection: 'row',
    gap: 10,
    flexWrap: 'wrap',
  },
  colorDot: {
    width: 30,
    height: 30,
    borderRadius: 15,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  editorActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginTop: 20,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  saveBtn: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: radii.full,
  },
});
