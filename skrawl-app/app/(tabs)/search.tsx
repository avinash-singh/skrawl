import { useState, useCallback, useRef, useMemo } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView } from 'react-native';
import { FlashList } from '@shopify/flash-list';
import { useThemeColors, colors, typography, spacing, radii } from '@/src/theme';
import { useUIStore } from '@/src/store/ui-store';
import { useNoteStore } from '@/src/store/note-store';
import { RowItem } from '@/src/components/list/RowItem';
import { DetailSheet } from '@/src/components/detail/DetailSheet';
import * as db from '@/src/services/database';
import type { Note, NoteType } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

type FilterType = 'all' | NoteType;

const filters: { value: FilterType; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
  { value: 'all', label: 'All', icon: 'layers-outline' },
  { value: 'note', label: 'Notes', icon: 'document-text-outline' },
  { value: 'list', label: 'Lists', icon: 'checkbox-outline' },
  { value: 'task', label: 'Tasks', icon: 'checkmark-circle-outline' },
];

export default function SearchScreen() {
  const c = useThemeColors();
  const context = useUIStore((s) => s.context);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Note[]>([]);
  const [filterType, setFilterType] = useState<FilterType>('all');
  const [includeCompleted, setIncludeCompleted] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [detailNoteId, setDetailNoteId] = useState<string | null>(null);
  const [recentIds, setRecentIds] = useState<string[]>([]);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const allNotes = useNoteStore((s) => s.notes);

  // Extract all #tags from notes
  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    for (const n of allNotes) {
      const bodyTags = (n.body || '').match(/#(\w+)/g);
      const titleTags = (n.title || '').match(/#(\w+)/g);
      [...(bodyTags || []), ...(titleTags || [])].forEach((t) => tagSet.add(t.slice(1).toLowerCase()));
    }
    return Array.from(tagSet).sort();
  }, [allNotes]);
  const [recentNotes, setRecentNotes] = useState<Note[]>([]);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inputRef = useRef<TextInput>(null);

  const performSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      setHasSearched(false);
      return;
    }
    setHasSearched(true);
    const allResults = await db.searchNotes(q.trim(), context);
    setResults(allResults);
  }, [context]);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => performSearch(text), 250);
  };

  const filteredResults = results.filter((n) => {
    if (!includeCompleted && n.isDone) return false;
    if (filterType !== 'all' && n.type !== filterType) return false;
    if (selectedTag) {
      const text = `${n.title} ${n.body}`.toLowerCase();
      if (!text.includes(`#${selectedTag}`)) return false;
    }
    return true;
  });

  const trackRecent = (noteId: string) => {
    setRecentIds((prev) => {
      const next = [noteId, ...prev.filter((id) => id !== noteId)].slice(0, 5);
      return next;
    });
  };

  const openNote = (note: Note) => {
    trackRecent(note.id);
    setRecentNotes((prev) => {
      const exists = prev.find((n) => n.id === note.id);
      const next = exists ? prev : [note, ...prev];
      return next.slice(0, 5);
    });
    setDetailNoteId(note.id);
  };

  // Render snippet with highlighted matches
  const HighlightedText = ({ text, style }: { text: string; style: any }) => {
    if (!text || !text.includes('<<')) {
      return <Text style={style} numberOfLines={1}>{text || ''}</Text>;
    }

    const parts: { text: string; highlight: boolean }[] = [];
    let remaining = text;
    while (remaining.length > 0) {
      const start = remaining.indexOf('<<');
      if (start === -1) {
        parts.push({ text: remaining, highlight: false });
        break;
      }
      if (start > 0) parts.push({ text: remaining.slice(0, start), highlight: false });
      const end = remaining.indexOf('>>', start);
      if (end === -1) {
        parts.push({ text: remaining.slice(start), highlight: false });
        break;
      }
      parts.push({ text: remaining.slice(start + 2, end), highlight: true });
      remaining = remaining.slice(end + 2);
    }

    return (
      <Text style={style} numberOfLines={2}>
        {parts.map((p, i) =>
          p.highlight ? (
            <Text key={i} style={{ backgroundColor: c.accentGlow, color: c.accent, fontWeight: '700' }}>
              {p.text}
            </Text>
          ) : (
            <Text key={i}>{p.text}</Text>
          )
        )}
      </Text>
    );
  };

  const showRecents = !hasSearched && !query.trim() && recentIds.length > 0;

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      {/* Search header */}
      <View style={styles.headerWrap}>
        <Text style={[typography.heading, { color: c.text }]}>Search</Text>

        {/* Search input */}
        <View style={[styles.searchBar, { backgroundColor: c.bgInput, borderColor: c.border }]}>
          <Ionicons name="search" size={18} color={c.textMuted} />
          <TextInput
            ref={inputRef}
            style={[styles.searchInput, typography.body, { color: c.text }]}
            placeholder="Search notes, lists, tasks..."
            placeholderTextColor={c.textMuted}
            value={query}
            onChangeText={handleQueryChange}
            returnKeyType="search"
            autoCorrect={false}
          />
          {query.length > 0 && (
            <Pressable onPress={() => { setQuery(''); setResults([]); setHasSearched(false); }} hitSlop={8}>
              <Ionicons name="close-circle" size={18} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        {/* Filter pills */}
        <View style={styles.filterRow}>
          {filters.map((f) => {
            const selected = filterType === f.value;
            return (
              <Pressable
                key={f.value}
                style={[styles.filterPill, { borderColor: selected ? c.accent : c.border }, selected && { backgroundColor: c.accentGlow }]}
                onPress={() => setFilterType(f.value)}
              >
                <Ionicons name={f.icon} size={13} color={selected ? c.accent : c.textDim} />
                <Text style={[styles.filterText, { color: selected ? c.accent : c.textDim }]}>{f.label}</Text>
              </Pressable>
            );
          })}

          <View style={{ flex: 1 }} />

          {/* Include completed toggle */}
          <Pressable
            style={[styles.filterPill, { borderColor: includeCompleted ? c.accent : c.border }, includeCompleted && { backgroundColor: c.accentGlow }]}
            onPress={() => setIncludeCompleted(!includeCompleted)}
          >
            <Ionicons name={includeCompleted ? 'checkmark-circle' : 'checkmark-circle-outline'} size={13} color={includeCompleted ? c.accent : c.textDim} />
            <Text style={[styles.filterText, { color: includeCompleted ? c.accent : c.textDim }]}>Done</Text>
          </Pressable>
        </View>

        {/* Tag pills */}
        {allTags.length > 0 && (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 6 }}>
            {allTags.map((tag) => {
              const sel = selectedTag === tag;
              return (
                <Pressable
                  key={tag}
                  style={[styles.filterPill, { borderColor: sel ? c.accent2 : c.border }, sel && { backgroundColor: `${c.accent2}20` }]}
                  onPress={() => {
                    setSelectedTag(sel ? null : tag);
                    if (!sel) { setQuery(`#${tag}`); performSearch(`#${tag}`); }
                    else { setQuery(''); setResults([]); setHasSearched(false); }
                  }}
                >
                  <Ionicons name="pricetag-outline" size={11} color={sel ? c.accent2 : c.textDim} />
                  <Text style={[styles.filterText, { color: sel ? c.accent2 : c.textDim }]}>#{tag}</Text>
                </Pressable>
              );
            })}
          </ScrollView>
        )}
      </View>

      {/* Results */}
      {hasSearched && filteredResults.length === 0 ? (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color={c.textMuted} />
          <Text style={[typography.label, { color: c.textMuted, marginTop: 12 }]}>No results found</Text>
          <Text style={[typography.caption, { color: c.textMuted, marginTop: 4 }]}>
            Try different keywords or filters
          </Text>
        </View>
      ) : hasSearched ? (
        <FlashList
          data={filteredResults}
          renderItem={({ item }) => {
            const titleSnippet = (item as any)._titleSnippet;
            const bodySnippet = (item as any)._bodySnippet;
            return (
              <View style={{ paddingHorizontal: spacing.xl, marginBottom: 6 }}>
                <Pressable
                  onPress={() => openNote(item)}
                  style={[styles.resultCard, { backgroundColor: c.bgCard, borderColor: c.border }]}
                >
                  <View style={styles.resultBody}>
                    {titleSnippet ? (
                      <HighlightedText text={titleSnippet} style={[typography.label, { color: c.text }]} />
                    ) : (
                      <Text style={[typography.label, { color: c.text }]} numberOfLines={1}>
                        {item.title || 'Untitled'}
                      </Text>
                    )}
                    {bodySnippet ? (
                      <HighlightedText text={bodySnippet} style={[typography.caption, { color: c.textDim, marginTop: 2 }]} />
                    ) : item.body ? (
                      <Text style={[typography.caption, { color: c.textDim, marginTop: 2 }]} numberOfLines={1}>
                        {item.body.split('\n')[0].substring(0, 80)}
                      </Text>
                    ) : null}
                  </View>
                  <View style={styles.resultMeta}>
                    <Ionicons
                      name={item.type === 'note' ? 'document-text-outline' : item.type === 'list' ? 'checkbox-outline' : 'checkmark-circle-outline'}
                      size={13}
                      color={c.textMuted}
                    />
                    {item.priority !== null && (
                      <View style={[styles.priBadge, { backgroundColor: `${colors.priority[item.priority]}22` }]}>
                        <Text style={[styles.priText, { color: colors.priority[item.priority] }]}>P{item.priority}</Text>
                      </View>
                    )}
                  </View>
                </Pressable>
              </View>
            );
          }}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 120 }}
          getItemType={() => 'note'}
          ListHeaderComponent={
            <View style={{ paddingHorizontal: spacing.xl, paddingBottom: 8 }}>
              <Text style={[typography.caption, { color: c.textMuted }]}>
                {filteredResults.length} result{filteredResults.length !== 1 ? 's' : ''}
              </Text>
            </View>
          }
        />
      ) : showRecents ? (
        <View style={{ paddingHorizontal: spacing.xl, paddingTop: 8 }}>
          <Text style={[typography.sectionHeader, { color: c.textMuted, marginBottom: 12 }]}>RECENTLY OPENED</Text>
          {recentNotes
            .filter((n) => recentIds.includes(n.id))
            .sort((a, b) => recentIds.indexOf(a.id) - recentIds.indexOf(b.id))
            .map((note) => (
              <View key={note.id} style={{ marginBottom: 6 }}>
                <RowItem note={note} index={0} onPress={() => openNote(note)} />
              </View>
            ))}
        </View>
      ) : (
        <View style={styles.emptyState}>
          <Ionicons name="search-outline" size={40} color={c.textMuted} />
          <Text style={[typography.label, { color: c.textMuted, marginTop: 12 }]}>Search your notes</Text>
          <Text style={[typography.caption, { color: c.textMuted, marginTop: 4 }]}>
            Find by title or content
          </Text>
        </View>
      )}

      {/* Detail sheet */}
      <DetailSheet noteId={detailNoteId} onDismiss={() => setDetailNoteId(null)} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  headerWrap: {
    paddingTop: 60,
    paddingHorizontal: spacing.xl,
    paddingBottom: 12,
    gap: 12,
  },
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: radii.sm,
    borderWidth: 1,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  filterRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 100,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingBottom: 80,
  },
  resultCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 13,
    paddingLeft: 16,
    borderRadius: radii.md,
    borderWidth: 1,
    minHeight: 52,
    gap: 12,
  },
  resultBody: {
    flex: 1,
    minWidth: 0,
  },
  resultMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  priBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 100,
  },
  priText: {
    fontSize: 10,
    fontWeight: '800',
  },
});
