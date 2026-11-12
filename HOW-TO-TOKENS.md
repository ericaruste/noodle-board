# How to use the design tokens

## When you export a new token file

1. Replace `tokens/tokens.json` with the new export. Leave the file name as `tokens.json`.
2. In the project folder, run:

```bash
npm run tokens
```

That refreshes the colors and sizes the app can use, and refreshes `docs/token-lookup.md`. You do not edit the generated files by hand.

The token file will keep changing while screens are built from Figma. Export again, replace the JSON, and run the same command.

## When you want a component built from Figma

Send a Figma frame link and the component’s name.

That component becomes its own ticket, titled with the component name. The work is committed on a ticket branch and merged into `phase-2`. It is not merged into `main`. `main` stays the finished Phase 1 board until Phase 2 is ready to land all at once.

## When a value does not match a token

A comment like this means the Figma value was not an exact token, so the nearest token was used:

```css
/* TODO token mismatch: Figma #123456 */
```

Every mismatch is also listed in the reply that built the component.

Fix it in the token app: add the missing token, or correct the one that should have matched. Export a new JSON, replace `tokens/tokens.json`, and run `npm run tokens`. Then the comment can come off.

Shadows, frosted glass, the dot grid, and type size (font size, line height, paragraph spacing) are not in the token build yet. Those are left as drawn in Figma. They are not mismatches.

## Notes for the design system

Each component and toolbar that gets built is written up in `docs/design-system-notes.md`.

That file is the list to work from when you update Figma or the token app: the tokens that were used, the decisions already made, and the changes that are still open.
