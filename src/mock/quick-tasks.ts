/**
 * The 4 target-persona use cases (from user research on Silicon Valley
 * engineers/heavy adopters) shown as tap-to-start suggestions above the chat
 * input. Tapping one drops a guided setup conversation into the thread.
 */

export type QuickTaskKey = 'devops' | 'intel' | 'health' | 'wealth';

export type QuickTask = {
  key: QuickTaskKey;
  title: string;
  intro: string;
  examples: string[];
};

export const QUICK_TASKS: QuickTask[] = [
  {
    key: 'devops',
    title: 'DevOps & Infra',
    intro:
      "I can watch your repos and infra: summarize important PRs, flag it if your AWS/Vercel budget is close, or alert you here if your main server goes down. What should I check first?",
    examples: [
      'Summarize important PRs on my repo',
      'Check if I went over my AWS budget this month',
      'Alert me here if the main server goes down',
    ],
  },
  {
    key: 'intel',
    title: 'Tech Intelligence',
    intro:
      "I can scan Hacker News, Product Hunt, and ArXiv every morning so you don't have to: top trends, new AI agent launches, papers worth reading. No account needed, these are public feeds. Try one:",
    examples: [
      "Summarize today's top 5 Hacker News trends in 3 lines",
      'Check Product Hunt for new AI agent launches',
      'Find yesterday\'s ArXiv AI papers relevant to my project',
    ],
  },
  {
    key: 'health',
    title: 'Quantified Self & Health',
    intro:
      "I can combine your sleep data with your calendar to suggest rescheduling a heavy meeting after a bad night's sleep, or block workout time when your week is falling short. Want me to check today?",
    examples: [
      'My sleep score is bad. Suggest moving today\'s heavy meeting to tomorrow',
      'Find time today and block a workout to hit my weekly goal',
    ],
  },
  {
    key: 'wealth',
    title: 'Wealth & Crypto',
    intro:
      "I can track wallets and act on price triggers: send a transaction when gas fees hit your target, or brief you when a whale wallet you follow moves. What should I watch for you?",
    examples: [
      'Send ETH from my wallet when gas fees hit today\'s low',
      'Brief me when a whale wallet I track moves',
    ],
  },
];
