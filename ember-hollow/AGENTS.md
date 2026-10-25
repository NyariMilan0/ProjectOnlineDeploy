# Instructions for AI assistants working on Ember Hollow

1. Read `HANDOFF.md` first. It describes the current state, architecture, and the next steps.
2. Keep the rendering model described there: clicks never touch the DOM directly, all rendering goes
   through `dom.js` (`EmberDom`), and idle frames must write nothing.
3. Run `npm test` before finishing. All tests must pass.
4. **After every change, update `HANDOFF.md`:** bump the version (and `package.json` to match — a test
   checks this), add a changelog line, fix "Current state" and "Known issues", and rewrite "Next steps"
   so the first item is the most sensible next task.
