/**
 * Nudge system — vibe-aware messages throughout the app.
 * Respects the AI Vibe slider: 0=humour, 100=motivation
 */

const MOTIVATIONAL = [
  "The secret of getting ahead is getting started.",
  "Your mind is for having ideas, not holding them.",
  "Small daily improvements lead to stunning results.",
  "Done is better than perfect.",
  "Focus on being productive instead of busy.",
  "What gets measured gets managed.",
  "The best time to start was yesterday. The next best is now.",
  "Discipline is choosing what you want most over what you want now.",
  "You don't have to be great to start. Start to be great.",
  "Progress, not perfection.",
  "Action is the foundational key to all success.",
  "Start where you are. Use what you have. Do what you can.",
];

const HUMOROUS = [
  "Why do programmers prefer dark mode? Light attracts bugs.",
  "I told my notes app a joke. It saved it but never laughed.",
  "My to-do list and I have trust issues. It keeps growing.",
  "I'm not procrastinating. I'm giving my ideas time to marinate.",
  "Today's goal: be more productive than yesterday's nap.",
  "Inbox zero is just a myth, like unicorns. And free time.",
  "Note to self: stop writing notes to self.",
  "Productivity tip: close this app. Just kidding. Stay.",
  "Your brain called. It wants you to write this down.",
  "Tasks don't complete themselves. Trust me, I've tried waiting.",
];

const CELEBRATIONS_MOTIVATIONAL = [
  "Crushed it! Keep that momentum going.",
  "One down, greatness ahead.",
  "Progress unlocked. You're building something.",
  "That's how it's done. What's next?",
  "Another step forward. Consistency wins.",
  "Momentum is real. You've got it.",
];

const CELEBRATIONS_HUMOROUS = [
  "Look at you being all productive!",
  "Achievement unlocked: Actually Did The Thing.",
  "Your to-do list just got a little less judgy.",
  "Done! Now go get a snack. You've earned it.",
  "One less thing to guilt-trip you at 3 AM.",
  "The task is gone. It cannot hurt you anymore.",
];

const CREATE_MOTIVATIONAL = [
  "Captured! Your future self will thank you.",
  "Noted. One step closer to organized.",
  "Added to the queue. Let's make it happen.",
  "Logged. Now it won't slip through the cracks.",
];

const CREATE_HUMOROUS = [
  "Another one for the pile. You got this!",
  "Saved! Your brain can relax now.",
  "Written down so you don't have to remember. You're welcome.",
  "Added! That's what this app is for. Literally.",
];

const ALL_CLEAR_MOTIVATIONAL = [
  "All P0s handled. You're in control.",
  "No urgent items. Time to think big.",
  "Clear plate. What ambitious thing is next?",
];

const ALL_CLEAR_HUMOROUS = [
  "No P0s? Is this... peace?",
  "Zero urgent tasks. Quick, screenshot this moment.",
  "No fires to put out. Are you sure you're using this right?",
];

function pick(arr: string[]): string {
  return arr[Math.floor(Math.random() * arr.length)];
}

/**
 * Get a vibe-aware message. vibeValue: 0=humour, 100=motivation
 */
export function getQuote(vibeValue: number): string {
  const useHumour = Math.random() * 100 > vibeValue;
  return useHumour ? pick(HUMOROUS) : pick(MOTIVATIONAL);
}

export function getCelebration(vibeValue: number): string {
  const useHumour = Math.random() * 100 > vibeValue;
  return useHumour ? pick(CELEBRATIONS_HUMOROUS) : pick(CELEBRATIONS_MOTIVATIONAL);
}

export function getCreateNudge(vibeValue: number): string {
  const useHumour = Math.random() * 100 > vibeValue;
  return useHumour ? pick(CREATE_HUMOROUS) : pick(CREATE_MOTIVATIONAL);
}

export function getAllClearNudge(vibeValue: number): string {
  const useHumour = Math.random() * 100 > vibeValue;
  return useHumour ? pick(ALL_CLEAR_HUMOROUS) : pick(ALL_CLEAR_MOTIVATIONAL);
}
