---
id: NB-77
title: Motion list and component animations
status: In Progress
priority: 3
labels: [Feature, UX]
parent: NB-E6
blockedBy: []
estimate: 3
linear_id: ERI-93
linear_url: https://linear.app/ericar/issue/ERI-93/motion-list-and-component-animations
---

## Context

The timing reference is `D:\ui-design\noodle-board-UI\animation transition\Noodle Board_ applied components.html`. It is outside this repo. The logo, the menu rows, and the main toolbar in that file are the feel to follow.

There is no shared motion list. [`scripts/build-tokens.js`](../scripts/build-tokens.js) writes [`src/styles/tokens.css`](../src/styles/tokens.css) and [`src/styles/tailwind-theme.js`](../src/styles/tailwind-theme.js). [`src/main.tsx`](../src/main.tsx) imports the token stylesheet, then [`src/index.css`](../src/index.css). [`src/index.css`](../src/index.css) holds the save-dot and save-indicator animations, and each of those has its own `prefers-reduced-motion` block.

[`src/LogoButton.tsx`](../src/LogoButton.tsx) is the button this ticket keeps. A press sets the radius to `16.8px` (42% of the 40px button) and `translateY(1px)` on the mark. The press classes are 80ms and the release classes are 280ms, both with `cubic-bezier(0.34, 1.56, 0.64, 1)`. `releaseMs` is `280`. A timeout of `releaseMs + 80` returns the motion to rest if `transitionend` does not. The rest class is `duration-700` and `cubic-bezier(0.22, 1, 0.36, 1)`. That class eases the corner out to the square on hover and selected, and it is applied again after the release spring ends. The release waits until that timing is in the DOM, then clears the press. The pointer is captured on the press. `?trial=logo-button` and `#logo-button` show the painted states and one live button.

[`docs/design-system-notes.md`](../docs/design-system-notes.md) has a Logo button section for the corner and the dip. Decisions already made, and the Project management toolbar section, name that corner and that dip. They do not name a motion yet.

[`src/MenuItem.tsx`](../src/MenuItem.tsx) is the row from [NB-41](NB-41-menu-item.md). A default row uses `enabled:hover:bg-mapped-surface-action-hover`. The fill is instant. Left padding is `px-brand-scale-8`, or `pl-brand-scale-32` when `indent` is set. The right padding stays `brand.scale.8`. Nothing nudges. The caption and the chevron sit in the trailing group. `?trial=menu-item` paints the states, one indented row, and one truncated row. The notes say focus is not painted.

[`src/MainButton.tsx`](../src/MainButton.tsx) is the 40px button from [NB-63](NB-63-main-button.md). A default button uses `enabled:hover:bg-mapped-surface-action-strong-hover`. A destructive button uses `enabled:hover:bg-mapped-surface-error-hover`. A selected button has no hover fill class. The file has no transition and no pill. `?trial=main-button` paints the types and the slots.

[`src/Toolbar.tsx`](../src/Toolbar.tsx) is the bottom bar from [NB-64](NB-64-main-toolbar.md). Every control is a `MainButton` with the label and the right icon off. Each one sits in a `Tip` whose span is `relative`. Delete is the destructive type and does not set `aria-pressed`. The selected tools set `aria-pressed`. The bar is a `FloatingPanel` on the toolbar layer, class `board-toolbar`. There is no shared pill. Hover is each button's own fill.

## Problem

Press, release, hover, highlight, nudge, glide, and fade are either missing or written as raw durations and curves on the component that uses them. Reduced motion cannot turn that set off from one place. The menu row does not nudge. The main toolbar does not glide one pill between tools. The logo's return to the circle and the HTML reference disagree, and that choice is still open.

## Repro

1. Open the HTML reference. Hover and press the logo, hover a menu row and an indented row, and move across the toolbar until the pointer leaves.
2. Open `?trial=logo-button` and press the live button.
3. Open `?trial=menu-item` and hover a row, then an indented row.
4. Open the board and move the pointer across the tools, then leave the bar.

## Acceptance criteria

- [ ] `src/styles/motion.css` is hand-written, sits next to the token stylesheet, and is imported with it. `npm run tokens` leaves the file in place
- [ ] The file names press (80ms snappy), release (280ms springy), hover (200ms snappy), highlight (60ms), nudge (120ms gentle), glide (130ms gentle), and fade (120ms gentle)
- [ ] A component calls a motion by that name. The durations and the curves live in the motion file
- [ ] With reduced motion on, every name in that file is off, and that switch is in the motion file
- [ ] LogoButton keeps the corner change and the noodle dip. The press, the release, and the JavaScript that waits out the release use the motion names
- [ ] MenuItem owns the hover nudge, 3px to the right, and the background highlight. An indented row nudges from its own left padding
- [ ] MainButton stays a plain building block. The sliding pill is absent from that file
- [ ] The main toolbar owns the pill. The pill glides between tools and fades out when the pointer leaves. The pill logic is a hook other toolbars can call
- [ ] The pill skips a disabled tool. With nothing selected, moving onto Delete fades the pill out. No red pill shows, and the pill does not stay on the previous tool
- [ ] The toolbar turns off its buttons' own hover fill in one named place, so only the pill shows on hover
- [ ] While Delete is disabled, its tooltip reads "Select something to delete". Once an element is selected, it reads "Delete"
- [ ] The Logo button, Menu item, Main button, and Main toolbar sections in `docs/design-system-notes.md` each have a Motion row: what moves, what triggers it, and which motion name it uses
- [ ] The logo's return to rest stays the open choice below. The notes list both timings

## Technical notes

Add [`src/styles/motion.css`](../src/styles/motion.css) and import it from [`src/main.tsx`](../src/main.tsx) after the token stylesheet. A comment at the top says the file is hand-written. Do not add it as a destination in [`scripts/build-tokens.js`](../scripts/build-tokens.js). Do not put the durations in [`src/styles/tailwind-theme.js`](../src/styles/tailwind-theme.js), which `npm run tokens` overwrites.

The HTML file defines the curves. Snappy is `--snap`, `cubic-bezier(0.3, 0.7, 0.2, 1)`. Springy is `--spring`, `cubic-bezier(0.34, 1.56, 0.64, 1)`. Gentle is `ease-out`, the curve on the menu's padding and on the pill's move. Highlight is `background .06s` with no curve, so the name uses CSS `ease`. The HTML writes the pill's opacity as `.12s` with no curve. This list calls fade gentle, so fade uses `ease-out`.

Each name is a pair of custom properties, `--motion-press-duration` and `--motion-press-ease`, and the same for release, hover, highlight, nudge, glide, and fade. A utility class of the same name sets `transition-duration` and `transition-timing-function` from that pair: `motion-press`, `motion-release`, `motion-hover`, `motion-highlight`, `motion-nudge`, `motion-glide`, `motion-fade`. A transition of one property is the property plus the class, as in `transition-[border-radius] motion-press`. Two properties on one element would fight if both classes set `transition-duration`. That element writes the transition from the custom properties, still by these names.

One `prefers-reduced-motion: reduce` block in this file sets every duration property to `0s`. That is the switch. Take `motion-reduce:transition-none` and `motion-reduce:!transition-none` off the logo transitions so they are not a second switch.

The corner-and-dip press is already in `LogoButton`. The pressed corner is `16.8px`. The mark dips `translateY(1px)`. The HTML dip is `1.6px` on a 64px button. Both lengths stay off the token list. The pointer capture stays. The release still waits until the release timing is in the DOM, then clears the press. Press uses `motion-press` on the corner and on the mark. Release uses `motion-release` on both. The button's press curve is the spring today. The list says press is snappy, which is what the HTML keeps when `:active` only shortens the duration. Use the list.

`releaseMs` is the raw `280`. Read `--motion-release-duration` from the motion properties and use that in the timeout. `parseFloat` of `280ms` is 280, and `parseFloat` of `0s` is 0, so reduced motion shortens the wait with the same read. Keep the extra 80ms buffer the timeout already adds. The buffer stays in the component. The 280 does not.

Hover and selected ease the corner out to the square with `motion-hover`. The rest class today is the 700ms curve for that expansion and for the return to the circle. Split those. The expansion uses hover. The return is the open question.

MenuItem: a default row and the painted hover state move 3px to the right. Add the 3px to that row's own left padding, `calc(var(--brand-scale-8) + 3px)`, or `calc(var(--brand-scale-32) + 3px)` when `indent` is set. The 3px is the HTML nudge. It is not a spacing token. Only `padding-left` changes, so the caption and the chevron stay on the right. The background uses highlight, and the padding uses nudge. Selected and disabled rows stay put. Focus stays unpainted.

MainButton gains no pill prop, no motion class, and no glide. Its hover fill stays for the trial and for any use outside the main toolbar.

The pill hook is [`src/useSlidingPill.ts`](../src/useSlidingPill.ts). It takes the row, tracks the tool under the pointer, and returns the pill's box and the active element. Position comes from the two `getBoundingClientRect` boxes. `offsetLeft` on a button is the wrong number here, because each `Tip` span is `relative`. The hook does not name a tool. The toolbar sets the fill: `mapped.surface.action-strong-hover` on a tool, and `mapped.surface.error-hover` while the active control is the destructive button. The pill is the first child of the relative row, `pointer-events-none`, with the button radius `alias.border-radius.lg`. Transform, width, and height use glide. Opacity uses fade, and the opacity goes to 0 when the pointer leaves the row. The HTML also shows the pill on focus and clears it when focus leaves the row. The hook does the same.

A disabled control is not a target. When the pointer is over a disabled button, the hook treats it like leaving the row and the opacity goes to 0. Browsers can drop pointer events on a disabled button, so the hook resolves the target from the row's own pointer events, not from events on the button. Check in the browser that moving from Noodle onto a disabled Delete fades the pill out and does not leave it on Noodle. Delete is the only control that disables today, and the rule covers any tool that disables later.

The pill stays inside the toolbar's `FloatingPanel`. It adds no z-index of its own. DOM order keeps it behind the buttons. A selected button keeps `aria-pressed="true"` and its selected fill. The row clears the hover background on a button that is not pressed, so the pill shows through the resting fill. That clear lives in one named place in the toolbar: a `pill-row` class on the row and one rule for it in [`src/index.css`](../src/index.css). No other file overrides the button's hover. The selected fill stays.

Delete's `Tip` label follows `canDelete`: "Delete" when an element is selected, "Select something to delete" while the button is disabled. The `Tip` span wraps the button, so the label still shows on hover while the button is disabled. The `ariaLabel` stays "Delete".

The toolbar is already a FloatingPanel on the toolbar layer. The pill is not a new panel. Check the bar against a selected element and an element that is mid-drag, the same check the toolbar already has. Drag-feedback overlays read their layer from the selection token and add no z-index numbers of their own.

The Logo button section is already in the notes. Add its Motion row. Menu item, Main button, and Main toolbar already have sections. Each Motion row says what moves, what triggers it, and which name it uses. The Main button row says the button does not move and the pill belongs to the toolbar. The logo row lists both return timings from the open question.

Decisions already made, and the Project management toolbar section, already name the corner and the dip. Point those lines at the motion names when the names exist. Leave the rest of that toolbar's table as it is.

Trials stay `?trial=logo-button`, `?trial=menu-item`, and `?trial=main-button`. The pill is on the board's main toolbar. The main-button trial has no pill.

## Open question

LogoButton returns to the resting circle with 700ms, `cubic-bezier(0.22, 1, 0.36, 1)`. That is the rest class on the logo button.

The HTML returns the logo to the circle with the 280ms spring, `cubic-bezier(0.34, 1.56, 0.64, 1)`, which is the release motion in this list.

Leave the return on the 700ms curve until this choice is written here. Do not give that 700ms curve a motion name. The expansion to the square still uses hover.

## Out of scope

The save-dot and save-indicator animations, and their reduced-motion rules in `src/index.css`. Wiring the pill hook into the project toolbar, the text toolbar, the shape toolbar, the noodle toolbar, or the color picker. A pill prop on `MainButton`. Choosing the logo's return timing. The file bar on the board. A painted focus state on the menu item. `tokens/tokens.json` and the generated token files.

Every new toolbar, dropdown, and popover uses FloatingPanel and the z-index tokens in src/layers.ts (canvas, selection, toolbar, dropdown, modal), and a ticket is not done until those panels have been checked against selected and mid-drag elements. Drag-feedback overlays (port fill, edge outline, edge marker) read their layer from the selection token and add no z-index numbers of their own.
