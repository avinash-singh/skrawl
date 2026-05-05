import { useState } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, ScrollView, Share, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import { useThemeColors, typography, spacing, radii } from '@/src/theme';
import { useUIStore, type SwipeAction, type ReminderIntensity } from '@/src/store/ui-store';
import { useSyncStore } from '@/src/store/sync-store';
import * as WebBrowser from 'expo-web-browser';
import * as Updates from 'expo-updates';
import { setApiKey as saveApiKey, isConfigured as isAiConfigured, verifyApiKey, clearApiKey as clearAiKey } from '@/src/services/ai-service';
import type { NoteType } from '@/src/models';
import Ionicons from '@expo/vector-icons/Ionicons';

const swipeOptions: { value: SwipeAction; label: string }[] = [
  { value: 'done', label: 'Done' },
  { value: 'pin', label: 'Pin' },
  { value: 'delete', label: 'Delete' },
  { value: 'archive', label: 'Archive' },
];

const defaultModes: { value: NoteType; label: string }[] = [
  { value: 'task', label: 'Task' },
  { value: 'list', label: 'List' },
  { value: 'note', label: 'Note' },
];

export default function SettingsScreen() {
  const c = useThemeColors();
  const router = useRouter();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);
  const defaultMode = useUIStore((s) => s.defaultMode);
  const setDefaultMode = useUIStore((s) => s.setDefaultMode);
  const swipeLeftAction = useUIStore((s) => s.swipeLeftAction);
  const swipeRightAction = useUIStore((s) => s.swipeRightAction);
  const setSwipeLeft = useUIStore((s) => s.setSwipeLeft);
  const setSwipeRight = useUIStore((s) => s.setSwipeRight);
  const reminderIntensity = useUIStore((s) => s.reminderIntensity);
  const setReminderIntensity = useUIStore((s) => s.setReminderIntensity);
  const { status: syncStatus, isSignedIn, user, sync, signInWithEmail, signUpWithEmail, signInWithGoogle, signOut } = useSyncStore();

  // Setting toggles
  const [pushEnabled, setPushEnabled] = useState(true);
  const [aiReminders, setAiReminders] = useState(true);
  const [voiceCommands, setVoiceCommands] = useState(true);
  const [healthConnected, setHealthConnected] = useState(false);
  const vibeValue = useUIStore((s) => s.vibeValue);
  const setVibeValue = useUIStore((s) => s.setVibeValue);
  const [personalCal, setPersonalCal] = useState('Apple Calendar');
  const [businessCal, setBusinessCal] = useState('Google Calendar');
  const [bizNotifChannel, setBizNotifChannel] = useState('Push');
  const [apiToken, setApiToken] = useState('');
  const [editingToken, setEditingToken] = useState(false);
  const [calSyncing, setCalSyncing] = useState(false);
  const [updateStatus, setUpdateStatus] = useState<string | null>(null);
  const [aiConnected, setAiConnected] = useState(isAiConfigured());
  const [verifying, setVerifying] = useState(false);
  const [authMode, setAuthMode] = useState<'none' | 'sso' | 'key'>('none');
  const [signInMode, setSignInMode] = useState<'none' | 'signin' | 'signup'>('none');
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authError, setAuthError] = useState<string | null>(null);

  const Toggle = ({ on, onPress }: { on: boolean; onPress: () => void }) => (
    <Pressable style={[styles.toggle, on && { backgroundColor: c.accent }]} onPress={onPress}>
      <View style={[styles.toggleKnob, { transform: [{ translateX: on ? 20 : 0 }] }]} />
    </Pressable>
  );

  return (
    <View style={[styles.container, { backgroundColor: c.bg }]}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="chevron-back" size={20} color={c.accent} />
          <Text style={{ color: c.accent, fontSize: 15, fontWeight: '500' }}>Back</Text>
        </Pressable>
        <Text style={[typography.label, { color: c.text, flex: 1, textAlign: 'center' }]}>Settings</Text>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 60 }}>
        {/* Appearance */}
        <Group label="APPEARANCE" c={c}>
          <Row c={c} iconBg="#7C6AFF" icon="moon" label="Dark Mode" right={<Toggle on={theme === 'dark'} onPress={toggleTheme} />} />
        </Group>

        {/* Default Mode */}
        <Group label="DEFAULT MODE" c={c}>
          <View style={[styles.row, { borderBottomColor: c.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#6AB4FF' }]}><Ionicons name="create-outline" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>New item starts as</Text>
            <View style={styles.chipRow}>
              {defaultModes.map((m) => (
                <Pressable key={m.value} style={[styles.chip, { borderColor: defaultMode === m.value ? c.accent : c.border }, defaultMode === m.value && { backgroundColor: c.accentGlow }]} onPress={() => setDefaultMode(m.value)}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: defaultMode === m.value ? c.accent : c.textDim }]}>{m.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Group>

        {/* Swipe Actions */}
        <Group label="SWIPE ACTIONS" c={c}>
          <View style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFB86A' }]}><Ionicons name="arrow-back" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Left swipe</Text>
            <View style={styles.chipRow}>
              {swipeOptions.map((a) => (
                <Pressable key={a.value} style={[styles.chip, { borderColor: swipeLeftAction === a.value ? c.accent : c.border }, swipeLeftAction === a.value && { backgroundColor: c.accentGlow }]} onPress={() => setSwipeLeft(a.value)}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: swipeLeftAction === a.value ? c.accent : c.textDim }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.row, { borderBottomColor: c.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#6AFFCB' }]}><Ionicons name="arrow-forward" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Right swipe</Text>
            <View style={styles.chipRow}>
              {swipeOptions.map((a) => (
                <Pressable key={a.value} style={[styles.chip, { borderColor: swipeRightAction === a.value ? c.accent : c.border }, swipeRightAction === a.value && { backgroundColor: c.accentGlow }]} onPress={() => setSwipeRight(a.value)}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: swipeRightAction === a.value ? c.accent : c.textDim }]}>{a.label}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Group>

        {/* Personality / AI Vibe — Creative Design */}
        <View style={[settStyles.group, { paddingHorizontal: spacing.xl, opacity: aiConnected ? 1 : 0.5 }]}>
          <Text style={[settStyles.groupLabel, { color: c.textMuted }]}>
            PERSONALITY {!aiConnected && '(connect AI to unlock)'}
          </Text>
          <View style={[vibeStyles.card, { backgroundColor: c.bgCard, borderColor: c.border }]} pointerEvents={aiConnected ? 'auto' : 'none'}>
            {/* Gradient accent bar at top */}
            <View style={vibeStyles.gradientBar}>
              <View style={[vibeStyles.gradientLeft, { backgroundColor: '#FFB86A' }]} />
              <View style={[vibeStyles.gradientMid, { backgroundColor: '#FF6AC2' }]} />
              <View style={[vibeStyles.gradientRight, { backgroundColor: '#7C6AFF' }]} />
            </View>

            <View style={vibeStyles.content}>
              {/* Header — dynamic icon + description */}
              {(() => {
                const vibes = [
                  { icon: 'happy-outline' as const, color: '#FFB86A', title: 'Comedian', desc: 'Jokes, puns, and zero seriousness' },
                  { icon: 'glasses-outline' as const, color: '#FF6AC2', title: 'Witty', desc: 'Smart humour — dry and clever' },
                  { icon: 'infinite-outline' as const, color: '#B06AFF', title: 'Balanced', desc: 'Best of both — wit meets drive' },
                  { icon: 'trending-up-outline' as const, color: '#6AB4FF', title: 'Hustler', desc: 'Driven, focused, always pushing' },
                  { icon: 'shield-checkmark-outline' as const, color: '#7C6AFF', title: 'Drill Sgt', desc: 'No excuses. Get it done. Now.' },
                ];
                const idx = vibeValue === 0 ? 0 : vibeValue === 25 ? 1 : vibeValue === 50 ? 2 : vibeValue === 75 ? 3 : 4;
                const v = vibes[idx];
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <View style={[vibeStyles.headerIcon, { backgroundColor: `${v.color}20`, borderColor: `${v.color}40` }]}>
                      <Ionicons name={v.icon} size={22} color={v.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 16, fontWeight: '800', color: c.text, letterSpacing: -0.3 }]}>{v.title}</Text>
                      <Text style={[{ fontSize: 12, color: c.textDim, marginTop: 1 }]}>{v.desc}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* Vibe selector — 5 tappable zones with themed icons */}
              <View style={vibeStyles.sliderWrap}>
                <View style={vibeStyles.zonesRow}>
                  {([
                    { v: 0, icon: 'happy-outline' as const, label: 'LOL', color: '#FFB86A' },
                    { v: 25, icon: 'glasses-outline' as const, label: 'Witty', color: '#FF6AC2' },
                    { v: 50, icon: 'infinite-outline' as const, label: 'Blend', color: '#B06AFF' },
                    { v: 75, icon: 'trending-up-outline' as const, label: 'Hustle', color: '#6AB4FF' },
                    { v: 100, icon: 'shield-checkmark-outline' as const, label: 'Drill', color: '#7C6AFF' },
                  ]).map((z) => {
                    const active = vibeValue === z.v;
                    const passed = vibeValue >= z.v;
                    return (
                      <Pressable key={z.v} style={vibeStyles.zone} onPress={() => setVibeValue(z.v)}>
                        <View style={[
                          vibeStyles.zoneDot,
                          { backgroundColor: passed ? `${z.color}18` : 'rgba(255,255,255,0.04)', borderColor: active ? z.color : 'transparent' },
                          active && [vibeStyles.zoneDotActive, { shadowColor: z.color }],
                        ]}>
                          <Ionicons name={z.icon} size={active ? 20 : 16} color={active ? z.color : passed ? z.color : c.textMuted} />
                        </View>
                        <Text style={[{ fontSize: 9, fontWeight: '700', marginTop: 4, letterSpacing: 0.2, color: active ? z.color : c.textMuted }]}>{z.label}</Text>
                      </Pressable>
                    );
                  })}
                </View>
              </View>

              {/* Labels */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Ionicons name="happy-outline" size={11} color="#FFB86A" />
                  <Text style={[{ fontSize: 10, fontWeight: '700', color: '#FFB86A', letterSpacing: 0.5 }]}>HUMOUR</Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <Text style={[{ fontSize: 10, fontWeight: '700', color: '#7C6AFF', letterSpacing: 0.5 }]}>DRIVE</Text>
                  <Ionicons name="rocket-outline" size={11} color="#7C6AFF" />
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Reminder Intensity — AI-driven creative card */}
        <View style={[settStyles.group, { paddingHorizontal: spacing.xl }]}>
          <Text style={[settStyles.groupLabel, { color: c.textMuted }]}>REMINDER INTELLIGENCE</Text>
          <View style={[vibeStyles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>
            {/* Accent bar */}
            <View style={vibeStyles.gradientBar}>
              <View style={[vibeStyles.gradientLeft, { backgroundColor: '#6AFFCB' }]} />
              <View style={[vibeStyles.gradientMid, { backgroundColor: '#6AB4FF' }]} />
              <View style={[vibeStyles.gradientRight, { backgroundColor: '#FF5A5A' }]} />
            </View>
            <View style={vibeStyles.content}>
              {/* Dynamic header */}
              {(() => {
                const modes: Record<ReminderIntensity, { icon: keyof typeof Ionicons.glyphMap; color: string; title: string; desc: string }> = {
                  gentle: { icon: 'leaf-outline', color: '#6AFFCB', title: 'Zen Mode', desc: 'One calm daily digest of what matters' },
                  balanced: { icon: 'notifications-outline', color: '#6AB4FF', title: 'Smart Nudge', desc: 'Timely pings for P0/P1 + daily summary' },
                  aggressive: { icon: 'megaphone-outline', color: '#FF5A5A', title: 'War Room', desc: 'Repeat until done — nothing slips through' },
                };
                const m = modes[reminderIntensity];
                return (
                  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 18 }}>
                    <View style={[vibeStyles.headerIcon, { backgroundColor: `${m.color}20`, borderColor: `${m.color}40` }]}>
                      <Ionicons name={m.icon} size={22} color={m.color} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[{ fontSize: 16, fontWeight: '800', color: c.text, letterSpacing: -0.3 }]}>{m.title}</Text>
                      <Text style={[{ fontSize: 12, color: c.textDim, marginTop: 1 }]}>{m.desc}</Text>
                    </View>
                  </View>
                );
              })()}

              {/* 3 mode cards */}
              <View style={{ gap: 8 }}>
                {([
                  {
                    value: 'gentle' as ReminderIntensity,
                    icon: 'leaf-outline' as const,
                    color: '#6AFFCB',
                    title: 'Zen Mode',
                    bullets: ['Daily digest at 9 AM', 'P0 items flagged once', 'No repeat reminders'],
                  },
                  {
                    value: 'balanced' as ReminderIntensity,
                    icon: 'notifications-outline' as const,
                    color: '#6AB4FF',
                    title: 'Smart Nudge',
                    bullets: ['P0: remind every 4 hours', 'P1: morning + evening', 'Overdue: daily nudge'],
                  },
                  {
                    value: 'aggressive' as ReminderIntensity,
                    icon: 'megaphone-outline' as const,
                    color: '#FF5A5A',
                    title: 'War Room',
                    bullets: ['P0: every 2 hours until done', 'P1: every 4 hours', 'Overdue: escalate hourly'],
                  },
                ]).map((mode) => {
                  const sel = reminderIntensity === mode.value;
                  return (
                    <Pressable
                      key={mode.value}
                      style={[
                        reminderCardStyles.card,
                        { borderColor: sel ? mode.color : c.border, backgroundColor: sel ? `${mode.color}10` : 'transparent' },
                      ]}
                      onPress={() => setReminderIntensity(mode.value)}
                    >
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                        <View style={[reminderCardStyles.iconCircle, { backgroundColor: sel ? `${mode.color}25` : c.bgInput }]}>
                          <Ionicons name={mode.icon} size={18} color={sel ? mode.color : c.textMuted} />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={[{ fontSize: 14, fontWeight: '700', color: sel ? c.text : c.textDim }]}>{mode.title}</Text>
                          <View style={{ marginTop: 4, gap: 2 }}>
                            {mode.bullets.map((b, i) => (
                              <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={[reminderCardStyles.bulletDot, { backgroundColor: sel ? mode.color : c.textMuted }]} />
                                <Text style={[{ fontSize: 11, color: sel ? c.textDim : c.textMuted }]}>{b}</Text>
                              </View>
                            ))}
                          </View>
                        </View>
                        {sel && (
                          <Ionicons name="checkmark-circle" size={22} color={mode.color} />
                        )}
                      </View>
                    </Pressable>
                  );
                })}
              </View>
            </View>
          </View>
        </View>

        {/* Notifications */}
        <Group label="NOTIFICATIONS" c={c}>
          <Row c={c} iconBg="#FF5A5A" icon="notifications" label="Push Notifications" right={<Toggle on={pushEnabled} onPress={() => setPushEnabled(!pushEnabled)} />} border />
          <Pressable style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]} onPress={() => router.push('/notifications')}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFB86A' }]}><Ionicons name="mail-outline" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Notification Center</Text>
            <Text style={[typography.caption, { color: c.textMuted }]}>View all</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
          <View style={[styles.row, { borderBottomColor: c.border }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#3D8BFF' }]}><Ionicons name="megaphone-outline" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Business Channel</Text>
            <View style={styles.chipRow}>
              {['Push', 'Slack', 'Email'].map((ch) => (
                <Pressable key={ch} style={[styles.chip, { borderColor: bizNotifChannel === ch ? c.accent : c.border }, bizNotifChannel === ch && { backgroundColor: c.accentGlow }]} onPress={() => setBizNotifChannel(ch)}>
                  <Text style={[{ fontSize: 11, fontWeight: '600', color: bizNotifChannel === ch ? c.accent : c.textDim }]}>{ch}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        </Group>

        {/* AI & Integrations */}
        <Group label="AI & INTEGRATIONS" c={c}>
          {/* OpenAI connection status */}
          <View style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#10A37F' }]}><Ionicons name="sparkles" size={16} color="#fff" /></View>
            <View style={{ flex: 1 }}>
              <Text style={[typography.body, { color: c.text }]}>OpenAI</Text>
              <Text style={[{ fontSize: 11, color: aiConnected ? c.accent3 : c.textMuted }]}>
                {aiConnected ? 'Connected — GPT-4o-mini' : 'Not connected'}
              </Text>
            </View>
            {aiConnected ? (
              <Pressable onPress={() => { clearAiKey(); setAiConnected(false); setApiToken(''); }}>
                <Text style={[{ fontSize: 12, fontWeight: '600', color: c.danger }]}>Disconnect</Text>
              </Pressable>
            ) : (
              <View style={[{ width: 10, height: 10, borderRadius: 5, backgroundColor: c.textMuted }]} />
            )}
          </View>

          {/* Connection options — shown when not connected */}
          {!aiConnected && (
            <>
              {/* Option 1: Get API Key */}
              <Pressable
                style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={async () => {
                  await WebBrowser.openBrowserAsync(
                    'https://platform.openai.com/api-keys',
                    { presentationStyle: WebBrowser.WebBrowserPresentationStyle.FULL_SCREEN }
                  );
                  setAuthMode('key');
                  setEditingToken(true);
                }}
              >
                <View style={[styles.rowIcon, { backgroundColor: '#10A37F' }]}><Ionicons name="key-outline" size={16} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: c.text }]}>Get API Key</Text>
                  <Text style={[{ fontSize: 11, color: c.textMuted }]}>Sign up at platform.openai.com (free tier)</Text>
                </View>
                <Ionicons name="open-outline" size={16} color={c.textMuted} />
              </Pressable>

              {/* Option 2: Paste API Key */}
              <Pressable
                style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={() => { setAuthMode('key'); setEditingToken(true); }}
              >
                <View style={[styles.rowIcon, { backgroundColor: '#7C6AFF' }]}><Ionicons name="key-outline" size={16} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[typography.body, { color: c.text }]}>Paste API Key</Text>
                  <Text style={[{ fontSize: 11, color: c.textMuted }]}>From platform.openai.com/api-keys</Text>
                </View>
                <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
              </Pressable>

              {/* Info */}
              <View style={[styles.row, { borderBottomColor: c.border }]}>
                <View style={[styles.rowIcon, { backgroundColor: '#6AFFCB' }]}><Ionicons name="information-circle-outline" size={16} color="#fff" /></View>
                <View style={{ flex: 1 }}>
                  <Text style={[{ fontSize: 12, color: c.textDim, lineHeight: 18 }]}>
                    Works without API key: NL parsing, auto-reminders, auto-priority, nudges. API key adds: smart categorization, AI titles, voice command processing.
                  </Text>
                </View>
              </View>
            </>
          )}

          {/* API Key input */}
          {editingToken && (
            <View style={{ padding: 14, gap: 8 }}>
              <Text style={[{ fontSize: 12, color: c.textDim }]}>Paste your OpenAI API key:</Text>
              <TextInput
                style={[styles.tokenInput, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput }]}
                value={apiToken}
                onChangeText={setApiToken}
                placeholder="sk-..."
                placeholderTextColor={c.textMuted}
                autoFocus
                autoCapitalize="none"
                autoCorrect={false}
                numberOfLines={1}
              />
              <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 12, alignItems: 'center' }}>
                {verifying && <Text style={[{ fontSize: 12, color: c.accent }]}>Verifying...</Text>}
                <Pressable onPress={() => { setEditingToken(false); setAuthMode('none'); }}>
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: c.textDim }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={{ backgroundColor: c.accent, paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100 }}
                  onPress={async () => {
                    if (!apiToken.trim()) return;
                    setVerifying(true);
                    const valid = await verifyApiKey(apiToken.trim());
                    setVerifying(false);
                    if (valid) {
                      saveApiKey(apiToken.trim());
                      setAiConnected(true);
                      setEditingToken(false);
                      setAuthMode('none');
                    } else {
                      Alert.alert('Invalid Key', 'Could not verify this API key. Please check and try again.');
                    }
                  }}
                >
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: '#fff' }]}>Verify & Save</Text>
                </Pressable>
              </View>
            </View>
          )}

          <Row c={c} iconBg="#FF6AC2" icon="sparkles" label="AI Reminders" right={<Toggle on={aiReminders} onPress={() => setAiReminders(!aiReminders)} />} border />
          <Row c={c} iconBg="#6AFFCB" icon="mic" label="Voice Commands" right={<Toggle on={voiceCommands} onPress={() => setVoiceCommands(!voiceCommands)} />} />
        </Group>

        {/* Connected Accounts */}
        <Group label="CONNECTED ACCOUNTS" c={c}>
          <Pressable style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]} onPress={() => setHealthConnected(!healthConnected)}>
            <View style={[styles.rowIcon, { backgroundColor: '#FF2D55' }]}><Ionicons name="heart" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Apple Health</Text>
            <Text style={[{ fontSize: 12, fontWeight: '600', color: healthConnected ? c.accent3 : c.textMuted }]}>{healthConnected ? 'Connected' : 'Not connected'}</Text>
          </Pressable>
          <Row c={c} iconBg="#6AFFCB" icon="fitness" label="Fitness Goals Sync" right={<Toggle on={healthConnected} onPress={() => setHealthConnected(!healthConnected)} />} />
        </Group>

        {/* Calendar */}
        <Group label="CALENDAR" c={c}>
          <View style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#7C6AFF' }]}><Ionicons name="calendar" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Personal</Text>
            <View style={styles.chipRow}>
              {['Apple Calendar', 'Google Calendar'].map((cal) => (
                <Pressable key={cal} style={[styles.chip, { borderColor: personalCal === cal ? c.accent : c.border }, personalCal === cal && { backgroundColor: c.accentGlow }]} onPress={() => setPersonalCal(cal)}>
                  <Text style={[{ fontSize: 10, fontWeight: '600', color: personalCal === cal ? c.accent : c.textDim }]}>{cal.replace(' Calendar', '')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <View style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#3D8BFF' }]}><Ionicons name="calendar" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Business</Text>
            <View style={styles.chipRow}>
              {['Google Calendar', 'Outlook'].map((cal) => (
                <Pressable key={cal} style={[styles.chip, { borderColor: businessCal === cal ? c.accent : c.border }, businessCal === cal && { backgroundColor: c.accentGlow }]} onPress={() => setBusinessCal(cal)}>
                  <Text style={[{ fontSize: 10, fontWeight: '600', color: businessCal === cal ? c.accent : c.textDim }]}>{cal.replace(' Calendar', '')}</Text>
                </Pressable>
              ))}
            </View>
          </View>
          <Pressable
            style={[styles.row, { borderBottomColor: c.border }]}
            onPress={() => {
              setCalSyncing(true);
              setTimeout(() => setCalSyncing(false), 2000);
            }}
          >
            <View style={[styles.rowIcon, { backgroundColor: '#6AFFCB' }]}>
              <Ionicons name="sync-outline" size={16} color="#fff" />
            </View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Sync with Calendar</Text>
            {calSyncing ? (
              <Text style={[{ fontSize: 12, color: c.accent3, fontWeight: '600' }]}>Syncing...</Text>
            ) : (
              <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
            )}
          </Pressable>
        </Group>

        {/* Productivity */}
        <Group label="PRODUCTIVITY" c={c}>
          <Pressable style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]} onPress={() => router.push('/focus')}>
            <View style={[styles.rowIcon, { backgroundColor: '#FF6AC2' }]}><Ionicons name="timer-outline" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Focus Mode</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
          <Pressable style={[styles.row, { borderBottomColor: c.border }]} onPress={async () => { await Share.share({ message: 'Skrawl — Notes, tasks & goals' }); }}>
            <View style={[styles.rowIcon, { backgroundColor: '#FFB86A' }]}><Ionicons name="share-outline" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Share Skrawl</Text>
            <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
          </Pressable>
        </Group>

        {/* Cloud & Sync */}
        <Group label="ACCOUNT" c={c}>
          <View style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
            <View style={[styles.rowIcon, { backgroundColor: '#6AB4FF' }]}><Ionicons name="cloud-outline" size={16} color="#fff" /></View>
            <Text style={[typography.body, { color: c.text, flex: 1 }]}>Sync</Text>
            <Text style={[typography.caption, { color: syncStatus === 'not_configured' ? c.textMuted : isSignedIn ? c.accent3 : c.textMuted }]}>
              {isSignedIn ? 'Up to date' : 'Sign in to sync'}
            </Text>
          </View>
          {isSignedIn ? (
            <>
              <View style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}>
                <View style={[styles.rowIcon, { backgroundColor: c.accent }]}><Ionicons name="person" size={16} color="#fff" /></View>
                <Text style={[typography.body, { color: c.text, flex: 1 }]}>{user?.email}</Text>
              </View>
              <Pressable style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]} onPress={sync}>
                <View style={[styles.rowIcon, { backgroundColor: c.accent3 }]}><Ionicons name="sync-outline" size={16} color="#fff" /></View>
                <Text style={[typography.body, { color: c.text, flex: 1 }]}>Sync Now</Text>
              </Pressable>
              <Pressable style={[styles.row, { borderBottomColor: c.border }]} onPress={signOut}>
                <View style={[styles.rowIcon, { backgroundColor: c.danger }]}><Ionicons name="log-out-outline" size={16} color="#fff" /></View>
                <Text style={[typography.body, { color: c.danger, flex: 1 }]}>Sign Out</Text>
              </Pressable>
            </>
          ) : (
            <>
              {/* Google Sign In */}
              <Pressable
                style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={async () => {
                  const err = await signInWithGoogle();
                  if (err) Alert.alert('Sign In Failed', err);
                }}
              >
                <View style={[styles.rowIcon, { backgroundColor: '#4285F4' }]}><Ionicons name="logo-google" size={16} color="#fff" /></View>
                <Text style={[typography.body, { color: c.text, flex: 1 }]}>Sign in with Google</Text>
                <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
              </Pressable>
              {/* Email Sign In */}
              <Pressable
                style={[styles.row, { borderBottomColor: c.border, borderBottomWidth: StyleSheet.hairlineWidth }]}
                onPress={() => setSignInMode(signInMode === 'signin' ? 'none' : 'signin')}
              >
                <View style={[styles.rowIcon, { backgroundColor: '#7C6AFF' }]}><Ionicons name="mail-outline" size={16} color="#fff" /></View>
                <Text style={[typography.body, { color: c.text, flex: 1 }]}>Sign in with Email</Text>
                <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
              </Pressable>
              <Pressable
                style={[styles.row, { borderBottomColor: c.border }]}
                onPress={() => setSignInMode(signInMode === 'signup' ? 'none' : 'signup')}
              >
                <View style={[styles.rowIcon, { backgroundColor: '#6AFFCB' }]}><Ionicons name="person-add-outline" size={16} color="#fff" /></View>
                <Text style={[typography.body, { color: c.text, flex: 1 }]}>Create Account</Text>
                <Ionicons name="chevron-forward" size={16} color={c.textMuted} />
              </Pressable>
              {signInMode !== 'none' && (
                <View style={[styles.row, { flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                  <Text style={[{ fontSize: 13, fontWeight: '600', color: c.text }]}>
                    {signInMode === 'signin' ? 'Sign In' : 'Create Account'}
                  </Text>
                  <TextInput
                    style={[styles.tokenInput, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput }]}
                    value={authEmail}
                    onChangeText={setAuthEmail}
                    placeholder="Email"
                    placeholderTextColor={c.textMuted}
                    autoCapitalize="none"
                    keyboardType="email-address"
                  />
                  <TextInput
                    style={[styles.tokenInput, { color: c.text, borderColor: c.border, backgroundColor: c.bgInput }]}
                    value={authPassword}
                    onChangeText={setAuthPassword}
                    placeholder="Password"
                    placeholderTextColor={c.textMuted}
                    secureTextEntry
                  />
                  {authError && <Text style={[{ fontSize: 12, color: c.danger }]}>{authError}</Text>}
                  <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10 }}>
                    <Pressable onPress={() => { setSignInMode('none'); setAuthError(null); }}>
                      <Text style={[{ fontSize: 13, fontWeight: '600', color: c.textDim }]}>Cancel</Text>
                    </Pressable>
                    <Pressable onPress={async () => {
                      setAuthError(null);
                      const err = signInMode === 'signin'
                        ? await signInWithEmail(authEmail, authPassword)
                        : await signUpWithEmail(authEmail, authPassword);
                      if (err) setAuthError(err);
                      else { setSignInMode('none'); setAuthEmail(''); setAuthPassword(''); }
                    }}>
                      <Text style={[{ fontSize: 13, fontWeight: '600', color: c.accent }]}>
                        {signInMode === 'signin' ? 'Sign In' : 'Sign Up'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              )}
            </>
          )}
        </Group>

        <View style={{ alignItems: 'center', paddingVertical: 24, gap: 10 }}>
          <Text style={[{ fontSize: 12, color: c.textMuted, fontWeight: '500' }]}>Skrawl v1.0.6</Text>
          <Pressable
            onPress={async () => {
              try {
                setUpdateStatus('Checking...');
                const update = await Updates.checkForUpdateAsync();
                if (update.isAvailable) {
                  setUpdateStatus('Downloading...');
                  await Updates.fetchUpdateAsync();
                  setUpdateStatus('Restarting...');
                  await Updates.reloadAsync();
                } else {
                  setUpdateStatus('Up to date');
                  setTimeout(() => setUpdateStatus(null), 2000);
                }
              } catch (e: any) {
                setUpdateStatus(`Error: ${e.message?.substring(0, 50) || 'Failed'}`);
                setTimeout(() => setUpdateStatus(null), 3000);
              }
            }}
            style={{ paddingHorizontal: 16, paddingVertical: 8, borderRadius: 100, borderWidth: 1, borderColor: c.border }}
          >
            <Text style={[{ fontSize: 12, color: c.accent, fontWeight: '600' }]}>
              {updateStatus || 'Check for updates'}
            </Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}

function Group({ label, c, children }: { label: string; c: any; children: React.ReactNode }) {
  return (
    <View style={[settStyles.group, { paddingHorizontal: spacing.xl }]}>
      <Text style={[settStyles.groupLabel, { color: c.textMuted }]}>{label}</Text>
      <View style={[settStyles.card, { backgroundColor: c.bgCard, borderColor: c.border }]}>{children}</View>
    </View>
  );
}

function Row({ c, iconBg, icon, label, right, border }: { c: any; iconBg: string; icon: keyof typeof Ionicons.glyphMap; label: string; right: React.ReactNode; border?: boolean }) {
  return (
    <View style={[styles.row, { borderBottomColor: c.border }, border && { borderBottomWidth: StyleSheet.hairlineWidth }]}>
      <View style={[styles.rowIcon, { backgroundColor: iconBg }]}><Ionicons name={icon} size={16} color="#fff" /></View>
      <Text style={[typography.body, { color: c.text, flex: 1 }]}>{label}</Text>
      {right}
    </View>
  );
}

const settStyles = StyleSheet.create({
  group: { marginTop: 24 },
  groupLabel: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  card: { borderRadius: radii.lg, borderWidth: 1, overflow: 'hidden' },
});

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingTop: 60, paddingHorizontal: 14, paddingBottom: 10 },
  backBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, width: 60 },
  row: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12, flexWrap: 'wrap' },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  toggle: { width: 51, height: 31, borderRadius: 16, justifyContent: 'center', padding: 2, backgroundColor: 'rgba(255,255,255,0.1)' },
  toggleKnob: { width: 27, height: 27, borderRadius: 14, backgroundColor: '#fff', shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.2, shadowRadius: 3 },
  chipRow: { flexDirection: 'row', gap: 4, flexWrap: 'wrap' },
  chip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 100, borderWidth: 1 },
  tokenInput: { borderWidth: 1, borderRadius: 10, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, fontWeight: '500' },
});

const vibeStyles = StyleSheet.create({
  card: {
    borderRadius: radii.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  gradientBar: {
    height: 3,
    flexDirection: 'row',
  },
  gradientLeft: { flex: 1 },
  gradientMid: { flex: 1 },
  gradientRight: { flex: 1 },
  content: {
    padding: 18,
  },
  headerIcon: {
    width: 44,
    height: 44,
    borderRadius: 14,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sliderWrap: {
    marginBottom: 8,
  },
  zonesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  zone: {
    alignItems: 'center',
    width: 52,
  },
  zoneDot: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: 'rgba(124,106,255,0.1)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
  },
  zoneDotActive: {
    backgroundColor: 'rgba(124,106,255,0.25)',
    borderColor: '#fff',
    shadowColor: '#7C6AFF',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 12,
    elevation: 8,
    transform: [{ scale: 1.1 }],
  },
});

const reminderCardStyles = StyleSheet.create({
  card: {
    borderWidth: 1,
    borderRadius: radii.md,
    padding: 14,
  },
  iconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bulletDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
});
