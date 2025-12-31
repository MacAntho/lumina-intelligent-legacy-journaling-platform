import type { Entry, AiMessage, InsightData, AiInsight, AnalysisRange } from "@shared/types";
export interface IntelligenceContext {
  keywords: string[];
  moodAverage: number;
  frequentTags: string[];
  recentNarrative: string;
  templateUsage: Record<string, number>;
}
export function analyzeUserContext(entries: Entry[]): IntelligenceContext {
  const keywords: string[] = [];
  let moodSum = 0;
  const tagMap: Record<string, number> = {};
  const templateMap: Record<string, number> = {};
  // Rule-based keyword extraction (simple)
  const commonWords = new Set(['the', 'and', 'was', 'with', 'this', 'that', 'for', 'but', 'have']);
  entries.forEach(e => {
    // Mood
    const score = e.structuredData?.mood_score || e.structuredData?.intensity || 3;
    moodSum += Number(score);
    // Tags
    e.tags?.forEach(t => {
      tagMap[t] = (tagMap[t] || 0) + 1;
    });
    // Content analysis for keywords
    const words = e.content.toLowerCase().split(/\W+/);
    words.forEach(w => {
      if (w.length > 4 && !commonWords.has(w)) {
        keywords.push(w);
      }
    });
    // Template tracking
    const tempId = e.journalId; // Simplified: in real app we'd map journalId to templateId
    templateMap[tempId] = (templateMap[tempId] || 0) + 1;
  });
  const topTags = Object.entries(tagMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(x => x[0]);
  return {
    keywords: Array.from(new Set(keywords)).slice(0, 20),
    moodAverage: entries.length > 0 ? moodSum / entries.length : 0,
    frequentTags: topTags,
    recentNarrative: entries.slice(0, 3).map(e => e.title || 'Untitled Reflection').join(', '),
    templateUsage: templateMap
  };
}
export async function chatWithAssistant(
  userName: string,
  message: string,
  history: AiMessage[],
  entries: Entry[]
): Promise<string> {
  const context = analyzeUserContext(entries);
  const msg = message.toLowerCase();
  // Intent Detection
  if (msg.includes('summarize') || msg.includes('summary')) {
    if (entries.length === 0) return "Your archive is currently a blank page, but every great story begins with a single word. What shall we write today?";
    return `Looking back at your recent journey, you've focused heavily on "${context.recentNarrative}". You seem to be exploring themes of ${context.keywords.slice(0, 3).join(', ')}. It's a period of significant ${context.moodAverage > 3.5 ? 'ascent' : 'reflection'}.`;
  }
  if (msg.includes('mood') || msg.includes('feel') || msg.includes('emotion')) {
    const moodLevel = context.moodAverage;
    let sentiment = "balanced";
    if (moodLevel > 4) sentiment = "radiant";
    else if (moodLevel < 2.5) sentiment = "contemplative and heavy";
    return `Your emotional landscape has been ${sentiment} lately, with an average resonance of ${moodLevel.toFixed(1)}/5. I notice these feelings often surface when you write about ${context.frequentTags[0] || 'your daily life'}. Does that resonate with your inner truth right now?`;
  }
  if (msg.includes('pattern') || msg.includes('habit') || msg.includes('theme')) {
    if (context.frequentTags.length === 0) return "I'm still gathering the threads of your story. Write a few more entries with tags to help me see the tapestry of your thoughts.";
    return `A clear pattern is emerging around your focus on "${context.frequentTags.join(', ')}". You tend to be most expressive in your reflections involving ${context.keywords[0] || 'growth'}. How do these themes align with the legacy you wish to leave?`;
  }
  if (msg.includes('prompt') || msg.includes('write')) {
    return `Based on your recent interest in ${context.keywords[1] || 'self-discovery'}, here is a prompt: "If your current life were a book, what would the title of this specific chapter be, and why?"`;
  }
  // Default Empathetic Persona
  const responses = [
    `I've been reflecting on your words, ${userName}. Your journey through ${context.frequentTags[0] || 'this year'} shows a unique perspective. What's occupying the center of your thoughts today?`,
    `It's a privilege to witness your growth, ${userName}. In your recent entries, you've mentioned ${context.keywords[0] || 'important goals'}. How are you nurturing that space today?`,
    `The archive remembers what the mind might overlook. You've written ${entries.length} reflections so far. Each one is a stone in the foundation of your legacy. What shall we add today?`
  ];
  return responses[Math.floor(Math.random() * responses.length)];
}

export async function analyzeJournalPatterns(
  userName: string,
  journalTitle: string,
  entries: Entry[],
  range: AnalysisRange
): Promise<Omit<AiInsight, 'id' | 'userId' | 'journalId' | 'range' | 'createdAt'>> {
  if (entries.length === 0) {
    return {
      content: "The pages of this journal remain untouched for the selected period. Every great legacy begins with the first sentence.",
      moodScore: 3,
      topThemes: [],
      goalsIdentified: [],
      growthIndicators: []
    };
  }

  const context = analyzeUserContext(entries);
  const moodName = context.moodAverage > 4 ? "Radiant" : context.moodAverage > 3 ? "Steady" : "Contemplative";
  
  // Heuristic Goal Extraction: Look for "I will", "want to", "need to", "going to"
  const goalKeywords = ['i will', 'plan to', 'want to', 'need to', 'aim to', 'going to'];
  const goals: string[] = [];
  entries.forEach(e => {
    const sentences = e.content.split(/[.!?]/);
    sentences.forEach(s => {
      const lower = s.toLowerCase().trim();
      if (goalKeywords.some(k => lower.includes(k)) && lower.length < 100) {
        goals.push(s.trim());
      }
    });
  });

  // Heuristic Growth: Contrast first half vs second half
  const mid = Math.floor(entries.length / 2);
  const firstHalf = entries.slice(0, mid);
  const secondHalf = entries.slice(mid);
  const growth = [];
  if (entries.length >= 4) {
    const earlyKeywords = analyzeUserContext(firstHalf).keywords;
    const lateKeywords = analyzeUserContext(secondHalf).keywords;
    const newThemes = lateKeywords.filter(k => !earlyKeywords.includes(k));
    if (newThemes.length > 0) growth.push(`Shifted focus towards ${newThemes.slice(0, 2).join(' and ')}.`);
    if (analyzeUserContext(secondHalf).moodAverage > analyzeUserContext(firstHalf).moodAverage) {
      growth.push("Emotional resilience has trended upwards.");
    }
  } else {
    growth.push("Early stages of pattern formation detected.");
  }

  const narrativeParts = [
    `In the sacred archives of "${journalTitle}", your reflections for the past ${range} reveal a ${moodName.toLowerCase()} spirit. Your average resonance sits at ${context.moodAverage.toFixed(1)}/5, suggesting a period of ${context.moodAverage > 3.5 ? 'active expansion' : 'deep internal processing'}.`,
    `I have observed that your thoughts frequently orbit around ${context.keywords.slice(0, 3).join(', ')}. These aren't merely words; they are the recurring melodies of your current life chapter. Specifically, your focus on ${context.frequentTags[0] || 'your core values'} has provided a steady anchor through varying tides.`,
    `Through the Lumina lens, I see you grappling with ${goals.length > 0 ? 'specific intentions like ' + goals[0].toLowerCase() : 'the quiet evolution of your character'}. This shows a mind that is not merely existing, but consciously architecting its own growth.`,
    `As you continue this journey, consider leaning further into ${context.keywords[Math.floor(Math.random() * context.keywords.length)] || 'reflection'}. You are building more than a journal; you are preserving a legacy of awareness.`
  ];

  return {
    content: narrativeParts.join('\n\n'),
    moodScore: context.moodAverage,
    topThemes: context.keywords.slice(0, 5),
    goalsIdentified: Array.from(new Set(goals)).slice(0, 3),
    growthIndicators: growth
  };
}