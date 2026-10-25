(function (root, factory) {
  'use strict';
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root) root.EmberSkills = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const branches = Object.freeze([
    { id: 'kindling', title: 'Kindling', description: 'Carry a stronger spark into each new life.' },
    { id: 'companions', title: 'Companions', description: 'Grow the friends and engines tending your fire.' },
    { id: 'azure', title: 'Azure', description: 'Find more blue flames and make each one count.' },
    { id: 'time', title: 'Time', description: 'Make patient progress reach a little further.' }
  ].map(Object.freeze));
  const active = [
    { id: 'warm-memory', branch: 'kindling', title: 'Warm memory', description: '+15% all ember production per rank, and start future runs with 100 embers per rank.', maxLevel: 5, basePointCost: 1, baseBlueCost: 0, requires: [], icon: '✦' },
    { id: 'steady-hands', branch: 'kindling', title: 'Steady hands', description: '+15% manual click strength per rank.', maxLevel: 5, basePointCost: 1, baseBlueCost: 10, requires: [{ id: 'warm-memory', level: 1 }], icon: '◆' },
    { id: 'bellows-memory', branch: 'kindling', title: 'Familiar tools', description: 'Start future runs with +1 bellows level per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 25, requires: [{ id: 'steady-hands', level: 1 }], icon: '◇' },
    { id: 'forest-bond', branch: 'companions', title: 'Forest bond', description: '+15% sprite production per rank.', maxLevel: 5, basePointCost: 1, baseBlueCost: 5, requires: [{ id: 'warm-memory', level: 1 }], icon: '✧' },
    { id: 'kilncraft', branch: 'companions', title: 'Kilncraft', description: '+15% kiln production per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 20, requires: [{ id: 'forest-bond', level: 1 }], icon: '▣' },
    { id: 'sprite-memory', branch: 'companions', title: 'An old friend', description: 'Start future runs with +1 sprite level per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 40, requires: [{ id: 'forest-bond', level: 2 }], icon: '✹' },
    { id: 'lucky-embers', branch: 'azure', title: 'Lucky embers', description: '+0.25 percentage points of blue-flame chance per rank after unlocking blue flames.', maxLevel: 5, basePointCost: 1, baseBlueCost: 10, requires: [{ id: 'warm-memory', level: 1 }], icon: '✷' },
    { id: 'blue-resonance', branch: 'azure', title: 'Blue resonance', description: '+20% blue flames per successful drop per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 25, requires: [{ id: 'lucky-embers', level: 1 }], icon: '✵' },
    { id: 'spark-memory', branch: 'azure', title: 'An azure memory', description: 'Start future runs with blue-flame drops already unlocked.', maxLevel: 1, basePointCost: 3, baseBlueCost: 75, requires: [{ id: 'blue-resonance', level: 1 }], icon: '☼' },
    { id: 'patient-fire', branch: 'time', title: 'Patient fire', description: '+10% all automatic ember production per rank.', maxLevel: 5, basePointCost: 1, baseBlueCost: 10, requires: [{ id: 'warm-memory', level: 1 }], icon: '◷' },
    { id: 'careful-spending', branch: 'time', title: 'Careful spending', description: 'Run upgrade prices cost 2% less per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 20, requires: [{ id: 'patient-fire', level: 1 }], icon: '◈' },
    { id: 'long-dreams', branch: 'time', title: 'Long dreams', description: '+1 hour of offline production capacity per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 40, requires: [{ id: 'patient-fire', level: 2 }], icon: '☾' },
    // Second wave of permanent skills.
    { id: 'blazing-start', branch: 'kindling', title: 'Blazing start', description: 'Start future runs with +1,000 embers per rank.', maxLevel: 5, basePointCost: 2, baseBlueCost: 20, requires: [{ id: 'warm-memory', level: 3 }], icon: '✺' },
    { id: 'ember-heart', branch: 'kindling', title: 'Ember heart', description: '+25% all ember production (clicks and automation) per rank.', maxLevel: 5, basePointCost: 3, baseBlueCost: 30, requires: [{ id: 'steady-hands', level: 2 }], icon: '♥' },
    { id: 'kindling-memory', branch: 'kindling', title: 'Dry pockets', description: 'Start future runs with +1 Dry kindling rank per rank.', maxLevel: 3, basePointCost: 3, baseBlueCost: 50, requires: [{ id: 'bellows-memory', level: 1 }], icon: '≋' },
    { id: 'flicker-touch', branch: 'kindling', title: 'Flicker touch', description: 'Each manual click also earns 1% of your automatic production per second, per rank.', maxLevel: 5, basePointCost: 4, baseBlueCost: 80, requires: [{ id: 'ember-heart', level: 1 }], icon: '☄' },
    { id: 'hearthstone-memory', branch: 'kindling', title: 'Hearthstones', description: 'Start future runs with +1 Stone hearth rank per rank.', maxLevel: 3, basePointCost: 5, baseBlueCost: 120, requires: [{ id: 'kindling-memory', level: 1 }], icon: '▤' },
    { id: 'kiln-memory', branch: 'companions', title: 'Banked coals', description: 'Start future runs with +1 Ember kiln level per rank.', maxLevel: 3, basePointCost: 3, baseBlueCost: 60, requires: [{ id: 'kilncraft', level: 1 }], icon: '▥' },
    { id: 'deep-coals', branch: 'companions', title: 'Deep coals', description: 'Each Charcoal bed rank gives +5 percentage points more kiln output, per rank.', maxLevel: 5, basePointCost: 3, baseBlueCost: 40, requires: [{ id: 'kilncraft', level: 2 }], icon: '◼' },
    { id: 'wisp-friend', branch: 'companions', title: 'Wisp friend', description: '+25% Blue siphon roll speed per rank.', maxLevel: 5, basePointCost: 3, baseBlueCost: 60, requires: [{ id: 'sprite-memory', level: 1 }], icon: '❉' },
    { id: 'charcoal-memory', branch: 'companions', title: 'Charcoal cache', description: 'Start future runs with +1 Charcoal bed rank per rank.', maxLevel: 3, basePointCost: 5, baseBlueCost: 150, requires: [{ id: 'deep-coals', level: 1 }, { id: 'kiln-memory', level: 1 }], icon: '■' },
    { id: 'azure-insight', branch: 'azure', title: 'Azure insight', description: 'Blue-flame upgrades cost 5% less per rank.', maxLevel: 5, basePointCost: 3, baseBlueCost: 50, requires: [{ id: 'lucky-embers', level: 2 }], icon: '◎' },
    { id: 'twin-sparks', branch: 'azure', title: 'Twin sparks', description: '+5% chance per rank for a blue drop to be doubled.', maxLevel: 5, basePointCost: 4, baseBlueCost: 150, requires: [{ id: 'blue-resonance', level: 2 }], icon: '❖' },
    { id: 'sapphire-start', branch: 'azure', title: 'Sapphire start', description: 'With An azure memory, start future runs with +25 blue flames per rank.', maxLevel: 5, basePointCost: 4, baseBlueCost: 100, requires: [{ id: 'spark-memory', level: 1 }], icon: '◆' },
    { id: 'lens-memory', branch: 'azure', title: 'Remembered lens', description: 'With An azure memory, start future runs with +1 Cobalt lens rank per rank.', maxLevel: 3, basePointCost: 4, baseBlueCost: 120, requires: [{ id: 'spark-memory', level: 1 }], icon: '◉' },
    { id: 'siphon-memory', branch: 'azure', title: 'Quiet siphon', description: 'With An azure memory, start future runs with +1 Blue siphon level per rank.', maxLevel: 3, basePointCost: 5, baseBlueCost: 200, requires: [{ id: 'lens-memory', level: 1 }], icon: '▼' },
    { id: 'gathered-moments', branch: 'time', title: 'Gathered moments', description: 'On rebirth, keep 5% of the embers you hold per rank.', maxLevel: 5, basePointCost: 3, baseBlueCost: 40, requires: [{ id: 'careful-spending', level: 1 }], icon: '⧗' },
    { id: 'frugal-fire', branch: 'time', title: 'Frugal fire', description: 'Run upgrade prices cost a further 2% less per rank.', maxLevel: 5, basePointCost: 3, baseBlueCost: 60, requires: [{ id: 'careful-spending', level: 3 }], icon: '◇' },
    { id: 'rebirth-echo', branch: 'time', title: 'Echo of lives', description: '+2% all ember production per completed rebirth, per rank.', maxLevel: 5, basePointCost: 4, baseBlueCost: 100, requires: [{ id: 'patient-fire', level: 3 }], icon: '↻' },
    { id: 'deep-sleep', branch: 'time', title: 'Deep sleep', description: '+2 hours of offline production capacity per rank.', maxLevel: 3, basePointCost: 4, baseBlueCost: 120, requires: [{ id: 'long-dreams', level: 3 }], icon: '☽' }
  ];
  const definitions = [];
  branches.forEach(branch => {
    const ready = active.filter(node => node.branch === branch.id);
    for (let position = 1; position <= 25; position++) {
      const node = ready[position - 1] || {
        id: branch.id + '-future-' + position, branch: branch.id,
        title: 'Uncharted ' + branch.title.toLowerCase() + ' ' + position,
        description: 'Reserved for a future permanent skill.', maxLevel: 0,
        basePointCost: 0, baseBlueCost: 0, requires: [], icon: '·'
      };
      definitions.push(Object.freeze(Object.assign({}, node, {
        active: position <= ready.length, tier: position, position: position,
        requires: Object.freeze(node.requires.map(requirement => Object.freeze(requirement)))
      })));
    }
  });
  return Object.freeze({ branches: branches, definitions: Object.freeze(definitions) });
});
