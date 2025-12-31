export type FieldType = 'text' | 'number' | 'textarea' | 'select' | 'rating';
export interface TemplateField {
  id: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  options?: string[];
}
export interface JournalTemplate {
  id: string;
  name: string;
  description: string;
  icon: string;
  color: string; // Tailwind class base (e.g., 'stone', 'amber')
  defaultTitle: string;
  fields: TemplateField[];
}
export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'reflective',
    name: 'Reflective sanctuary',
    description: 'The classic Lumina experience for free-form thought.',
    icon: 'Sparkles',
    color: 'stone',
    defaultTitle: 'Daily Reflections',
    fields: [
      { id: 'content', label: 'What is on your mind?', type: 'textarea', placeholder: 'Write freely...' }
    ]
  },
  {
    id: 'gratitude',
    name: 'Gratitude Garden',
    description: 'Cultivate positivity by recording daily blessings.',
    icon: 'Heart',
    color: 'rose',
    defaultTitle: 'My Grateful Heart',
    fields: [
      { id: 'item1', label: 'First blessing', type: 'text', placeholder: 'Something that made me smile...' },
      { id: 'item2', label: 'Second blessing', type: 'text', placeholder: 'A person I am thankful for...' },
      { id: 'item3', label: 'Third blessing', type: 'text', placeholder: 'A small win today...' },
      { id: 'notes', label: 'Reflection', type: 'textarea', placeholder: 'How did these things make you feel?' }
    ]
  },
  {
    id: 'fitness',
    name: 'Kinetic Journey',
    description: 'Track your physical growth and movement patterns.',
    icon: 'Activity',
    color: 'emerald',
    defaultTitle: 'Movement Log',
    fields: [
      { id: 'workout', label: 'Workout Type', type: 'text', placeholder: 'Yoga, Running, Lifting...' },
      { id: 'duration', label: 'Duration (mins)', type: 'number', placeholder: '45' },
      { id: 'intensity', label: 'Intensity', type: 'rating' },
      { id: 'notes', label: 'How did you feel?', type: 'textarea', placeholder: 'Energy levels, pains, or breakthroughs...' }
    ]
  },
  {
    id: 'finance',
    name: 'Prosperity Ledger',
    description: 'Mindful tracking of your financial intentions.',
    icon: 'Wallet',
    color: 'amber',
    defaultTitle: 'Financial Intentions',
    fields: [
      { id: 'expense', label: 'Major Expense', type: 'number', placeholder: '0.00' },
      { id: 'category', label: 'Category', type: 'select', options: ['Needs', 'Wants', 'Investment', 'Charity'] },
      { id: 'reflection', label: 'Value Analysis', type: 'textarea', placeholder: 'Did this purchase align with my values?' }
    ]
  },
  {
    id: 'reading',
    name: 'Librarian Archive',
    description: 'Document the wisdom found in the books you consume.',
    icon: 'BookOpen',
    color: 'blue',
    defaultTitle: 'Reading Notes',
    fields: [
      { id: 'book', label: 'Book Title', type: 'text', placeholder: 'The Meditations...' },
      { id: 'chapter', label: 'Chapter/Page', type: 'text', placeholder: 'Book II' },
      { id: 'insight', label: 'Key Insight', type: 'textarea', placeholder: 'The most important thing I learned...' }
    ]
  },
  {
    id: 'mood',
    name: 'Emotional Weather',
    description: 'Mapping the internal landscape of your psyche.',
    icon: 'CloudSun',
    color: 'indigo',
    defaultTitle: 'Mood Map',
    fields: [
      { id: 'mood_score', label: 'Overall Vibe', type: 'rating' },
      { id: 'triggers', label: 'Key Triggers', type: 'text', placeholder: 'Coffee, meeting, weather...' },
      { id: 'details', label: 'Deep Dive', type: 'textarea', placeholder: 'Describe the texture of your emotions...' }
    ]
  },
  {
    id: 'travel',
    name: 'Wayfarer Journal',
    description: 'Preserving the sights and sounds of your travels.',
    icon: 'Map',
    color: 'orange',
    defaultTitle: 'Travelogue',
    fields: [
      { id: 'location', label: 'Location', type: 'text', placeholder: 'Kyoto, Japan...' },
      { id: 'highlight', label: 'Daily Highlight', type: 'text', placeholder: 'The temple at sunrise...' },
      { id: 'food', label: 'Best Meal', type: 'text', placeholder: 'Miso Ramen...' },
      { id: 'story', label: 'The Full Story', type: 'textarea', placeholder: 'What happened today?' }
    ]
  },
  {
    id: 'creative',
    name: 'Muse Chamber',
    description: 'A dedicated space for creative sparks and drafts.',
    icon: 'PenTool',
    color: 'violet',
    defaultTitle: 'Creative Sparks',
    fields: [
      { id: 'medium', label: 'Medium', type: 'select', options: ['Writing', 'Design', 'Music', 'Logic'] },
      { id: 'idea', label: 'The Idea', type: 'textarea', placeholder: 'A concept for a new world...' },
      { id: 'next_steps', label: 'Next Action', type: 'text', placeholder: 'Sketch the prototype...' }
    ]
  },
  {
    id: 'dreams',
    name: 'Subconscious Echo',
    description: 'Catch the fragments of your dreams before they fade.',
    icon: 'Moon',
    color: 'slate',
    defaultTitle: 'Dream Log',
    fields: [
      { id: 'clarity', label: 'Vividness', type: 'rating' },
      { id: 'dream', label: 'The Dream', type: 'textarea', placeholder: 'I was walking through a forest of glass...' },
      { id: 'symbols', label: 'Recurring Symbols', type: 'text', placeholder: 'Water, clocks, flight...' }
    ]
  },
  {
    id: 'meals',
    name: 'Nourishment Log',
    description: 'Mindful consumption for a balanced body.',
    icon: 'Utensils',
    color: 'lime',
    defaultTitle: 'Daily Menu',
    fields: [
      { id: 'breakfast', label: 'Breakfast', type: 'text' },
      { id: 'lunch', label: 'Lunch', type: 'text' },
      { id: 'dinner', label: 'Dinner', type: 'text' },
      { id: 'satisfaction', label: 'Satiety Level', type: 'rating' }
    ]
  }
];