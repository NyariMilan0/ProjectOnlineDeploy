(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EmberAchievements = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const definitions = Object.freeze([
    { id: 'first-spark', title: 'First spark', description: 'Click the fire for the first time.', stat: 'manualClicks', target: 1, icon: '✦' },
    { id: 'hundred-clicks', title: 'Warm hands', description: 'Click the fire 100 times manually.', stat: 'manualClicks', target: 100, icon: '◆' },
    { id: 'thousand-clicks', title: 'Fire keeper', description: 'Click the fire 1,000 times manually.', stat: 'manualClicks', target: 1000, icon: '✹' },
    { id: 'hundred-embers', title: 'A glowing start', description: 'Earn 100 embers in total.', stat: 'totalEarned', target: 100, icon: '★' },
    { id: 'thousand-embers', title: 'A proper fire', description: 'Earn 1,000 embers in total.', stat: 'totalEarned', target: 1000, icon: '✷' },
    { id: 'ten-thousand-embers', title: 'The hollow glows', description: 'Earn 10,000 embers in total.', stat: 'totalEarned', target: 10000, icon: '☀' },
    { id: 'hundred-thousand-embers', title: 'A sea of sparks', description: 'Earn 100,000 embers in total.', stat: 'totalEarned', target: 100000, icon: '✺' },
    { id: 'million-embers', title: 'An endless summer', description: 'Earn 1,000,000 embers in total.', stat: 'totalEarned', target: 1000000, icon: '✵' },
    { id: 'first-bellows', title: 'Room to grow', description: 'Buy your first bellows upgrade.', stat: 'bestBellows', target: 1, icon: '◇' },
    { id: 'tenth-bellows', title: 'A stronger spark', description: 'Reach bellows level 10 in any run.', stat: 'bestBellows', target: 10, icon: '◈' },
    { id: 'sprite-five', title: 'A bright friendship', description: 'Grow your sprite to level 5 in any run.', stat: 'bestSprites', target: 5, icon: '✧' },
    { id: 'first-kiln', title: 'Built to glow', description: 'Build your first ember kiln.', stat: 'bestKiln', target: 1, icon: '▣' },
    { id: 'first-blue', title: 'A different kind of spark', description: 'Find your first blue flame.', stat: 'lifetimeBlue', target: 1, icon: '✦' },
    { id: 'hundred-blue', title: 'Azure collector', description: 'Gather 100 blue flames in total.', stat: 'lifetimeBlue', target: 100, icon: '◆' },
    { id: 'thousand-blue', title: 'A blue horizon', description: 'Gather 1,000 blue flames in total.', stat: 'lifetimeBlue', target: 1000, icon: '✵' },
    { id: 'first-rebirth', title: 'Begin again', description: 'Complete your first rebirth.', stat: 'rebirthCount', target: 1, icon: '↻' },
    { id: 'five-rebirth-points', title: 'Remembered warmth', description: 'Earn 5 rebirth points in total.', stat: 'totalRebirthPoints', target: 5, icon: '◈' },
    { id: 'ten-thousand-clicks', title: 'Tireless', description: 'Click the fire 10,000 times manually.', stat: 'manualClicks', target: 10000, icon: '✊' },
    { id: 'ten-million-embers', title: 'A blazing age', description: 'Earn 10,000,000 embers in total.', stat: 'totalEarned', target: 10000000, icon: '☀' },
    { id: 'billion-embers', title: 'A forest of light', description: 'Earn 1,000,000,000 embers in total.', stat: 'totalEarned', target: 1000000000, icon: '✺' },
    { id: 'tenth-kiln', title: 'Roaring kiln', description: 'Reach kiln level 10 in any run.', stat: 'bestKiln', target: 10, icon: '▥' },
    { id: 'master-builder', title: 'Master builder', description: 'Buy 100 upgrades in total.', stat: 'upgradesPurchased', target: 100, icon: '⚒' },
    { id: 'lucky-streak', title: 'Lucky streak', description: 'Find blue flames 500 times.', stat: 'blueDrops', target: 500, icon: '❖' },
    { id: 'ten-thousand-blue', title: 'Azure tide', description: 'Gather 10,000 blue flames in total.', stat: 'lifetimeBlue', target: 10000, icon: '≈' },
    { id: 'hundred-thousand-blue', title: 'A sky full of blue', description: 'Gather 100,000 blue flames in total.', stat: 'lifetimeBlue', target: 100000, icon: '❉' },
    { id: 'five-rebirths', title: 'Old soul', description: 'Complete 5 rebirths.', stat: 'rebirthCount', target: 5, icon: '↺' },
    { id: 'ten-rebirth-points', title: 'Deep roots', description: 'Earn 10 rebirth points in total.', stat: 'totalRebirthPoints', target: 10, icon: '♣' },
    { id: 'first-skill', title: 'Something learned', description: 'Learn your first permanent skill.', stat: 'skillRanks', target: 1, icon: '✎' },
    { id: 'ten-skill-ranks', title: 'Well practised', description: 'Learn 10 permanent skill ranks.', stat: 'skillRanks', target: 10, icon: '✍' },
    { id: 'first-ash', title: 'Something grows', description: 'Gather your first ash in the grove.', stat: 'lifetimeAsh', target: 1, icon: '♣' },
    { id: 'thousand-ash', title: 'An ash grove', description: 'Gather 1,000 ash in total.', stat: 'lifetimeAsh', target: 1000, icon: '♠' },
    { id: 'million-ash', title: 'A forest remembers', description: 'Gather 1,000,000 ash in total.', stat: 'lifetimeAsh', target: 1000000, icon: '♧' },
    { id: 'first-auto-rebirth', title: 'Hands-free', description: 'Let the rebirth keeper begin a new life.', stat: 'autoRebirths', target: 1, icon: '↻' },
    { id: 'thirty-skill-ranks', title: 'Keeper of the hollow', description: 'Learn 30 permanent skill ranks.', stat: 'skillRanks', target: 30, icon: '♛' }
  ].map(definition => Object.freeze(definition)));

  function skillRanks(state) {
    const skills = state.skills && typeof state.skills === 'object' ? state.skills : {};
    return Object.values(skills).reduce((sum, rank) => sum + (typeof rank === 'number' && Number.isFinite(rank) ? Math.max(0, rank) : 0), 0);
  }
  function evaluate(state) {
    const source = state && typeof state === 'object' ? state : {};
    const legacyFields = { bestBellows: 'bellows', bestSprites: 'sprites', bestKiln: 'kiln' };
    const safeValue = value => typeof value === 'number' && Number.isFinite(value) ? Math.max(0, value) : 0;
    return definitions.map(definition => {
      const field = definition.stat;
      const value = field === 'skillRanks' ? skillRanks(source)
        : Math.max(safeValue(source[field]), safeValue(source[legacyFields[field]]));
      const progress = Math.min(definition.target, value);
      return Object.assign({}, definition, { progress: progress, unlocked: progress >= definition.target });
    });
  }

  return Object.freeze({ definitions: definitions, evaluate: evaluate });
});
