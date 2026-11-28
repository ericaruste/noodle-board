# Design system notes

A running list of what each built piece taught us, so the token file and the app stay in one place.

When a component, toolbar, dropdown, or popover is built, its section is added here. Each section names the ticket and the code path. It has its own token table. It lists the properties and their values, and it says which states are painted.

Shadow, blur, and the dot grid are left out of the token build. In the table they are marked `not a token`. They are not mismatches. Font size and line height use the responsive desktop tokens. Paragraph spacing is not in the export, so it stays `not a token`.

## Still to update

- **[code] Underline and strikethrough.** They are drawn on the text toolbar and are not in the app. They wait for the text feature.
- **[token app] Color picker field height.** The saturation field, including the 12px black band, is 108px. No spacing token is 108px.
- **[token app] Color picker toolbar width.** The swatch grid and the hex row are 152px: five 24px discs and four 8px gaps. No spacing token is 152px. The picker field stays 172px. No spacing token is 172px.
- **[token app] `brand.neutral` is not the swatch.** `brand.neutral.200` and `brand.neutral.500` are both `#5B4BDB`. `alias.swatch.neutral` does not use them. Step 200 is `alias.warm-neutral.100` (`#FDFBF7`) at 60%. Step 500 is `alias.cool-neutral.900` (`#303132`).
- **[token app] Placeholder line height sits beside `md`.** The path is `responsive.desktop.placeholder.line-height`, not `responsive.desktop.placeholder.md.line-height`. `md` has a size only. `responsive.desktop.body.lg` has no `line-height-tight`.
- **[token app] Opacity track width.** The pill is 120px wide. No spacing token is 120px.
- **[token app] Main toolbar padding.** The 342 by 48 hug includes a 1px stroke, so the space inside the stroke is 3px. No spacing token is 3px. The bar uses 4px, `brand.scale.4`.
- **[token app] Main button hover fill.** This export maps `mapped.surface.action-strong-hover` to `alias.primary.50` (`#E5F0F9`). The previous export used `alias.primary.400` (`#6EA9E2`). The button follows this export. Hover text and icons stay `mapped.text.action-hover` and `mapped.icon.action-hover`.
- **[token app] Title input width.** The field stops at 320px. No spacing token is 320px.
- **[token app] Project toolbar title minimum.** The title slot on the project toolbar is at least 200px. No spacing token is 200px. The title input still hugs its text outside that bar.
- **[token app] Project toolbar corner.** The corner measures about 10px. The bar uses `alias.border-radius.xl` (12px).
- **[token app] Project menu width.** The main menu and the recent panel are each 220px wide on `lg` and 180px on `md`. No spacing token is 220px or 180px.
- **[code] Logo return to the circle.** The button returns with 700ms, `cubic-bezier(0.22, 1, 0.36, 1)`. That curve has no motion name. The other timing is `motion-release`. The choice is open.

## Decisions already made

- The project toolbar blurs the canvas with the existing 24px frost, the same blur as the main toolbar. Blur is not a token.
- The board shows the project management toolbar in place of the file bar. The bar is a FloatingPanel on the toolbar layer, 16px from the top and the left (`brand.scale.16`). The menus share one FloatingPanel on the dropdown layer, 4px under the bar. The title commits on Enter or blur, Escape cancels, and an empty name becomes `Untitled`. The board's New row has no caption. Open, Save, and Save as keep theirs. An empty recent list reads "No recent boards yet." The word Recent is a disabled menu item: label only, no hover fill, and no nudge. The wrapper around the two panels ignores pointer events, so a press in the gap or under the recent panel reaches the canvas and closes the menu.
- A press on the logo button pulls the corner toward the circle and dips the mark. Press is `motion-press`. Release is `motion-release`. The pressed corner is 16.8px, 42% of the 40px button, and the dip is 1px. Neither is a token. Hover and selected expand the corner with `motion-hover`. The return to the circle stays 700ms, `cubic-bezier(0.22, 1, 0.36, 1)`, and that choice is open.
- A pointer down outside the project menu closes that menu. A pointer down on the logo switches it. A pointer down inside the main menu or the recent panel leaves it open. The wrapper around the two panels ignores pointer events, so a press in the gap or under the shorter panel counts as outside.
- The divider under Recent stays inside the project menu padding. It is the same width as a menu item.
- The project menu and the recent panel are each 220px wide on `lg` and 180px on `md`. No spacing token is 220px or 180px. The board uses `md`.
- A truncated project title shows the full title in the main toolbar’s hover label, 8px above the field. It is not the browser’s native title tooltip.
- A project name in the project menu clips to the row. Hover or focus on a clipped name shows the full title in that same hover label, 8px above the row. The label wraps at the row, and it never grows past 320px. It is not the browser’s native title tooltip.
- The shape icons and the line-weight icon crop their view boxes so a 16px slot matches a Lucide icon. Wider shape files stay wider. The line-weight stroke is 1.33, the same painted weight as the shape stroke of 1.5. The trial at `?trial=icon-fit` still shows the uncropped files.
- Heading, body, and caption are Geist. The placeholder face is Open Sans, `alias.font-family.placeholder`. SF Pro is gone from the token export.
- The spec sheet around a component (state names, the red height notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.
- Shadow, blur, and the dot grid are `not a token`.
- `mapped.surface.default` in `tokens.json` is `#F6F9FD` at 60% (`alias.cool-neutral.200`). The text toolbar, the align popover, the font style menu, the typeface menu, and the font size menu use that fill with the existing 24px blur and the existing shadow, the same frost as the rest of the board.
- Desktop font size and line height are tokens under `responsive.desktop`. The 12px tight style is `responsive.desktop.body.sm.size` and `responsive.desktop.body.sm.line-height-tight`. That style was `body.md`. `body.md` is now 14px / 16.8px, with tight 14px, which is the old `body.lg`. `body.lg` is 16px / 19.2px and has no tight line height. The caption size is `responsive.desktop.caption.md.size` (10px) and `responsive.desktop.caption.md.line-height-tight` (10px). Paragraph spacing is not in the export, so it stays `not a token`.
- Canvas text on a sticky, a noodle, and a shape defaults to Open Sans at `responsive.desktop.placeholder.md.size` (14px) and `responsive.desktop.placeholder.line-height` (16.8px). The empty hint uses `mapped.text.placeholder` (`alias.cool-neutral.800`, `#606264`). Typed sticky and shape text keeps the existing slate ink. A noodle label keeps the stroke color, and its weight stays 600. A text object stays at 14px with the family omitted. A run that sets its own family or size still wins.
- Spacing steps are named with the pixel size. `brand.scale.4` is 4px and `brand.scale.8` is 8px. The range is `brand.scale.0` through `brand.scale.56`. `brand.scale.52` (52px) and `brand.scale.56` (56px) are new. The old names, such as `brand.scale.100` for 4px and `brand.scale.1200` for 48px, are gone.
- A selection that mixes two values (two alignments, two weights) is not a painted variant. The control stays in the default look.
- Icons are Lucide. The spec shows a case-sensitive icon and a chevron. The app draws those with Lucide, 16px for the main icon and 8px for the chevron. The menu item chevron is `chevron-right` at 12px. The menu item left icon is `chevron-right` at 16px. Its default color is `mapped.icon.action-light`. Hover, selected, and disabled use the icon color that matches the label in that state.
- The contextual button has no focus state. The description that names focus was a mistake. Do not paint a focus ring, and do not use `mapped.border.action-ring-focus` on this button. The menu item has no focus state either. Its painted set is default, hover, selected, and disabled.
- Contextual toolbars and their popovers share one sliding pill row, `src/components/PillRow.tsx`. The pill fill on those rows is `mapped.surface.action-hover`. The main toolbar uses the same row and keeps `mapped.surface.action-strong-hover`, or `mapped.surface.error-hover` while Delete can run. The contextual button itself has no pill. A selected button keeps `mapped.surface.action-selected`. A font size field that is being edited is not a target.
- The font size button opens its preset menu on a single click of the number or the chevron. A double click edits the number.
- The typeface menu lists the `alias.typeface` collection, in that order: Geist Mono, Open Sans, Coming Soon, Noto Serif, Montserrat. Each label is drawn in its own `alias.typeface` token. Other menus keep Geist.
- Each font size row is `brand.scale.36` (36px). The menu hugs that width. A row that hugged its label would change width between 10 and 72. The list is 10, 12, 14, 16, 18, 24, 32, 36, 40, 48, 64, 72. 40 is in the frame and was not in the Phase 1 list.
- A popover or dropdown sits `brand.scale.4` (4px) away from the floating toolbar that opened it. The gap is measured from the toolbar’s outer edge, not from the button inside it.
- The color swatch action ring is an outline stroke outside the disc. A second stroke there would change the disc border, so the ring is an outline. Hover and selected are 4px, `alias.border-width.md`. The frame measures 3px. Selected uses `mapped.border.action-ring-focus`, not `mapped.border.action-ring-selected`.
- The custom preview is a 12px circle, `brand.scale.12`, with a 1px white stroke, `brand.foundation.white` at `alias.border-width.xsm`, drawn inside the circle. It is not a separate white circle. The custom swatch has no disc stroke in default, hover, or selected. None and color keep the 1px `mapped.border.control` stroke on default only. Hover and selected drop it. Keyboard focus uses the hover ring, so that stroke is hidden then too.
- The noodle toolbar’s color control is a 16px disc, `brand.scale.16`, the contextual button’s icon slot. The button is 32px with 8px padding, so the 24px color swatch does not fit in that slot. The open control is the color picker toolbar at step 500. The leading disc is `alias.swatch.neutral.500` (`#303132`). A new noodle, and the connect preview, start on that color. A saved hex that is not a step-500 swatch stays on the stroke and selects custom.
- A transparent sticky is the neutral 200 swatch. The fill is `alias.swatch.neutral.200`, `alias.warm-neutral.100` (`#FDFBF7`) at 60%, and the blur is the existing 24px frost. Blur is not a token. The sticky toolbar’s leading disc is that swatch. The color picker trial keeps none. A new note starts on `alias.swatch.purple.200` (`#EBCFFF`). A saved none stays clear, with no frost. Another swatch or a custom color stays as stored. `data.color` stays a legacy name so older files still open.
- The fill opacity slider is the track, the thumb, and a percent label. Dragging the thumb sets 0 to 100. A double click on the percent edits the number, the same gesture as the font size button. Enter commits. Escape restores. The percent slot is the width of `100%` in tabular figures, and the number is left-aligned in that slot, so `0%` sits next to the slider and the row does not change width. The gap before the percent is 16px, `brand.scale.16`. The thumb has two sizes. `sm` is 12px, `brand.scale.12`, and it is the default. `md` is 16px, `brand.scale.16`. The track has two sizes. `sm` is 8px, `brand.scale.8`. `md` is 12px, `brand.scale.12`. The slider default is the `sm` pair. At 100% the 12px thumb hangs 6px past the track, so the 16px gap still leaves room before the number. The sheet label over the pressed thumb says focus. The variant property is pressed. The track stays centered on the thumb.
- The line weight and line type row is one component, `src/components/StrokeProperty.tsx`. A noodle toolbar and a shape toolbar both open it. Each toolbar still owns the open state and writes its own thickness and line style. The row is thin, medium, and thick, a divider, then solid and dashed. A mixed value leaves that group unselected. Choosing a weight or a line style leaves the menu open. Noodle thickness and shape thickness stay the pixel sizes they already paint. Dashed stays `8 6`.
- `mapped.surface.action-strong-hover` is `alias.primary.50` (`#E5F0F9`) at 100% in this export. The main button and the main toolbar use that fill on hover. Default type hover text is `mapped.text.action-hover` (`#1E3B58`) and the icons are `mapped.icon.action-hover` (`#1E3B58`). Selected keeps the light foreground.
- Success is `brand.green`, aliased as `alias.success`. `mapped.icon.success` is `alias.success.500` (`#16A34A`). `mapped.icon.success-light` is `alias.success.300` (`#72C68F`). The save indicator rests on success-light and breathes to success. The ring uses success.
- `mapped.icon.action-light` is `alias.cool-neutral.700` (`#909397`). No component paints it yet.
- The shape kind row is one component, `src/components/ShapeSwatch.tsx`. The shape toolbar and the bottom Shapes tool both open it. Each caller owns the open state. On a selected shape, choosing a kind changes that shape and closes the menu. On the bottom tool, choosing a kind places it and closes the menu. The row is rectangle, ellipse, rounded rectangle, triangle, and diamond. A mixed kind leaves every button unselected. The row has no divider.
- The shape toolbar’s fill opens the color picker at step 200, and its stroke opens the color picker at step 500. Both offer none. A new shape’s fill is `alias.swatch.purple.200` (`#EBCFFF`) and its stroke is `alias.swatch.purple.500` (`#BF66FF`). A shape already saved keeps its own fill and stroke. The disc on the button is the color swatch’s default paint, type none or color, drawn at 16px because that is the contextual button’s icon slot. A shape saved before the slider, and a new shape, stays at 100% opacity. The specimen on the frame reads 50%. Medium weight is the 2px stroke a shape already paints. Dashed uses the same `8 6` dash as a noodle.
- Color swatches and the custom swatch are separate choices. A color swatch uses `alias.swatch`. Fill and sticky notes use step 200. Stroke and noodles use step 500. The custom swatch can be selected on its own. Its color comes from the color picker (react-colorful), not from `alias.swatch`. Choosing a palette swatch does not change the custom color. Opening the custom swatch while a palette color is selected copies that palette into the picker, so the fill stays the color already chosen and the picker shows it. The custom disc stays on the default color `EBCFFF` until custom is the selection. A drag, a hex edit, or the pipette is what changes the fill after that. The toolbar keeps one selection at a time. The extended frame paints a ring on none and on custom together. Custom is the selection while the picker is open. The picker is its own panel, `brand.scale.4` (4px) from the toolbar’s outer edge, top aligned. It sits on the right when that side fits, and on the left when the toolbar is against the right edge of the board. It is out of the toolbar’s box, so opening it does not move the centered bar. Both panels use 8px padding, `brand.scale.8`.

## Canvas text

The tokens are `alias.font-family.placeholder`, `responsive.desktop.placeholder`, and `mapped.text.placeholder`. Code: `src/canvas/RichText.tsx` (`canvasDefault` on a sticky and a shape), `src/canvas/PlacementGhost.tsx` for the sticky ghost, and `.noodle-edge-label` in `src/index.css`. A text object does not use this style.

| Piece | Token | Value |
| --- | --- | --- |
| Font | `alias.font-family.placeholder` | Open Sans |
| Size | `responsive.desktop.placeholder.md.size` | 14px |
| Line height | `responsive.desktop.placeholder.line-height` | 16.8px. The line height sits beside `md`, not inside it. Paragraph spacing is `not a token` |
| Empty hint | `mapped.text.placeholder` | `#606264`, `alias.cool-neutral.800` |
| Typed sticky and shape | none | the existing slate ink |
| Typed noodle | the stroke color | unchanged. Weight stays 600 |
| Text object | none | 14px, family omitted |

The empty hint and the typed default share the font and the size. A run that sets its own family or size still wins. The toolbar shows Open Sans and 14 when the run has neither.

## Contextual button

Ticket NB-38, NB-79. Code `src/components/ContextualButton.tsx`. The trial page is `?trial=contextual-button`. NB-79 leaves this button still. The sliding pill belongs to the row.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.32` | 32px |
| Padding | `brand.scale.8` | 8px |
| Gap | `brand.scale.4` | 4px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the button has no stroke |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight` |
| Icon | `brand.scale.16` | 16px |
| Chevron | `brand.scale.8` | 8px |
| Default fill | `mapped.surface.action` | `#E5F0F9` at 0% |
| Hover fill | `mapped.surface.action-hover` | `#E5F0F9` |
| Selected fill | `mapped.surface.action-selected` | `#DBEAF8` |
| Disabled fill | `mapped.surface.action` | `#E5F0F9` at 0% |
| Text, default | `mapped.text.action` | `#303132` |
| Text, hover | `mapped.text.action-hover` | `#1E3B58` |
| Text, selected | `mapped.text.action-selected` | `#1E3B58` |
| Text, disabled | `mapped.text.disabled` | `#909397` |
| Icon, default | `mapped.icon.action` | `#303132` |
| Icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Icon, disabled | `mapped.icon.disabled` | `#909397` |
| Motion | none | The button does not move. The sliding pill belongs to the row that places it. This button has no pill |

The icon nodes did not return a fill of their own. The icon color is the label color for that state.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| state | variant | `Default`, `hover`, `selected`, `disabled` |
| Label | text | default `Label` |
| Show Label | boolean | default on |
| Show left icon | boolean | default on |
| Show right icon | boolean | default on |
| Show dropdown icon | boolean | default on |

The set does not expose `type`. It does not expose a separate selected switch. Selected is the state value `selected`.

Painted states: `Default`, `hover`, `selected`, `disabled`.

There is no focus state. The description that names focus was a mistake.

This button is not a toolbar. A toolbar that places it is its own component.

## Sliding pill row

Ticket NB-79. Code `src/components/PillRow.tsx`. The hook is `src/hooks/useSlidingPill.ts`. The trial page is `?trial=pill-row`.

One row wraps a line of controls and paints one pill as its first child. The pill adds no z-index. DOM order keeps it behind the controls. `.pill-row` clears the hover fill on a resting button and on a resting group, so the pill is the hover. A control with `aria-pressed="true"`, or with the selected fill, keeps that fill. The text toolbar, the shape toolbar, and the noodle toolbar each put one row around the whole bar, so the pill can cross a divider. The text align popover, the shape swatch, the noodle type menu, each arrow menu, and the line weight and line type menu each have their own row. A menu is portaled, so leaving the toolbar fades that bar's pill and the menu shows its own. The main toolbar uses this row too. Its fill is not the default below.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | the control under the pointer or focus |
| Width | none | that same control |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the pill has no stroke |
| Fill | `mapped.surface.action-hover` | `#E5F0F9`. The main toolbar passes `mapped.surface.action-strong-hover`, or `mapped.surface.error-hover` while the active control is Delete |
| Shadow | not a token | the pill has no shadow |
| Blur | not a token | the pill has no blur |
| Divider | none | this row does not draw one. A bar keeps its divider on the group |
| Motion | not a token | The pill glides with `motion-glide` and fades with `motion-fade` when the pointer or focus leaves the row, when the pointer is on a disabled button, or while a marked control asks to be skipped. A gap between controls keeps the current pill. Leaving the row is what fades it |

| Property | Kind | Values |
| --- | --- | --- |
| fill | class or function | default `mapped.surface.action-hover`. A function reads the active control, including while the pill fades |
| children | the controls | the buttons and groups in the row |

Painted: the pill while a control is under the pointer or focused. Not painted: a row the pointer has left, a disabled button, and a font size field while that field is being edited. The fill opacity slider is not a target.

## Text toolbar

Ticket NB-39, NB-79. Code `src/toolbars/TextToolbar.tsx`. The pill row is `src/components/PillRow.tsx`.

Every control is a contextual button with the unused slots turned off.

- First group: font, size, weight, alignment. A divider sits on the right of the group.
- Second group: bulleted list, numbered list, and link. Icon only. Underline and strikethrough are left out on purpose.
- Size keeps the number in the label slot. A single click anywhere on the size button opens the presets. A double click edits the number.
- The weight label reserves the width of “Bold Italic”.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | hug. 4px padding and a 32px button make 40px, which is `brand.scale.40` |
| Padding | `brand.scale.4` | 4px |
| Gap inside a group | `brand.scale.2` | 2px |
| Gap between groups | `brand.scale.4` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | `mapped.border.default`, `alias.border-width.xsm` | 1px `#D8DCE2` on the right of the first group, with 4px (`brand.scale.4`) of padding before it |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text, default | `mapped.text.action` | `#303132` |
| Control text, hover | `mapped.text.action-hover` | `#1E3B58` |
| Control text, selected | `mapped.text.action-selected` | `#1E3B58` |
| Control text, disabled | `mapped.text.disabled` | `#909397` |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Type size on the labels | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight` |
| Motion | not a token | One pill glides across the whole bar, including over the divider, with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves the row, when the pointer is on a disabled button, and while the font size field is being edited. The pill fill is `mapped.surface.action-hover`. The row is `PillRow` |

The component exposes no properties of its own. The buttons inside set the contextual button properties:

| Control | Slots |
| --- | --- |
| Font | left icon off, label off, right icon on (case-sensitive), dropdown on. Label text `Label` |
| Size | left icon off, right icon off, label on (`14`), dropdown on |
| Weight | left icon off, right icon off, label on (`Regular`), dropdown on |
| Alignment | left icon off, label off, right icon on (text-align-start), dropdown on. Label text `Label` |

The second group is underline, strikethrough, list, list-ordered, and link. That container came back as a picture, so each button’s on/off values were not in the node. The app draws list, list-ordered, and link as icon only: label off, left icon off, dropdown off, right icon on.

Painted on the bar: one resting frame. The buttons in that frame are `state=Default`.

Not painted on the bar: hover, selected, and disabled. Those states belong to the contextual button. The button has no focus state.

The typeface control opens the typeface menu. The size control opens the font size menu. The weight control opens the font style menu. The alignment control opens the popover below.

## Text align popover

Ticket NB-40, NB-79. Code `AlignPopover` in `src/toolbars/TextToolbar.tsx`. The pill row is `src/components/PillRow.tsx`.

The frame is 142 by 40. That is padding 4, four 32px buttons, and 2px gaps. Four contextual buttons, icon only: left, center, right, and justify. The current alignment is the selected button. The popover opens above a selected element and above an element while it is dragged. This frame has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.40`), from 4px padding and a 32px button |
| Width | none | 142px, from the padding, four buttons, and the gaps |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.2` | 2px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px, outside the 142 by 40 box |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off, so the frame shows no text. A label would use the contextual button text colors |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Divider | none | this popover has no divider |
| Motion | not a token | One pill glides across the four alignment buttons with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves this popover, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. This popover has its own `PillRow`. Moving here fades the text toolbar pill and shows this one |

The four buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on. The current alignment passes `pressed`, so that button keeps `mapped.surface.action-selected` while hovered.

The property list on this component was not in the saved frame read. It is not confirmed whether the popover exposes `state`, `type`, `selected`, or its own slots.

Painted: one resting frame of four icon buttons.

Not painted on this frame: hover and disabled. The button has no focus state. The app paints the current alignment with the button’s selected state.

## Menu item

Ticket NB-41, NB-75, NB-76, NB-77. Code `src/components/MenuItem.tsx`. The trial page is `?trial=menu-item`. NB-76 clips a label when `truncateLabel` is on. NB-77 nudges a default row on hover.

A single row for a dropdown. A left icon and the label sit on the left. The caption and the submenu chevron sit on the right. In a wide row the space falls between that pair and the caption group.

| Piece | Token | Value |
| --- | --- | --- |
| Height, md | `brand.scale.32` | 32px |
| Height, sm | `brand.scale.28` | 28px |
| Padding, left | `brand.scale.8` | 8px when indent is off. `brand.scale.32` when indent is on. Hover on a default row adds 3px. That 3px is not a spacing token |
| Padding, right | `brand.scale.8` | 8px |
| Gap between label and the caption group | `brand.scale.8` | 8px, and the row pushes the caption group to the far side |
| Gap between caption and chevron | `brand.scale.4` | 4px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the row has no stroke |
| Font | `alias.font-family.body` | Geist |
| Label size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. The row still writes 12px |
| Caption size | `responsive.desktop.caption.md.size`, `responsive.desktop.caption.md.line-height-tight` | 10px / 10px. The row still writes 10px. Paragraph spacing is `not a token` |
| Chevron | `brand.scale.12` | 12px, Lucide `chevron-right` |
| Left icon | `brand.scale.16` | 16px, Lucide `chevron-right`. It sits `brand.scale.8` from the label |
| Left icon, default | `mapped.icon.action-light` | `#909397`. A real hover uses `mapped.icon.action-hover` |
| Left icon, hover | `mapped.icon.action-hover` | `#1E3B58`, the same value as the label |
| Left icon, selected | `mapped.icon.action-selected` | `#1E3B58`, the same value as the label |
| Left icon, disabled | `mapped.icon.disabled` | `#909397`, the same value as the label |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9`. The hover fill covers the full button |
| Fill, selected | `mapped.surface.action-selected` | `#DBEAF8`. The selected fill covers the full button |
| Label, default | `mapped.text.action` | `#303132` |
| Label, hover | `mapped.text.action-hover` | `#1E3B58` |
| Label, selected | `mapped.text.action-selected` | `#1E3B58` |
| Label, disabled | `mapped.text.disabled` | `#909397` |
| Caption, default, hover, and selected | `mapped.text.caption` | `#606264` |
| Caption, disabled | `mapped.text.disabled` | `#909397` |
| Chevron, default | `mapped.text.caption` | `#606264`. A real hover uses `mapped.icon.action-hover` |
| Chevron, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Chevron, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Chevron, disabled | `mapped.icon.disabled` | `#909397` |
| Motion | not a token | Hover moves a default row, and the painted hover row, 3px to the right. The 3px is added to that row's own left padding, `brand.scale.8` or `brand.scale.32` when indent is on. Padding uses `motion-nudge`. The fill uses `motion-highlight`. Selected and disabled stay put. The 3px is not a spacing token |

The component set is two columns and four rows. The columns are the sizes. The rows are the states.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| size | variant | `sm`, `md` |
| state | variant | `default`, `hover`, `selected`, `disabled` |
| Label | text | default `Label`. It sits in the layer named `container` |
| caption | text | default `caption` |
| chevron | slot | `chevron-right`. Shown unless turned off |
| Show left icon | boolean | default on |
| Left icon | slot | Lucide component, default `chevron-right`. Shown unless turned off |
| indent | boolean | default off. Off keeps left padding at `brand.scale.8`. On sets left padding to `brand.scale.32`. Right padding stays `brand.scale.8` |
| truncateLabel | boolean | default off. On clips the label to the row. A clipped label shows the full text in the hover label |

The boolean names for hiding the caption and the chevron were not in the property panel.

The hover label is the one the main toolbar already uses. It is drawn only while `truncateLabel` is on and the label is clipped.

| Piece | Token | Value |
| --- | --- | --- |
| Full label | none | 8px above the row, centered. It wraps at the row, and the cap is 320px. `rounded-md`, `bg-slate-900`, `px-2 py-1`, `text-xs`, `font-medium`, white. These are the existing toolbar label, not design tokens |
| Shadow | not a token | `shadow-lg` |

Painted states: `default`, `hover`, `selected`, `disabled`, in both `sm` and `md`. The left icon is on in those rows. The size rows and the slot rows keep the default padding. One indented row is painted so the indent prop can be checked. One truncated row is painted in a 220px column, indented, with a title long enough to clip. The hover fill and the selected fill cover the full button, including the padding. The hover label is not a painted state. It shows on hover or focus when the label is clipped.

Not painted: focus.

## Font style menu

Ticket NB-42. Code `src/toolbars/TextToolbar.tsx`, opened from the weight control. The frame is 104 by 120.

Four small menu items, left icon, caption, and chevron off. The order is Regular, Bold, Italic, Bold Italic. The labels stay in Geist. They are not drawn in bold or italic.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 104px. 104px. The label is narrower, and the extra space sits to its right |
| Height | hug | 120px |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | `mapped.border.default` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same shadow the other menus already use |
| Blur | not a token | the same blur the text toolbar already uses |
| Row | menu item, `sm` | `brand.scale.28`, 28px. Left icon, caption, and chevron are off |

The first row is painted with the hover fill, `#E5F0F9`. The live menu marks the current weight with the selected fill.

The layer name above the frame was cut off. It starts with `toolbar/contextual`.

## Typeface menu

Ticket NB-43. Code `TypefaceMenu` in `src/toolbars/TextToolbar.tsx`, opened from the typeface control. The frame is 128 by 148.

Five small menu items, left icon, caption, and chevron off. The order is Geist Mono, Open Sans, Coming Soon, Noto Serif, Montserrat. Each label uses its `alias.typeface` token. The menu item body font stays Geist on every other menu.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 128px. 128px. The label is narrower, and the extra space sits to its right |
| Height | hug | 148px |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | `mapped.border.default` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same shadow the other menus already use |
| Blur | not a token | the same blur the text toolbar already uses |
| Row | menu item, `sm` | `brand.scale.28`, 28px. Left icon, caption, and chevron are off |
| Label, Geist Mono | `alias.typeface.geist-mono` | Geist Mono |
| Label, Open Sans | `alias.typeface.open-sans` | Open Sans |
| Label, Coming Soon | `alias.typeface.coming-soon` | Coming Soon |
| Label, Noto Serif | `alias.typeface.noto-serif` | Noto Serif |
| Label, Montserrat | `alias.typeface.montserrat` | Montserrat |
| Label size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. The row still writes 12px |
| Label, default | `mapped.text.action` | `#303132` |
| Label, hover | `mapped.text.action-hover` | `#1E3B58` |
| Label, selected | `mapped.text.action-selected` | `#1E3B58` |
| Label, disabled | `mapped.text.disabled` | `#909397` |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |

The first row, Geist Mono, is painted with the hover fill, `#E5F0F9`. The live menu marks the current family with the selected fill.

The rows use the menu item properties: size `sm`, left icon off, caption off, chevron off. The frame itself exposes no properties.

Painted: one resting frame. Geist Mono is the hover example. The other four rows are default.

Not painted on this frame: selected and disabled. Those states belong to the menu item. There is no focus state.

The layer name above the frame was cut off. It starts with `toolbar/contextual`.

## Font size menu

Ticket NB-44. Code `FontSizeField` in `src/toolbars/TextToolbar.tsx`, opened from the size control. The frame is 44 by 344 hug.

Twelve small menu items, left icon, caption, and chevron off. The order is 10, 12, 14, 16, 18, 24, 32, 36, 40, 48, 64, 72. Each row is a fixed `brand.scale.36` (36px) so the column does not change width with the digits. The labels stay in Geist.

| Piece | Token | Value |
| --- | --- | --- |
| Row width | `brand.scale.36` | 36px. The same width on every row |
| Width | `brand.scale.44` | 44px hug. That is 4px padding, the 36px row, and 4px padding. The 1px stroke sits on that box |
| Height | hug | 344px |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same shadow the other menus already use |
| Blur | not a token | the same blur the text toolbar already uses |
| Row | menu item, `sm` | `brand.scale.28`, 28px. Left icon, caption, and chevron are off |
| Font | `alias.font-family.body` | Geist |
| Label size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. The row still writes 12px. Paragraph spacing is `not a token` |
| Label, default | `mapped.text.action` | `#303132` |
| Label, hover | `mapped.text.action-hover` | `#1E3B58` |
| Label, selected | `mapped.text.action-selected` | `#1E3B58` |
| Label, disabled | `mapped.text.disabled` | `#909397` |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |

There is no icon on this frame. Left icon, caption, and chevron are off, so the menu item draws no left icon, no caption color, and no chevron.

The frame has no divider.

The rows use the menu item properties: size `sm`, left icon off, caption off, chevron off, and a fixed width of `brand.scale.36`. The frame itself exposes no properties. A note on the sheet says each font size menu item is a fixed width of 36px.

Painted: one resting frame. 14 is filled, and the toolbar above shows 14, so that row is the current size. The live menu marks the current size with the selected fill.

Not painted on this frame: hover and disabled. Those states belong to the menu item. There is no focus state.

## Icon button

Ticket NB-46. Code `src/components/IconButton.tsx`. The trial page is `?trial=icon-button`.

A square button whose only content is an icon. It is not a contextual button with the label turned off. Large is 32px, medium is 28px, and small is 20px. The default type has four states. The destructive type has three.

| Piece | Token | Value |
| --- | --- | --- |
| Size, lg | `brand.scale.32` | 32px square |
| Size, md | `brand.scale.28` | 28px square |
| Size, sm | `brand.scale.20` | 20px square |
| Padding, lg | `brand.scale.8` | 8px, the space left by a 16px icon in the 32px square |
| Padding, md | `brand.scale.8` | 8px, the space left by a 12px icon in the 28px square |
| Padding, sm | `brand.scale.4` | 4px, the space left by a 12px icon in the 20px square |
| Corner radius, lg and md | `alias.border-radius.lg` | 8px |
| Corner radius, sm | `alias.border-radius.md` | 4px |
| Stroke | none | the button has no stroke |
| Icon, lg | `brand.scale.16` | 16px, Lucide |
| Icon, md and sm | `brand.scale.12` | 12px, Lucide |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, default hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, default selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Fill, destructive default and disabled | `mapped.surface.error` | `#F1DEE0` at 0% |
| Fill, destructive hover | `mapped.surface.error-hover` | `#F1DEE0` |
| Icon, default | `mapped.icon.action` | `#303132` |
| Icon, default hover | `mapped.icon.action-hover` | `#1E3B58` |
| Icon, default selected | `mapped.icon.action-selected` | `#1E3B58` |
| Icon, disabled | `mapped.icon.disabled` | `#909397` |
| Icon, destructive default and hover | `mapped.icon.error`, `mapped.icon.error-hover` | `#BE123C` |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| size | variant | `lg`, `md`, `sm` |
| type | variant | `default`, `destructive` |
| state | variant | `default`, `hover`, `selected`, `disabled` |
| Icon | slot | case-sensitive glyph. It is the only content |

Painted states: `default`, `hover`, `selected`, and `disabled` on the default type, in `lg`, `md`, and `sm`. `default`, `hover`, and `disabled` on the destructive type, in all three sizes.

Not painted: focus. Selected is not painted on the destructive type.

This button is not a toolbar. A toolbar that places it is its own component.

## Hex input

Ticket NB-47. Code `src/components/HexInput.tsx`. The trial page is `?trial=hex-input`.

A hex field for the color toolbar that comes later. It is not that toolbar. Two labels sit in the box. `#` is constant. The hex code is the value the user types or pastes.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 108px fixed. No spacing token is 108px |
| Height | `brand.scale.28` | 28px hug |
| Padding | `brand.scale.8` | 8px |
| Gap | `brand.scale.4` | 4px between `#` and the hex code |
| Corner radius | `alias.border-radius.lg` | 8px |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. Paragraph spacing is `not a token` |
| Text, every state | `mapped.text.default` | `#303132` |
| Fill, default | none | the field has no fill |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, focus | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Stroke, default and hover | none | those variants have no stroke |
| Stroke, focus | `mapped.border.action-ring-focus`, `alias.border-width.sm` | `#4A94DB`, 2px, drawn outside the box |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no icon and no divider.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| state | variant | `default`, `hover`, `focus` |

`#` and the hex code are text layers, not variant properties. `#` does not change. The hex layer is the editable value. The spec shows `EBCFFF`.

Painted states: `default`, `hover`, and `focus`.

A click on the field focuses it and selects the hex code. A click outside the field, including an icon button, blurs it and the field returns to default.

Not painted: disabled, selected, and pressed.

This field is not a toolbar. The color toolbar that places it is its own component.

## Title input

Ticket NB-66, sizes NB-81. Code `src/components/TitleInput.tsx`. The trial page is `?trial=title-input`.

A project title field. It is not the file bar. The width follows the title and stops at 320px. A longer title truncates. Hovering or focusing that field shows the full title in the same hover label the main toolbar uses. It sits 8px above the field.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | hugs the title plus the padding, and stops at 320px. No spacing token is 320px |
| Height | `brand.scale.40`, `brand.scale.32`, `brand.scale.28` | 40px on `lg`, 32px on `md`, 28px on `sm` |
| Padding | `brand.scale.12` | 12px on the left and right on every size. The title is centered in the height |
| Corner radius | `alias.border-radius.xl`, `alias.border-radius.lg` | 12px on `lg`. 8px on `md` and `sm` |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 14px / 14px, text style `body/md/tight`. Paragraph spacing is `not a token` |
| Text, every state | `mapped.text.default` | `#303132` |
| Fill, default | none | the field has no fill |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, focus | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Stroke, default and hover | none | those variants have no stroke |
| Stroke, focus | `mapped.border.action-ring-focus`, `alias.border-width.sm` | `#4A94DB`, 2px, drawn outside the box |
| Full title | the main toolbar hover label | shown only when the title is truncated. 8px above the field, centered. A long title wraps at 320px so the label stays over the field. `rounded-md`, `bg-slate-900`, `px-2 py-1`, `text-xs`, `font-medium`, white. These are the existing toolbar label, not design tokens |
| Shadow | not a token | the hover label uses the existing `shadow-lg`. The field itself has none |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no icon and no divider. The full-title label is the same element the main toolbar paints above a tool.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| state | variant | `default`, `hover`, `focus` |
| size | variant | `lg` (default), `md`, `sm` |

Sizes:

| Size | Height | Corner radius | Padding | Type |
| --- | --- | --- | --- | --- |
| `lg` | `brand.scale.40` (40px) | `alias.border-radius.xl` (12px) | `brand.scale.12` | `body/md/tight` |
| `md` | `brand.scale.32` (32px) | `alias.border-radius.lg` (8px) | `brand.scale.12` | `body/md/tight` |
| `sm` | `brand.scale.28` (28px) | `alias.border-radius.lg` (8px) | `brand.scale.12` | `body/md/tight` |

The Figma label beside the `sm` row reads 32px. The drawn row is 28px, and 28px is the size. Fill, stroke, text color, the focus ring, the 320px cap, and the full-title label are the same on every size.

The title is a text layer, not a variant property. The spec shows `Title`.

Painted states: `default`, `hover`, and `focus`, on each size. The project toolbar uses `lg`.

A click on the field focuses it. The title can be edited while the field is focused.

Not painted: disabled, selected, and pressed.

This field is not a toolbar or a popover. The file bar that places it is a later ticket.

## Color swatch

Ticket NB-48. Code `src/components/ColorSwatch.tsx`. The trial page is `?trial=color-swatch`.

A round color choice for the fill and stroke toolbar, and for the color picker that comes later. It is not that toolbar. The disc is 24px. The action ring sits outside it.

| Piece | Token | Value |
| --- | --- | --- |
| Size | `brand.scale.24` | 24px circle |
| Corner radius | not a token | a full circle. No radius token is fully round |
| Disc stroke | `mapped.border.control`, `alias.border-width.xsm` | `#C0C4C9`, 1px, drawn inside the disc on none and color, default only. Hover and selected have no disc stroke. Custom has no disc stroke |
| None fill | `brand.foundation.white` | `#FFFFFF`. No mapped surface is white |
| Slash color | `mapped.icon.disabled` | `#909397` |
| Slash thickness | `alias.border-width.sm` | 2px |
| Slash length | `brand.scale.20` | 20px, rotated 45 degrees so the ends stay off the disc stroke |
| Color fill | `alias.swatch` | Fill and sticky notes use step 200. Stroke and noodles use step 500. The specimen is `alias.swatch.purple.500`, `#BF66FF` |
| Custom wheel | not a token | Angular gradient. Stops, each at 100% opacity: 0% `#F43F5E`, 14% `#F59E0B`, 29% `#EAB308`, 43% `#22C55E`, 57% `#06B6D4`, 71% `#6366F1`, 86% `#D946EF`, 100% `#F43F5E`. None of these colors are tokens. 0% sits at the left, matching the stop handles on the frame |
| Custom preview | the picker color, `brand.scale.12` | 12px circle. The specimen shows purple. That color is not an `alias.swatch`, and it does not follow the color type |
| Custom preview stroke | `brand.foundation.white`, `alias.border-width.xsm` | `#FFFFFF`, 1px, drawn inside the 12px circle |
| Custom wheel thickness | `brand.scale.6` | 6px, the space from the 24px disc edge to the 12px preview |
| Ring, default | none | the disc has no action ring |
| Ring, hover | `mapped.border.action-ring`, `alias.border-width.md` | `#B7D4F1`, 4px, drawn outside the disc. The frame measures 3px |
| Ring, selected | `mapped.border.action-ring-focus`, `alias.border-width.md` | `#4A94DB`, 4px, drawn outside the disc. The swatch uses `action-ring-focus` |
| Shadow | not a token | The code uses an outline stroke. The frame shadow is excluded |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no text and no divider. The slash is part of the none type, not a separate icon slot.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| type | variant | `none`, `color`, `custom` |
| state | variant | `default`, `hover`, `selected` |

The fill is not a variant. The spec paints purple on the color type and on the custom preview. Those two paints are specimens. In the product they stay separate.

Color type reads `alias.swatch`, in token-file order: purple, sky, lime, orange, yellow, coral, tomato, pink. Fill and sticky notes use step 200. Stroke and noodles use step 500.

Custom can be selected. Its inner circle is the color it is given. On the color picker toolbar, that circle is the picker color while custom is selected, and the default `EBCFFF` while it is not. Choosing a color swatch does not change the custom color. Choosing custom does not change a palette color.

Painted states: `default`, `hover`, and `selected`, on `none`, `color`, and `custom`.

Not painted: focus, disabled, and pressed. Keyboard focus uses the hover ring at 4px so the swatch stays visible.

This swatch is not a toolbar. The color picker toolbar that places it is its own component.

## Color picker toolbar

Ticket NB-49. Code `src/toolbars/ColorPickerToolbar.tsx`. The trial page is `?trial=color-picker`.

The toolbar that sits below a selected sticky note, and the menu the noodle color control opens. Shape fill and stroke still use the Phase 1 bars. Two frames are painted. Collapsed is the swatch grid, the hex field, and the copy and pipette buttons. Extended adds the picker. The picker is its own panel beside the toolbar. It opens from the custom swatch and does not move the toolbar. It sits on the right when that side fits, and on the left when the toolbar is against the right edge.

The leading disc is chosen by the caller. This trial keeps none. A sticky passes neutral at step 200, so that disc is `alias.swatch.neutral.200` and none is not offered there. A noodle passes neutral at step 500, so that disc is `alias.swatch.neutral.500` and none is not offered there. Choosing the leading disc closes the picker, the same as a palette swatch.

On a sticky, the open picker is not stored. The toolbar mounts only while the note is selected. A palette swatch, the leading disc, or none closes the picker. Clicking the canvas deselects the note. Clicking the note again mounts the toolbar collapsed, including when the note’s color is still the custom swatch.

Opening the custom swatch from a selected palette copies that palette color into the picker. The note keeps that fill. The picker, the hex field, and the custom disc show it. The stored custom color is not applied on that click. While a palette swatch or none is selected, the custom disc stays on the default color `EBCFFF`. It shows the picker color only while custom is selected.

The saturation and hue handles can be dragged. A pointer press on the picker is not canceled, so the mouse moves that follow it still reach the handle.

| Piece | Token | Value |
| --- | --- | --- |
| Padding | `brand.scale.8` | 8px on the toolbar and on the picker panel. |
| Corner radius | `alias.border-radius.xxl` | 16px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same shadow the text toolbar already uses |
| Blur | not a token | the same 24px frost the text toolbar already uses |
| Section gap | `brand.scale.16` | 16px between the swatch grid and the hex row |
| Picker gap | `brand.scale.4` | 4px from the toolbar’s outer edge to the picker panel. The picker is top aligned. Right when that side fits. Left when the toolbar is against the right edge |
| Content width | none | The column is the swatch grid, 152px: five 24px discs and four 8px gaps. The hex row matches that width. No spacing token is 152px |
| Swatch gap | `brand.scale.8` | 8px |
| Swatch columns | five | The leading disc is chosen by the caller. This trial keeps none. Sticky passes neutral at step 200. Noodle passes neutral at step 500. Then `alias.swatch` in token-file order, then custom |
| Swatch | color swatch | 24px disc. The specimen uses step 200. Tomato on the frame is step 500 |
| Picker | react-colorful `HexColorPicker` | saturation and hue, in its own panel beside the toolbar. No alpha bar |
| Saturation height | none | 108px, including the black band. No spacing token is 108px |
| Saturation radius | `alias.border-radius.lg` on the top corners, `alias.border-radius.none` on the bottom | 8px on top. The bottom stays square where the black band meets the hue |
| Black band | `brand.foundation.black`, `brand.scale.12` | `#000000`, 12px, the bottom border of the saturation field |
| Hue height | `brand.scale.16` | 16px |
| Hue radius | `alias.border-radius.none` on the top corners, `alias.border-radius.lg` on the bottom | 0px on top, 8px on the bottom. The picker container’s radius is these two pieces: saturation on top, hue on the bottom |
| Picker stack gap | `brand.scale.0` | 0px. The hue sits against the black band |
| Pointer | `brand.scale.20` | 20px |
| Pointer stroke | `brand.foundation.white`, `alias.border-width.xsm` | `#FFFFFF`, 1px |
| Pointer shadow | not a token | the small shadow react-colorful paints on the handle |
| Hex field | hex input | The row matches the 152px grid, so this field shrinks below its 108px frame. The hex input component itself stays 108px. A click focuses it and selects the code. A click outside, or on copy or pipette, returns it to default. The value is the selected swatch, or the custom color when none or custom is selected |
| Icon buttons | icon button, `md` | 28px. Copy, then pipette |
| Icon gap | `brand.scale.4` | 4px |
| Icon, copy | Lucide `Copy` | 12px, the medium icon button glyph |
| Icon, pipette | Lucide `Pipette` | 12px, the medium icon button glyph |
| Dot grid | not a token | excluded from the component |

There is no divider.

The picker container is one rounded rectangle. The saturation carries the top corners. The hue is square against the black band and carries the bottom corners.

The disc is 24px, `brand.scale.24`. The panel padding is 8px, `brand.scale.8`. The panel corner is 16px, `alias.border-radius.xxl`. The swatch centers are 32px apart: the 24px disc plus an 8px gap. The picker panel uses that same padding, corner, stroke, fill, shadow, and blur, and sits 4px, `brand.scale.4`, off the toolbar. It stays out of the toolbar’s box, so the centered bar does not shift when it opens. The right side is used when the picker fits there. The left side is used when the toolbar is against the right edge.

The frame does not expose a variant set that could be read. The two states are two instances.

| Property | Kind | Values |
| --- | --- | --- |
| state | two instances | collapsed, extended |

Collapsed paints none selected and hides the picker. The hex on that frame is `EBCFFF`. Extended paints the picker beside the toolbar. It also paints a ring on none and a ring on custom. The toolbar keeps one selection. Custom is selected while the picker is open. Opening the picker does not move the toolbar.

Not painted on this frame: hover and focus of the toolbar itself. Those belong to the swatch, the hex input, and the icon button.

The toolbar adds no z-index. Selection chrome already uses FloatingPanel. This toolbar is the child that will go in that panel. The trial also places one copy in FloatingPanel over a selected box and a dragging box, both on the selection layer. The picker is inside that same panel, so it stays on the toolbar layer.

## Transparent sticky

Ticket NB-51. Code `src/canvas/StickyNode.tsx`, with the sticky toolbar in `StickyColorToolbar` passing `leading="neutral"` and `scale={200}` to `src/toolbars/ColorPickerToolbar.tsx`. A new note is placed from `beginSticky` in `src/App.tsx`.

The first disc on a sticky is `alias.swatch.neutral.200`. Choosing it stores `{ "kind": "swatch", "family": "neutral" }`. The note paints that color-mix and the same 24px frost the toolbars already use. A saved `{ "kind": "none" }` stays clear, with no frost, and no disc is selected. Another swatch or a custom color stays as stored. A new note stores `{ "kind": "swatch", "family": "purple" }`, so the purple disc is selected. `data.color` stays `yellow`, `pink`, `blue`, or `green` so older files still open. The new note’s legacy name is `yellow`. The paint is what shows.

The hex field is six digits, so neutral shows `FDFBF7`, the source of the mix (`alias.warm-neutral.100`). The disc and the note paint the 60% mix. Opening the custom swatch from neutral copies `FDFBF7` into the picker, and the note becomes that opaque color. The frost stays only while neutral is the selection.

| Piece | Token | Value |
| --- | --- | --- |
| Fill | `alias.swatch.neutral.200` | `alias.warm-neutral.100` (`#FDFBF7`) at 60%. The generated `color-mix`. `alias.swatch.neutral` does not use `brand.neutral` |
| Blur | not a token | 24px, the same frost the toolbars already use |
| New note | `alias.swatch.purple.200` | `#EBCFFF`. The purple disc is selected |
| Shadow | not a token | the existing sticky shadow |
| Leading disc | color swatch | 24px. Step 200. None is not offered on this toolbar |

There is no divider.

Painted: the neutral disc in default, hover, and selected, and the frosted note when that disc is chosen. A new note paints purple.

Not painted: a none disc on the sticky toolbar. A saved none keeps a clear note and selects no disc.

The toolbar and the picker are the color picker toolbar inside selection chrome. They use FloatingPanel and add no z-index of their own. They stay above a selected note and a note that is mid-drag.

## Noodle toolbar

Ticket NB-50, NB-79. Code `src/toolbars/NoodleToolbar.tsx`. The pill row is `src/components/PillRow.tsx`. It sits in the selection chrome, on the side of the stroke nearest the midpoint, with the 16px screen gap from NB-33. The bar slides to the pane edge only when the near spot would leave the board or cover the bottom toolbar.

Every control is a contextual button with the unused slots turned off.

- First group: text, color, line weight, noodle type. A divider sits on the right of the group.
- Second group: start arrow and end arrow.

The bar is 40px high and hugs its width. The specimen measures 277px wide. That width is the buttons, the gaps, and the padding. It is not a fixed size.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | hug. 4px padding and a 32px button make 40px, which is `brand.scale.40`. The panel reads H 40 |
| Padding | `brand.scale.4` | 4px |
| Gap inside a group | `brand.scale.2` | 2px. The first group and the arrow group both read gap 2 |
| Gap between groups | `brand.scale.4` | 4px. The bar reads gap 4 |
| Corner radius | `alias.border-radius.xl` | 12px. The panel reads 12 |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px. The fill style name was not opened. The pill matches the text toolbar beside it, so the bar uses that stroke |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`). The fill style name was not opened. The pill matches the text toolbar beside it |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | `mapped.border.default`, `alias.border-width.xsm` | 1px `#D8DCE2` on the right of the first group, with 4px (`brand.scale.4`) of padding before it |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off, so the bar shows no text. A label would use the contextual button text colors |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Color disc | `brand.scale.16` | 16px, the contextual button icon slot. It paints the noodle color. It is not the 24px color swatch |
| Color disc stroke | `mapped.border.control`, `alias.border-width.xsm` | `#C0C4C9`, 1px |
| Motion | not a token | One pill glides across the whole bar, including over the divider, with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves the row, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. The row is `PillRow` |

The component exposes no properties of its own. The buttons inside set the contextual button properties. These were read from the property panel:

| Control | Slots | Instance |
| --- | --- | --- |
| Text | left icon off, label off, dropdown off, right icon on | `type` |
| Color | left icon off, label off, right icon on, dropdown on | name starts with `color` |
| Line weight | left icon off, label off, right icon on, dropdown on | name starts with `line-w` |
| Noodle type | left icon off, label off, right icon on, dropdown on | `straight` on the specimen |
| Start arrow | left icon off, label off, right icon on, dropdown on | the panel was not opened on this one |
| End arrow | left icon off, label off, right icon on, dropdown on | `open` on the specimen |

Text uses the current T glyph. The asset folder has no type icon. Line weight uses `line-weight-menu`. Noodle type uses `type-straight`, `type-elbow`, or `type-curve` for the current shape. The arrows use the current arrow glyph. `noodle-main` is not a control on this bar.

Painted on the bar: one resting frame. The buttons in that frame are `state=Default`.

Not painted on the bar: hover, selected, and disabled. Those states belong to the contextual button. The button has no focus state.

The line-weight control opens the line weight and line type menu. The icon-fit trial can pass `lineWeightIcon`. The board omits it. The default glyph crops the line-weight file and sets the stroke to 1.33. The noodle-type control opens the noodle type menu. Each arrow opens the arrow menu. The color control opens the color picker toolbar. That open color menu is not painted on the frame. Each menu sits `brand.scale.4` (4px) under the painted pill. The portal host is a zero-size box at the top of the layer, so the gap is measured from the pill. A menu moves above the pill only when it would leave the board.

## Line weight and line type menu

Ticket NB-50, NB-60, NB-79. The row is `src/components/StrokeProperty.tsx`. The pill row is `src/components/PillRow.tsx`. `src/toolbars/NoodleToolbar.tsx` opens it and writes the noodle.

Three weight icons, a divider, then solid and dashed. The icons are `type-thin`, `type-medium`, `type-thick`, `type-straight`, and `type-dashed`. The current weight and the current line style are the selected buttons. Choosing one leaves the menu open, so the other group can be set too.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.40`), from 4px padding and a 32px button |
| Padding | `brand.scale.4` | 4px |
| Gap inside a group | `brand.scale.2` | 2px |
| Gap between groups | `brand.scale.4` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | `mapped.border.default`, `alias.border-width.xsm` | 1px `#D8DCE2` on the right of the weights, with 4px (`brand.scale.4`) of padding before it |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Motion | not a token | One pill glides across the weights, the divider, and the line types with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves this menu, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. This menu has its own `PillRow` |

The five buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on.

The property list on this menu was not opened. It is not confirmed whether the menu exposes `state`, `type`, or `selected`.

Painted: one resting row. The thick icon reads darker because its stroke is 3.5px. Whether that button is the selected state was not in the property panel. The app paints the current weight and the current line style with the button’s selected state.

Not painted, as far as the frame shows: hover and disabled. The button has no focus state.

## Noodle type menu

Ticket NB-50, NB-79. Code is the shape menu in `src/toolbars/NoodleToolbar.tsx`. The pill row is `src/components/PillRow.tsx`.

Three icon buttons: straight, elbow, and curve. The icons are `type-straight`, `type-elbow`, and `type-curve`. The current shape is the selected button. Choosing one closes the menu. This frame has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.40`), from 4px padding and a 32px button |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.2` | 2px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Divider | none | this menu has no divider |
| Motion | not a token | One pill glides across the three shape buttons with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves this menu, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. This menu has its own `PillRow` |

The three buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on.

The property list on this menu was not opened.

Painted: one resting row of three icon buttons.

Not painted, as far as the frame shows: hover and disabled. The button has no focus state. The app paints the current shape with the button’s selected state.

## Arrow menu

Ticket NB-50, NB-79. Code is `ArrowMenu` in `src/toolbars/NoodleToolbar.tsx`. The pill row is `src/components/PillRow.tsx`.

Six icon buttons, one for each arrowhead the noodle already has: none, arrow, open, triangle, circle, and diamond. The glyphs are the current arrow icons. The current end is the selected button. Choosing one closes the menu. Start and end open the same menu with their own selection. This frame has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.40`), from 4px padding and a 32px button |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.2` | 2px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Divider | none | this menu has no divider |
| Motion | not a token | One pill glides across the six arrowhead buttons with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves this menu, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. This menu has its own `PillRow` |

The six buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on.

The property list on this menu was not opened.

Painted: one resting row of six arrow glyphs.

Not painted, as far as the frame shows: hover and disabled. The button has no focus state. The app paints the current arrowhead with the button’s selected state.

The toolbar and these menus add no z-index. The bar is already in FloatingPanel on the toolbar layer. The menus use FloatingPanel on the dropdown layer.

## Noodle stroke color

Ticket NB-52. Code is `NoodleColorMenu` in `src/toolbars/NoodleToolbar.tsx`. It opens `src/toolbars/ColorPickerToolbar.tsx` with `scale={500}` and `leading="neutral"`. A new noodle comes from `defaultNoodleData` in `src/lib/noodleData.ts`. The connect preview in `src/canvas/connectionLine.tsx` and `src/canvas/ConnectMode.tsx` uses that same color.

The color control on the noodle bar stays a contextual button. Its 16px disc paints the stroke. Opening it shows the color picker toolbar, `brand.scale.4` (4px) under the painted pill. The first disc is `alias.swatch.neutral.500`, which is `alias.cool-neutral.900` (`#303132`). None is not offered. The other discs are `alias.swatch` at step 500, then custom. A new noodle stores `#303132`, and the neutral disc is selected. The connect preview uses that hex.

A saved stroke that matches a step-500 swatch selects that disc. Any other saved hex selects custom and keeps that stroke. Opening custom from a swatch copies that swatch into the picker, so the stroke stays put until a drag, a hex edit, or the pipette. The custom disc stays on `EBCFFF` until custom is the selection. The picker is its own panel, `brand.scale.4` (4px) from this toolbar’s outer edge, top aligned. It sits on the right when that side fits, and on the left when the toolbar is against the right edge. It stays out of the toolbar’s box, so opening it does not move the noodle bar or this toolbar.

The menu mounts only while Color is open. A palette swatch or the neutral disc closes the picker and leaves the menu open. Closing Color, or clicking the canvas, unmounts the menu. The next open starts collapsed.

| Piece | Token | Value |
| --- | --- | --- |
| Default stroke | `alias.swatch.neutral.500` | `alias.cool-neutral.900`, `#303132`. `alias.swatch.neutral` does not use `brand.neutral` |
| Leading disc | color swatch | 24px, `brand.scale.24`. Step 500. Neutral. None is not offered |
| Palette | `alias.swatch` step 500 | purple `#BF66FF`, sky `#66C7FF`, lime `#A5F075`, orange `#FFC066`, yellow `#F0DE75`, coral `#FF8F66`, tomato `#FF7066`, pink `#FF99BB` |
| Custom disc | color swatch, custom | `EBCFFF` until custom is selected, then the picker color |
| Padding | `brand.scale.8` | 8px on the toolbar and on the picker panel |
| Corner radius | `alias.border-radius.xxl` | 16px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same shadow the text toolbar already uses |
| Blur | not a token | the same 24px frost the text toolbar already uses |
| Section gap | `brand.scale.16` | 16px between the swatch grid and the hex row |
| Swatch gap | `brand.scale.8` | 8px |
| Picker gap | `brand.scale.4` | 4px from this toolbar’s outer edge. Top aligned. Right when that side fits. Left when the toolbar is against the right edge |
| Hex field | hex input | the selected swatch, or the custom color when custom is selected |
| Text, every state | `mapped.text.default` | `#303132`. Paragraph spacing is `not a token` |
| Icon buttons | icon button, `md` | 28px, `brand.scale.28`. Copy, then pipette. Default type |
| Icon, default | `mapped.icon.action` | `#303132` |
| Icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Icon, disabled | `mapped.icon.disabled` | `#909397` |
| Icon, copy | Lucide `Copy` | 12px, `brand.scale.12` |
| Icon, pipette | Lucide `Pipette` | 12px, `brand.scale.12` |
| Divider | none | this toolbar has no divider |

The color picker toolbar’s caller props on this menu:

| Property | Kind | Values |
| --- | --- | --- |
| scale | caller | 500 |
| leading | caller | neutral |

Painted: collapsed and extended. The leading disc is neutral at step 500, in default, hover, and selected. Custom, the hex field, copy, and pipette follow the color picker toolbar.

Not painted: a none disc on this menu. A saved hex that matches no step-500 swatch selects custom and keeps that stroke.

The toolbar and the picker sit in the color menu’s FloatingPanel on the dropdown layer. They add no z-index of their own. They stay above a selected noodle and a noodle that is mid-drag. The 16px disc on the bar is the contextual button icon slot, documented on the noodle toolbar.

## Thumb

Ticket NB-53. Code `src/components/SliderThumb.tsx`. The trial page is `?trial=slider-thumb`.

A disc for the fill opacity slider. It is not that slider. The ring sits outside the disc. `sm` is 12px and is the default. `md` is 16px, the disc on the sheet.

| Piece | Token | Value |
| --- | --- | --- |
| Size, sm | `brand.scale.12` | 12px circle. This is the default |
| Size, md | `brand.scale.16` | 16px circle. The specimen is this disc |
| Corner radius | not a token | a full circle. The panel reads 9999. No radius token is fully round |
| Fill, every state | `mapped.surface.action-solid` | `#FCFDFE` |
| Stroke, default | `mapped.border.control`, `alias.border-width.xsm` | `#C0C4C9`, 1px, drawn inside the disc |
| Stroke, disabled | `mapped.border.disabled`, `alias.border-width.xsm` | `#D8DCE2`, 1px, drawn inside the disc |
| Stroke, hover and pressed | none | the stroke is hidden |
| Ring, default and disabled | none | the disc has no ring. A drop shadow sits on the layer and is hidden |
| Ring, hover | `mapped.border.action-ring`, `alias.border-width.sm` | `#B7D4F1`, 2px, drawn outside the disc |
| Ring, pressed | `mapped.border.action-ring-pressed`, `alias.border-width.sm` | `#6EA9E2`, 2px, drawn outside the disc. The sheet writes focus over this disc |
| Shadow | not a token | The code uses an outline. The hidden shadow on default and disabled is not painted |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no text and no divider.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| state | variant | `default`, `hover`, `pressed`, `disabled` |
| size | code | `sm`, `md`. The default is `sm`. The sheet paints the 16px disc only |

Painted states: `default`, `hover`, `pressed`, and `disabled`, on the 16px disc. The trial also paints the 12px disc.

Not painted: focus. The sheet writes focus over the pressed disc. Keyboard focus on the fill opacity slider uses the hover ring so the thumb stays visible.

This thumb is not a slider. The fill opacity slider that places it is its own component.

## Track

Ticket NB-54. Code `src/components/SliderTrack.tsx`. The trial page is `?trial=slider-track`.

A 120px pill. A checker sits under a fade from clear to the swatch color. It is not the slider. `sm` is 8px. `md` is 12px and is the default.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 120px. No spacing token is 120px |
| Height, sm | `brand.scale.8` | 8px |
| Height, md | `brand.scale.12` | 12px. This is the default |
| Corner radius | not a token | a full pill. The panel reads 200. No radius token is fully round |
| Checker | not a token | the image fill. Squares are `brand.foundation.white` (`#FFFFFF`) and `mapped.border.disabled` (`#D8DCE2`), 8px |
| Gradient | the swatch color | white at 0% opacity to the swatch at 100%. The specimen is `#6579F8`. That color is not a token |
| Stroke | `mapped.border.control`, `alias.border-width.xsm` | `#C0C4C9`, 1px, drawn inside the pill |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no text and no divider. The color is the swatch the caller passes.

| Property | Kind | Values |
| --- | --- | --- |
| size | code | `sm`, `md`. The default is `md` |

Painted: `md` and `sm`. The sheet draws the pill under the heading. The trial draws `md` twice, once in the specimen color and once in purple, then `sm`.

Not painted: hover, focus, pressed, and disabled. Those belong to the thumb.

This track is not a slider. The fill opacity slider that places it is its own component.

## Fill opacity slider

Ticket NB-55. Code `src/components/FillOpacitySlider.tsx`. The trial page is `?trial=fill-opacity`.

The row in the shape toolbar, after the fill control, uses the `sm` track. The specimen is 154 by 16 and reads 50% on the `md` track. Dragging the thumb sets the percent. A double click on the percent edits the number. Enter commits. Escape restores the previous number.

The track shows the swatch color it is given. The trial uses the specimen `#6579F8` and paints a square at that opacity. On a shape, the track uses that shape’s fill. A shape with no fill uses `#C0C4C9`. A shape saved before the slider, and a new shape, stays at 100%. The specimen’s 50% is the frame, not the stored default.

| Piece | Token | Value |
| --- | --- | --- |
| Height | the thumb | `sm` is 12px, `brand.scale.12`, and it is the default. `md` is 16px, `brand.scale.16`. The track is centered on the thumb |
| Width | none | the track is 120px. The percent slot is the width of `100%` with tabular figures, and the number is left-aligned. No spacing token is 120px. The specimen hugs `50%` at about 26px |
| Gap | `brand.scale.16` | 16px between the track and the percent. At 100% the 12px thumb hangs 6px past the track. The 16px thumb hangs 8px. The specimen gap is 8px, with the thumb at 50% |
| Track, sm | track | 120 by 8. This is the slider default, with the 12px thumb |
| Track, md | track | 120 by 12. The fade ends at the swatch color. Paired with the 16px thumb |
| Thumb | thumb | 16px, centered on the value, painted above the track. Default at rest. Hover while the pointer is over the row. Pressed while dragging. Disabled when the slider is disabled |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. Paragraph spacing is `not a token` |
| Text | `mapped.text.default` | `#303132` |
| Text, disabled | `mapped.text.disabled` | `#909397` |
| Stroke | none | the row has no stroke |
| Fill | none | the row has no fill |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no divider.

The component exposes no variant set that could be read. The children are the track frame and the `50%` text.

| Property | Kind | Values |
| --- | --- | --- |
| value | the percent | 0 to 100. The specimen is 50 |
| color | the swatch | the opaque end of the track. The specimen is `#6579F8` |
| size | code | `sm`, `md`. The default is `sm`: an 8px track and a 12px thumb. `md` is a 12px track and a 16px thumb |

Painted: one resting row at 50% in `md`, with the 16px thumb in default. The trial paints the default `sm` pair and the `md` pair.

Not painted: hover, pressed, disabled, and editing. Hover and pressed belong to the thumb. Disabled uses the disabled thumb and `mapped.text.disabled`. Editing is the font size gesture: a double click, then a number.

This slider is not a toolbar. The shape toolbar places it and uses FloatingPanel and the z-index tokens in `src/lib/layers.ts`. The trial does not put a copy on the board.

## Shape toolbar

Ticket NB-56, NB-79. The purple fill, the purple stroke, and the two grids are ticket NB-59. Code `src/toolbars/ShapeToolbar.tsx`. The pill row is `src/components/PillRow.tsx`. It sits in the selection chrome, under a selected shape, and under a group of shapes.

Every control is a contextual button with the unused slots turned off, except the fill opacity slider, which is the slider component.

- First group: shape swap. A divider sits on the right of the group.
- Second group: stroke, then line weight and line type. A divider sits on the right of the group.
- Third group: fill, then the fill opacity slider. The gap before the slider is 8px.

Shape swap opens the shape swatch, the five kinds in the existing order. The closed button paints the current kind with `ShapeKindIcon`, and a diamond when the selection is mixed. The glyphs are `src/assets/icons/shape-square.svg`, `shape-circle.svg`, `shape-round-rectangle.svg`, `shape-triangle.svg`, and `shape-diamond.svg`. Each glyph uses a cropped view box so it fills the 16px slot the way a Lucide icon does. Wider files stay wider. The line-weight glyph uses the same crop, and its stroke is 1.33 so it paints like the shape stroke. The stroke follows the button icon color. Fill opens the color picker toolbar at step 200, with none. Stroke opens the same picker at step 500, with none. A new shape’s fill is `alias.swatch.purple.200` (`#EBCFFF`) and its stroke is `alias.swatch.purple.500` (`#BF66FF`). Line weight opens thin, medium, and thick, then solid and dashed. The weight menu stays open so both groups can be set. Choosing a kind closes that menu.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | hug. 4px padding and a 32px button make 40px, which is `brand.scale.40`. The panel reads H 40 |
| Padding | `brand.scale.4` | 4px |
| Gap inside a group | `brand.scale.2` | 2px. Shape swap is alone. Stroke and line weight share a group |
| Gap before the slider | `brand.scale.8` | 8px. The fill button and the slider are one group |
| Gap between groups | `brand.scale.4` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | `mapped.border.default`, `alias.border-width.xsm` | 1px `#D8DCE2` on the right of the first group and the second group, with 4px (`brand.scale.4`) of padding before it |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text, default | `mapped.text.action` | `#303132`. Stroke and Fill are the only labels |
| Control text, hover | `mapped.text.action-hover` | `#1E3B58` |
| Control text, selected | `mapped.text.action-selected` | `#1E3B58` |
| Control text, disabled | `mapped.text.disabled` | `#909397` |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Color disc | `brand.scale.16` | 16px, the contextual button icon slot. It paints the color swatch’s default look, scaled from the 24px disc. Type none or color. Not hover, selected, or custom |
| Color disc stroke | `mapped.border.control`, `alias.border-width.xsm` | `#C0C4C9`, 1px, on the default disc |
| Slider | fill opacity slider, `sm` | 8px track, `brand.scale.8`, centered on the 12px thumb, `brand.scale.12`. The track uses the fill. No fill uses `#C0C4C9`. The percent is left-aligned in a slot the width of `100%`, with 16px before it |
| New shape fill | `alias.swatch.purple.200` | `#EBCFFF`. The fill grid is step 200. Choosing purple writes this hex and selects the purple disc |
| New shape stroke | `alias.swatch.purple.500` | `#BF66FF`. The stroke grid is step 500. Choosing purple writes this hex and selects the purple disc |
| Motion | not a token | One pill glides across the whole bar, including over both dividers, with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves the row, or when the pointer is on a disabled button. The fill opacity slider is not a target, so the pill is not drawn on it. The pill fill is `mapped.surface.action-hover`. The row is `PillRow` |

The board passes no icon of its own. The icon-fit trial can pass `kindIcons` and `lineWeightIcon`. The board omits both, so the bar keeps `ShapeKindIcon` and the line-weight file. The buttons inside set the contextual button properties. The property panel was not opened. These were read from the frame:

| Control | Slots | Instance |
| --- | --- | --- |
| Shape swap | left icon off, label off, right icon on, dropdown on | the current kind. The specimen is a diamond |
| Stroke | left icon off, label on (`Stroke`), right icon on, dropdown on | the disc is type none on the specimen |
| Line weight | left icon off, label off, right icon on, dropdown on | `line-weight-menu` |
| Fill | left icon off, label on (`Fill`), right icon on, dropdown on | the disc is type color on the specimen |

The shape-swap popover is `toolbar/contextual/shape/pop-over/shape-swatch`, drawn by `src/components/ShapeSwatch.tsx`. The bottom Shapes tool opens the same row. The kinds are rectangle, ellipse, rounded rectangle, triangle, and diamond, in that order. The current kind is the selected button. A mixed kind leaves every button unselected. Choosing a kind closes the menu. The stroke popover is `toolbar/contextual/shape/pop-over/stroke-property`, drawn by `src/components/StrokeProperty.tsx`. The icons are `type-thin`, `type-medium`, `type-thick`, `type-straight`, and `type-dashed`. The current weight and the current line style are the selected buttons.

The open fill menu is the color picker toolbar at step 200, with none. Choosing purple writes `#EBCFFF` and selects the purple disc. The open stroke menu is the same picker at step 500, with none. Choosing purple writes `#BF66FF` and selects the purple disc. A saved hex that is not on that menu’s step selects custom and keeps that paint, including `#bfdbfe` and `#334155`. Clearing fill or stroke clears only that paint. The button disc stays type color for a hex, and type none when that paint is cleared. The note on the frame says the disc is not hover, not selected, and not the custom type.

Painted on the bar: one resting frame. The buttons in that frame are resting. The slider reads 50%.

Not painted on the bar: hover, selected, and disabled. Those states belong to the contextual button. The button has no focus state. The app paints the current kind, weight, and line type with the button’s selected state.

Each menu sits `brand.scale.4` (4px) under the painted pill. The portal host is a zero-size box at the top of the layer, so the gap is measured from the pill. A menu moves above the pill only when it would leave the board.

The toolbar and these menus add no z-index. The bar is already in FloatingPanel on the toolbar layer. The menus use FloatingPanel on the dropdown layer. They stay above a selected shape and a shape that is mid-drag.

## Stroke property

Ticket NB-60, NB-79. Code `src/components/StrokeProperty.tsx`. The pill row is `src/components/PillRow.tsx`. `src/toolbars/ShapeToolbar.tsx` and `src/toolbars/NoodleToolbar.tsx` each open it from the line-weight control. Each toolbar owns the open state and writes its own thickness and line style.

Thin, medium, and thick, a divider, then solid and dashed. The icons are `type-thin`, `type-medium`, `type-thick`, `type-straight`, and `type-dashed`. The current weight and the current line style are the selected buttons. A mixed value leaves that group unselected. Choosing one leaves the menu open, so the other group can be set too. Noodle thickness and shape thickness stay the pixel sizes they already paint. Dashed stays `8 6`.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.40`), from 4px padding and a 32px button |
| Padding | `brand.scale.4` | 4px |
| Gap inside a group | `brand.scale.2` | 2px |
| Gap between groups | `brand.scale.4` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | `mapped.border.default`, `alias.border-width.xsm` | 1px `#D8DCE2` on the right of the weights, with 4px (`brand.scale.4`) of padding before it |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Motion | not a token | One pill glides across the weight group, the divider, and the line-type group with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves this row, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. `StrokeProperty` owns this `PillRow` |

The five buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on.

The property list was not opened. The code takes the current weight, the current line style, and a mixed flag for each group.

| Property | Kind | Values |
| --- | --- | --- |
| thickness | the weight | `thin`, `medium`, `thick` |
| lineStyle | the line type | `solid`, `dashed` |
| thicknessMixed | code | when set, no weight button is selected |
| lineStyleMixed | code | when set, no line-type button is selected |

Painted: one resting row. The app paints the current weight and the current line style with the button’s selected state. A mixed group stays in the default look.

Not painted, as far as the frame shows: hover and disabled. The button has no focus state.

The menu sits `brand.scale.4` (4px) under the painted pill. The portal host is a zero-size box at the top of the layer, so the gap is measured from the pill. A menu moves above the pill only when it would leave the board. The row adds no z-index. Each toolbar opens it in FloatingPanel on the dropdown layer. It stays above a selected element and an element that is mid-drag.

## Shape swatch

Ticket NB-61, NB-79. Code `src/components/ShapeSwatch.tsx`. The pill row is `src/components/PillRow.tsx`. `src/toolbars/ShapeToolbar.tsx` opens it from the shape-swap control. `src/toolbars/Toolbar.tsx` opens it from the bottom Shapes tool. Each caller owns the open state. The shape toolbar writes the selected shape’s kind. The bottom tool places that kind.

Rectangle, ellipse, rounded rectangle, triangle, and diamond, in that order. The icons are `ShapeKindIcon`, from `src/assets/icons/shape-square.svg`, `shape-circle.svg`, `shape-round-rectangle.svg`, `shape-triangle.svg`, and `shape-diamond.svg`. Square, circle, and diamond start at 28 by 28. The triangle is 29 by 28 and the rounded rectangle is 31 by 28. Each glyph is cropped to the stroked path plus the Lucide margin, then fitted in the 16px slot, `brand.scale.16`. Wider files stay wider. The stroke follows the button icon color. On a selected shape, the current kind is the selected button. A mixed kind leaves every button unselected. Choosing a kind on a selected shape changes that shape and closes the menu. Choosing a kind on the bottom tool places that kind and closes the menu. The row has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.40` | 40px, from 4px padding and a 32px button |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.2` | 2px between the icon buttons |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | none | the row has no divider |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this row | the label slot is off |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Motion | not a token | One pill glides across the five kind buttons with `motion-glide`. It fades with `motion-fade` when the pointer or focus leaves this menu, or when the pointer is on a disabled button. The pill fill is `mapped.surface.action-hover`. `ShapeSwatch` owns this `PillRow`, so the shape toolbar and the main toolbar's Shapes menu both show it |

The five buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on. Each icon is 16px, `brand.scale.16`.

The property list was not opened. The code takes the current kind. Null means mixed.

| Property | Kind | Values |
| --- | --- | --- |
| kind | the shape | `rect`, `ellipse`, `round-rect`, `triangle`, `diamond`. Null leaves every button unselected |
| icons | code | optional. The board uses `ShapeKindIcon`. The icon-fit trial can pass another glyph |

Painted: one resting row. The app paints the current kind with the button’s selected state. A mixed kind stays in the default look.

Not painted, as far as the frame shows: hover and disabled. The button has no focus state.

Each menu sits `brand.scale.4` (4px) from the control that opened it. On the shape toolbar the portal host is a zero-size box at the top of the layer, so the gap is measured from the painted pill. The bottom Shapes menu uses the same gap from the bottom toolbar. A menu moves above the control only when it would leave the board. The row adds no z-index. Each caller opens it in FloatingPanel on the dropdown layer. The shape-toolbar menu stays above a selected shape and a shape that is mid-drag.

## Main button

Ticket NB-63, NB-77. Code `src/components/MainButton.tsx`. The trial page is `?trial=main-button`. NB-77 leaves this button still. The pill stays on the main toolbar.

A 40px toolbar button. With only the icon showing, it is 40px by 40px. With the label and both icons, the width follows that content. The default type has four states. The destructive type has three.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.40` | 40px |
| Width, icon only | `brand.scale.40` | 40px. One 16px icon and 12px padding on each side |
| Padding | `brand.scale.12` | 12px |
| Gap | `brand.scale.8` | 8px between the left icon, the label, and the right icon |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the button has no stroke |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. Paragraph spacing is `not a token`. The label box measures 31 by 12 |
| Icon | `brand.scale.16` | 16px, Lucide. Both slots are the case-sensitive glyph |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, default hover | `mapped.surface.action-strong-hover` | `#E5F0F9` |
| Fill, default selected | `mapped.surface.action-strong-selected` | `#4A94DB` |
| Fill, destructive default and disabled | `mapped.surface.error` | `#F1DEE0` at 0% |
| Fill, destructive hover | `mapped.surface.error-hover` | `#F1DEE0` |
| Text, default | `mapped.text.action` | `#303132` |
| Text, default hover | `mapped.text.action-hover` | `#1E3B58` |
| Text, default selected | `mapped.text.action-strong-selected` | `#FCFDFE` |
| Text, disabled | `mapped.text.disabled` | `#909397` |
| Text, destructive default and hover | `mapped.text.error`, `mapped.text.error-hover` | `#BE123C` |
| Icon, default | `mapped.icon.action` | `#303132` |
| Icon, default hover | `mapped.icon.action-hover` | `#1E3B58` |
| Icon, default selected | `mapped.icon.action-strong-selected` | `#FCFDFE` |
| Icon, disabled | `mapped.icon.disabled` | `#909397` |
| Icon, destructive default and hover | `mapped.icon.error`, `mapped.icon.error-hover` | `#BE123C` |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |
| Motion | none | The button does not move. The sliding pill belongs to the main toolbar |

The hover fill is `mapped.surface.action-strong-hover`, `#E5F0F9` (`alias.primary.50` at 100%). Hover text is `mapped.text.action-hover` and hover icons are `mapped.icon.action-hover`, both `#1E3B58`. The selected fill is `mapped.surface.action-strong-selected`, `#4A94DB`, with light text and icons. The pale action hover used by the icon button is a different fill.

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| type | variant | `default`, `destructive` |
| state | variant | `default`, `hover`, `selected`, `disabled` |
| Label | text | default `Label`. The layer is `Label` |
| Left icon | slot | `icon/lucide/case-sensitive`. It can be hidden |
| Right icon | slot | `icon/lucide/case-sensitive`. It can be hidden |

Painted states: `default`, `hover`, `selected`, and `disabled` on the default type. `default`, `hover`, and `disabled` on the destructive type. The type diagram paints the icon-only size at 40 by 40.

Not painted: focus. Selected is not painted on the destructive type.

This button is not a toolbar. The main toolbar places it. See Main toolbar.

## Main toolbar

Ticket NB-64, NB-77, NB-79. Code `src/toolbars/Toolbar.tsx`. The shared row is `src/components/PillRow.tsx`. The pill hook is `src/hooks/useSlidingPill.ts`. It stays at the bottom center of the board, in FloatingPanel on the toolbar layer.

Every control is a main button with the label and the right icon turned off, so each one is 40 by 40. The row is select, hand, sticky note, text, image, shapes, noodle, and delete. Delete is the destructive type. The shapes control opens the same shape swatch the shape toolbar uses.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | hug. 4px padding and a 40px button make 48px, which is the frame label. The painted frame is 48px including the 1px stroke, so the space inside the stroke is 3px. No spacing token is 3px |
| Width | none | hug. The frame label is 342. Eight 40px buttons, seven 2px gaps, and 3px of padding on each side, plus the 1px stroke, make 342 |
| Padding | `brand.scale.4` | 4px. The painted frame is 3px, and no spacing token is 3px |
| Gap | `brand.scale.2` | 2px between buttons |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Blur | not a token | the existing 24px blur |
| Shadow | not a token | the existing `shadow-lg` |
| Divider | none | the frame has no divider |
| Control height | `brand.scale.40` | 40px |
| Control padding | `brand.scale.12` | 12px, so an icon-only button is 40 by 40 |
| Control radius | `alias.border-radius.lg` | 8px |
| Control font | none | the label slot is off |
| Control icon | `brand.scale.16` | 16px |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-strong-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-strong-selected` | `#4A94DB` |
| Control fill, destructive default and disabled | `mapped.surface.error` | `#F1DEE0` at 0% |
| Control fill, destructive hover | `mapped.surface.error-hover` | `#F1DEE0` |
| Control text | none | the label slot is off |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-strong-selected` | `#FCFDFE` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |
| Control icon, destructive default and hover | `mapped.icon.error`, `mapped.icon.error-hover` | `#BE123C` |
| Dot grid | not a token | excluded from the component |
| Motion | not a token | One pill glides between tools with `motion-glide` and fades with `motion-fade` when the pointer leaves the row, when focus leaves the row, or when the pointer is on a disabled tool. The row is `PillRow`. The hook is `useSlidingPill`. The pill fill is `mapped.surface.action-strong-hover`, or `mapped.surface.error-hover` while Delete can run. `.pill-row` clears the hover fill on a button that is not pressed, so the pill is the hover. A selected button keeps its fill |

The icons are Lucide, except the noodle, which is `src/assets/icons/noodle-main.svg`. Select is `mouse-pointer-2`. Hand is `hand`. Sticky note is `sticky-note`. Text is `type`. Image is `image`. Shapes is `shapes`. Delete is `trash`.

Delete's hover label is "Delete" when an element is selected, and "Select something to delete" while the button is disabled. The label sits on the span around the button, so it still shows while the button is disabled. The button's accessible name stays "Delete".

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| Button | main button | label off, right icon off, left icon on |
| Delete type | main button type | `destructive` |
| Shapes menu | the shared shape swatch | the note on the frame says the shape tool uses the shape contextual popover |

Painted: one resting row. Select, hand, sticky, text, image, shapes, and noodle sit on the default type. Delete sits on the destructive type, red icon, clear fill.

Not painted on this frame: hover, selected, and disabled. Those come from the main button when a tool is on, a pointer is over a button, or delete has nothing to remove. The button has no focus state. The frame paints no tooltip. The hover label above each tool stays the one the board already shows.

## Save indicator

Ticket NB-68. Code `src/components/SaveIndicator.tsx`. The trial page is `?trial=save-indicator`.

A square slot with one disc centered in it. The disc is 8px at every size. The slot does not clip the saving ring.

| Piece | Token | Value |
| --- | --- | --- |
| Slot, `lg` | `brand.scale.40` | 40px |
| Slot, `md` | `brand.scale.32` | 32px |
| Slot, `sm` | `brand.scale.24` | 24px |
| Disc | `brand.scale.8` | 8px, centered. The same disc at every slot |
| Disc radius | none | a circle. `rounded-full` |
| Success disc | `mapped.icon.success-light` | `#72C68F`, `alias.success.300`. The proposed comparison rests here. The static frame samples `#45B46C` |
| Error disc | `mapped.icon.error` | `#BE123C` |
| Saved breath | `mapped.icon.success-light` to `mapped.icon.success` | scale 1 to 1.1, `ease-in-out`, 3s, infinite |
| Saving disc | `mapped.icon.success-light` | stays at scale 1 |
| Saving ring | `mapped.icon.success` | covers the disc, `ease-out`, 1.2s, infinite. Scale 1 at opacity 0.5 to scale 2.4 at opacity 0 |
| Stroke | none | the disc has no stroke |
| Text | none | the component has no text |
| Divider | none | the component has no divider |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| size | variant | `lg`, `md`, `sm`. Default `lg` |
| type | variant | `success`, `error`. Default `success` |
| saving | boolean | success plays the ring when true, and the breath when false. Error ignores it |

Painted: success at rest, success breathing while saved, success with the ring while saving, and a still error disc. Reduced motion leaves the resting disc and drops both animations.

Not painted: hover, disabled, and focus. Error has no animation. The board uses this indicator for the save pulse. A ring iteration counts only while saving. The breath does not.

## Logo button

Ticket NB-67, NB-77, sizes NB-82. Code `src/components/LogoButton.tsx`. The trial page is `?trial=logo-button` and `#logo-button`. The timings live in `src/styles/motion.css`.

The brand mark. The button is 40px on `lg` and 32px on `md`. The glyph scales with the button. The fill is the brand red. The glyph is `src/assets/icons/noodle-logo.svg`. The red plate in that file is not drawn. The circle clips the chopstick. Hover and selected ease the corner from the circle to the rounded square with `motion-hover` and reveal the chopstick.

A press pulls the corner toward the circle and dips the glyph. The press uses `motion-press`. The release uses `motion-release`. The pointer is captured on the press, so the press holds if the pointer leaves before the release. A cancelled pointer releases the same way. The release reads `--motion-release-duration` and waits that long plus 80ms if the transition does not end. The return from the square to the circle stays 700ms, `cubic-bezier(0.22, 1, 0.36, 1)`. That curve has no motion name. The other timing is `motion-release`. That choice is open.

| Piece | Token | Value |
| --- | --- | --- |
| Size | `brand.scale.40`, `brand.scale.32` | 40px on `lg`, 32px on `md` |
| Padding | none | 0 |
| Gap | none | the button has no gap |
| Radius, rest | `brand.scale.20`, `brand.scale.16` | half the button, a circle: 20px on `lg`, 16px on `md` |
| Radius, hover and selected | `alias.border-radius.lg` | 8px on both sizes. The `lg` frame’s expanded corner is 6.2px. The 8px on `md` is a design choice |
| Radius, pressed | not a token | 42% of the button, between the square and the circle: 16.8px on `lg`, 13.44px on `md` |
| Motion | not a token | The corner and the mark. A press uses `motion-press`. A release uses `motion-release`. Hover and selected expand the corner with `motion-hover`. The return to the circle stays 700ms, `cubic-bezier(0.22, 1, 0.36, 1)`, and that curve has no motion name. The other timing is `motion-release`, 280ms, `cubic-bezier(0.34, 1.56, 0.64, 1)`. That choice is open |
| Fill | none | `#B11F24`. The brand red is not a design token |
| Icon, every state | none | white, from the asset, drawn on a 40 by 40 view box and scaled to the button. The reference dip is 1.6px on a 64px button |
| Glyph dip | not a token | 1px on `lg`, 0.8px on `md`, down while pressed, then the spring back. The red plate stays put |
| Stroke | none | the button has no stroke |
| Text | none | the button has no text |
| Divider | none | the button has no divider |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| state | painted variant | `default`, `hover`, `selected`. Unset follows the pointer and `selected` |
| selected | boolean | the rounded square. A click on the live button switches it |
| size | variant | `lg` (default, 40px), `md` (32px) |

Painted: the resting circle, the hover square, and the selected square, on each size. A press on any of them plays the shape press. The project toolbar trial's resting bar uses `lg`. The board's bar uses `md`.

Not painted: a focus ring, and a disabled state.

The button is not a toolbar or a popover. It does not use FloatingPanel.

## Project toolbar

Ticket NB-72, NB-80, sizes NB-83, board size NB-84. Code `src/toolbars/ProjectToolbar.tsx`. The trial page is `?trial=project-toolbar` and `#project-toolbar`. NB-80 adds the existing 24px blur.

The upper-left project bar. The row is the logo button, the title input, and the save indicator. `size` passes the same size to all three: `lg` (default) is 40px parts, `md` is 32px parts. The trial shows both. The board places this bar from the project management toolbar at `md`. The table below is `lg`.

On `md` the logo, title, and indicator are 32px, so the bar is 40 inside the stroke and 42 outside. The padding, gap, corner, stroke, fill, shadow, blur, and the 200px title minimum stay the same. Figma frame 570:3082 could not be read yet, so the shell values on `md` are not checked against it.

The content box is 304 by 48 when the title is at its 200px minimum: 4px padding, a 40px logo, an 8px gap, a 200px title, an 8px gap, a 40px indicator, and 4px padding. The 1px stroke brings the outer size to 306 by 50. A longer title grows the slot up to 320px, then truncates. Hovering or focusing that field shows the full title in the main toolbar’s hover label.

| Piece | Token | Value |
| --- | --- | --- |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.8` | 8px between the logo and the title, and between the title and the indicator |
| Height | none | hug. 4px padding and a 40px slot make 48px inside the stroke. The outer height is 50px with the 1px stroke |
| Width | none | hug. The specimen is 304px inside the stroke when the title is at 200px. The outer width is 306px |
| Corner radius | `alias.border-radius.xl` | 12px. The corner measures about 10px. No radius token is 10px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the existing `shadow-lg` |
| Blur | not a token | the existing 24px blur |
| Dot grid | not a token | excluded from the component |
| Divider | none | the frame has no divider |
| Logo slot | `brand.scale.40` | 40px. The resting control is a circle. The radius is `brand.scale.20`. Hover and selected expand to `alias.border-radius.lg` (8px). The frame’s expanded corner is 6.2px |
| Logo fill | none | `#B11F24`. The brand red is not a design token |
| Logo text | none | the button has no text |
| Logo icon | the noodle mark | `src/assets/icons/noodle-logo.svg`. The circle clips the chopstick. Hover and selected reveal it |
| Title slot minimum | none | 200px. No spacing token is 200px. This minimum is on the bar only. The title input still hugs its text everywhere else |
| Title slot maximum | none | 320px. No spacing token is 320px. A longer title truncates. The resting field offers the full title |
| Title height | `brand.scale.40` | 40px |
| Title padding | `brand.scale.12` | 12px on the left and right |
| Title radius | `alias.border-radius.xl` | 12px |
| Title font | `alias.font-family.body` | Geist |
| Title type size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 14px / 14px, text style `body/md/tight`. Paragraph spacing is `not a token` |
| Title text | `mapped.text.default` | `#303132` |
| Title fill, default | none | the field has no fill |
| Title fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Title fill, focus | `mapped.surface.default` | `#F6F9FD` at 60% |
| Title stroke, focus | `mapped.border.action-ring-focus`, `alias.border-width.sm` | `#4A94DB`, 2px, drawn outside the box |
| Indicator slot | `brand.scale.40` | 40px, size `lg` |
| Indicator disc | `brand.scale.8` | 8px, centered |
| Indicator, saved | `mapped.icon.success-light` | `#72C68F`. It breathes to `mapped.icon.success` (`#16A34A`) |
| Indicator, saving | `mapped.icon.success` | the ring. The disc stays `mapped.icon.success-light` |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| Logo | logo button | resting circle on this frame. Hover and selected stay on the button |
| Title | title input | specimen `Project Title`. The field can be edited |
| Save indicator | size `lg` | success. Saved breathes. Saving plays the ring |
| size | variant | `lg` (default, 40px parts), `md` (32px parts). Passed to the logo, the title input, and the save indicator |

Painted on this frame: the resting circle, the resting title, and the saved disc. The trial also paints a title long enough to truncate, and the same bar while saving.

Not painted on this frame: the logo’s expanded square, the logo’s press, the title’s hover and focus fills, and the indicator’s error disc. Those stay on the logo button, the title input, and the save indicator.

This trial is not on the canvas, so this preview is not in FloatingPanel. The board places the bar in a FloatingPanel on the toolbar layer. That placement is recorded in the project management toolbar section.

## Project menu

Ticket NB-73, NB-75, NB-76, sizes NB-83. Code `src/toolbars/ProjectMenu.tsx`. The trial page is `?trial=project-menu` and `#project-menu`. NB-75 adds the divider, the two spaces, and the indent on View all and the main-menu project rows. NB-76 clips a project name that is longer than its row.

`size` sets the width of both panels: `lg` (default) is 220px, `md` is 180px. No spacing token is 180px. The rows are the menu item at `md` (32px) on both sizes, so the heights below hold on both. The trial adds an `md` menu with View all selected.

Two panels. The main menu lists New, Open, a Recent label, View all, the first three project names, Save, and Save as. The recent panel lists every project name passed in. It is open when View all is selected. A click on View all switches that state, so the click opens the recent panel and the next click closes it. The trial starts with one menu selected, the first recent row selected, and a second menu where View all is not selected so the panel starts closed. The board opens this menu from the project management toolbar.

The panels sit 4px apart, `brand.scale.4`, the same offset a menu uses from the toolbar that opened it. The sheet gap between the two panels was not measured.

### Main menu

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 220px on `lg`, 180px on `md`. No spacing token is 220px or 180px |
| Height | hug | 305px inside the stroke. Nine 32px rows, 4px padding on top and bottom, a 1px divider, and 4px of space above View all and below the project rows. The outer size is 307px with the 1px stroke |
| Padding | `brand.scale.4` | 4px |
| Gap between rows | `brand.scale.0` | 0px |
| Space above View all | `brand.scale.4` | 4px, between the divider and View all |
| Space before Save | `brand.scale.4` | 4px, below the project rows. There is no divider in that space |
| Divider | `mapped.border.default`, `brand.scale.1` | 1px. The panel padding applies, so the line is the same width as a menu item |
| Corner radius | `alias.border-radius.lg` | 8px. The corner was not measured on this frame. It is the same corner the other menus use |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same `shadow-lg` the font menus already use |
| Blur | not a token | the same 24px blur the font menus already use |
| Dot grid | not a token | excluded from the component |

### Divider and spaces

The divider and the two spaces belong to the main menu. View all and the three project names sit in one wrapper. The wrapper's top margin is the space under the divider. The wrapper's bottom margin is the space before Save. The wrapper has no gap of its own.

| Piece | Token | Value |
| --- | --- | --- |
| Divider | `mapped.border.default`, `brand.scale.1` | 1px tall. The fill is `mapped.border.default`. The panel's `brand.scale.4` padding applies, so the line is the same width as a menu item |
| Space above View all | `brand.scale.4` | 4px, between the divider and View all |
| Space before Save | `brand.scale.4` | 4px, below the project rows. There is no divider in that space |

### Recent label

The word Recent is a disabled menu item at size `md`. Label only. Left icon off. Caption off. Chevron off. Indent off. It uses the disabled label color and the disabled fill. It does not take a hover fill, and it does not nudge. "No recent boards yet." is not this row. That sentence keeps the previous type: `mapped.text.action`, 12px / 12px.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.32` | 32px |
| Padding, horizontal | `brand.scale.8` | 8px, so the word lines up with New, Open, Save, and Save as. Disabled stays put, so there is no 3px nudge |
| Gap | `brand.scale.8` | 8px on the menu item. The right slot is off, so nothing sits in it |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the row has no stroke |
| Fill | `mapped.surface.action` | `#E5F0F9` at 0%, the menu item disabled fill. Hover does not paint `mapped.surface.action-hover` |
| Font | `alias.font-family.body` | Geist |
| Label size | `responsive.desktop.body.sm.size`, `responsive.desktop.body.sm.line-height-tight` | 12px / 12px, text style `body/sm/tight`. The label still writes 12px. Paragraph spacing is `not a token` |
| Label color | `mapped.text.disabled` | `#909397` |
| Icon | none | no left icon and no chevron |
| Caption | none | no shortcut |
| Shadow | not a token | the row adds none |
| Blur | not a token | the row adds none |

### Recent panel

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 220px on `lg`, 180px on `md`. No spacing token is 220px or 180px |
| Height | hug | 200px inside the stroke. Six 32px rows and 4px padding on top and bottom, with no gap. The outer size is 202px with the 1px stroke |
| Padding | `brand.scale.4` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px. The same corner as the main menu |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F6F9FD` at 60% (`alias.cool-neutral.200`) |
| Shadow | not a token | the same `shadow-lg` the font menus already use |
| Blur | not a token | the same 24px blur the font menus already use |
| Divider | none | the frame has no divider |
| Dot grid | not a token | excluded from the component |

### Rows

The rows are the menu item at size `md`. Hover, selected, disabled, and the row colors stay on the menu item section.

| Row | Slots |
| --- | --- |
| New, Open, Save, Save as | size `md`. Left icon off. Chevron off. Caption is `Ctrl+N`, `Ctrl+O`, `Ctrl+S`, or `Ctrl+Shift+S` |
| Recent | size `md`. Left icon off. Caption off. Chevron off. Indent off. Disabled. Label only |
| View all | size `md`. Left icon off. Caption off. Chevron off. Indent on. Selected while the recent panel is open |
| Project name | size `md`. Left icon is Lucide `bowl-chopsticks` at `brand.scale.16`. Caption off. Chevron off. Indent on for the three names in the main menu. `truncateLabel` on. A name longer than the row clips. The installed `lucide-react` package has no `BowlChopsticks` export, so the glyph is brought in under that name |
| Recent panel project | the same project row. Indent off. `truncateLabel` on. The open specimen paints the first name selected, and that name is long enough to clip. The copy in the main menu stays unselected |

A clipped project name shows the full title in the main toolbar hover label. The label sits 8px above that row. It wraps at the row so it stays over the menu, and it stops at 320px. Short names that fit the row show no label.

| Piece | Token | Value |
| --- | --- | --- |
| Full title | none | shown only when the project name is clipped. 8px above the row, centered. It wraps at the row, and the cap is 320px. `rounded-md`, `bg-slate-900`, `px-2 py-1`, `text-xs`, `font-medium`, white. These are the existing toolbar label, not design tokens |
| Shadow | not a token | `shadow-lg` |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| projects | list | every recent name. The main menu shows the first three. The recent panel shows all of them |
| viewAllSelected | boolean | default off. The starting selected state. A click on View all switches it. On paints View all selected and opens the recent panel |
| selectedProject | text | the recent-panel row to paint selected. Unset paints none of them selected |
| size | variant | `lg` (default, 220px panels), `md` (180px panels). Rows stay `md` |

Painted: View all selected with the recent panel open and the first recent row selected. That first name is long enough to clip in both panels. View all not selected, with the recent panel closed. The other rows are the menu item’s default state. The hover label is not a painted state. It shows on hover or focus when the name is clipped.

Not painted on this frame: hover. That stays on the menu item. The menu item has no focus state. The Recent label is painted disabled: no hover fill and no nudge.

The flex wrapper around the two panels ignores pointer events. Only the two panels receive them. A press in the gap, or in the space under the shorter panel, passes through the wrapper.

This trial is not on the canvas, so these panels are not in FloatingPanel. The board places the menu in one FloatingPanel on the dropdown layer and checks it against a selected element and an element that is mid-drag.

## Project management toolbar

Ticket NB-74, NB-78, sizes NB-83, board size NB-84. Code `src/toolbars/ProjectManagementToolbar.tsx` and `src/App.tsx`. The trial page is `?trial=project-management-toolbar` and `#project-management-toolbar`.

`size` passes down to the project toolbar and the project menu. `lg` (default) is 40px parts and 220px panels. `md` is 32px parts and 180px panels, with the logo press at 13.44px and a 0.8px dip. The trial shows `lg` and then `md`, each with its own menu. The board uses `md`: 32px parts and 180px panels. An unset size stays `lg`.

The trial places the project menu under the project toolbar while the logo has the menu open. The title starts as `Project Title`. Typing replaces that text in the field. An empty field stays empty. The menu starts closed. A click on the logo opens it, and the next click closes it and removes the recent panel with it. A pointer down anywhere outside the menu does the same, including a press on the title or the page. A pointer down inside the main menu or the recent panel leaves the menu open. The logo stays the expanded square while the menu is open. View all starts unselected. The click on View all inside the project menu opens the recent panel. The names are `Project name #1` through `Project name #6`. The main menu shows the first three. The recent panel shows all six.

The press lives on the logo button. A press pulls the corner to 16.8px and dips the mark 1px with `motion-press`. A release, or a cancelled pointer, uses `motion-release`. The pointer is captured on the press, so the press holds if the pointer leaves the button before the release. Hover and selected expand the corner with `motion-hover`. The return to the circle stays the 700ms curve, and that choice is open. While the menu is open, a press pulls the expanded square toward the circle and the release springs that square back. The square stays until the menu closes. The logo trial uses the same button, so a press plays there too. The live button on that trial does not open a menu.

The bar keeps the table in the Project toolbar section. The main menu and the recent panel keep the tables in the Project menu section. This table is the gap under the bar and the logo press.

| Piece | Token | Value |
| --- | --- | --- |
| Gap under the bar | `brand.scale.4` | 4px, between the bar and the menu. The menu's left edge lines up with the bar's left edge |
| Logo corner, pressed | not a token | 16.8px. The release springs back to the square while the menu is open, and to the circle when the menu is closed and the pointer has left |
| Logo mark, pressed | not a token | 1px down. The release springs it back. The red plate stays put |
| Press in | not a token | 80ms |
| Press release | not a token | 280ms, `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| Shadow | not a token | this trial adds none of its own |
| Blur | not a token | this trial adds none of its own |
| Dot grid | not a token | excluded from the component |
| Divider | none | this trial adds no divider |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| Title | text | starts as `Project Title`. Typing replaces the text. An empty field stays empty |
| Menu | open or closed | starts closed. The logo click switches it. A pointer down outside the menu closes it. Open keeps the logo selected |
| Recent panel | open or closed | starts closed. View all's click switches it. Closing the menu removes the panel |
| size | variant | `lg` (default), `md`. Passed to the project toolbar and the project menu |

Painted: the bar with the menu closed, the menu open, the menu open with the recent panel, and the logo while it is pressed.

Not painted on this frame: hover, the title fills, and the menu-item states. Those stay on the logo button, the title input, and the menu item.

### Board

The board replaces the file bar with this toolbar. The upper-right wordmark is gone. The logo is the brand mark. The board passes `md`: 32px logo, title, and save indicator, and 180px menu panels. An unset size stays `lg`.

The bar is a FloatingPanel on the toolbar layer. It sits 16px from the top and the left. The open menu is one FloatingPanel on the dropdown layer. The menu's left edge lines up with the bar, and the gap under the bar is 4px. `data-canvas-chrome` is on the bar, so the open menu does not become the noodle obstacle. Both panels stay above a selected element and an element that is mid-drag.

The title shows the document name. Enter or blur commits the rename. Escape restores the document name and does not rename. An empty name becomes `Untitled`. Typing does not rename on each keystroke. The trial field is separate: it still updates as you type, and an empty field stays empty.

The board's New row has no caption. Open, Save, and Save as keep `Ctrl+O`, `Ctrl+S`, and `Ctrl+Shift+S`. The trial still shows `Ctrl+N` on New.

Recent rows are the board's recents. The open project is selected in the recent panel only. With no recents, the main menu still lists New, Open, Recent, View all, Save, and Save as, and View all opens a panel that reads "No recent boards yet." The trial keeps `Project name #1` through `Project name #6`.

The word Recent is a disabled menu item: label only, no icon, no caption. The label color is `mapped.text.disabled`. The fill is the menu item's disabled fill, `mapped.surface.action` at 0%. It gets no hover fill and no nudge. "No recent boards yet." stays on the previous type, `mapped.text.action` at 12px / 12px.

The flex wrapper around the two panels ignores pointer events, and so does the dropdown FloatingPanel that wraps it. Only the two panels receive them. A press in the gap, or on the canvas under the recent panel, reaches the canvas and closes the menu on that press. A press on either panel leaves the menu open.

The save indicator shows the board's save pulse. The ring is on `::after`, and that pseudo-element does not fire `animationiteration` on the disc, so the three-loop hold follows the ring animation's iteration. The breath does not count. The pulse still clears after three saving iterations, or on the existing fallback. Reduced motion still clears immediately.

| Piece | Token | Value |
| --- | --- | --- |
| Inset | `brand.scale.16` | 16px from the top and the left |
| Gap under the bar | `brand.scale.4` | 4px. The menu's left edge lines up with the bar |
| Bar layer | toolbar | FloatingPanel, above a selected element and an element that is mid-drag |
| Menu layer | dropdown | one FloatingPanel wraps the main menu and the recent panel |
| Chrome | none | `data-canvas-chrome` is on the bar only. The open menu is not the noodle obstacle |
| Title | none | shows the document name. Enter or blur commits. Escape cancels. An empty name becomes `Untitled` |
| New caption | none | off. The trial keeps `Ctrl+N` |
| Open caption | none | `Ctrl+O` |
| Save caption | none | `Ctrl+S` |
| Save as caption | none | `Ctrl+Shift+S` |
| Recent label | `mapped.text.disabled` | disabled menu item, label only. No icon, no caption, no hover fill, no nudge. Fill is `mapped.surface.action` at 0% |
| Empty recents | `mapped.text.action` | "No recent boards yet." keeps the previous type, 12px / 12px. It is not the disabled row |
| Menu hit area | none | the wrapper and the dropdown panel ignore pointer events. Only the two panels receive them. A press in the gap or under the recent panel reaches the canvas and closes the menu |
| Shadow | not a token | the bar and the menus keep their own |
| Blur | not a token | the existing 24px blur |
| Dot grid | not a token | excluded from the component |
| Divider | none | this placement adds no divider |

Properties:

| Property | Kind | Values |
| --- | --- | --- |
| documentName | text | the open document. The field shows it until it is focused |
| saving | boolean | the board's save pulse. The ring plays while it is on |
| recents | list | the board's recents, newest first. An empty list shows the empty sentence. Unset keeps the trial names |
| selectedRecentId | id | the recent-panel row for the open project. A new Untitled board has none |
| showNewCaption | boolean | default on. The board turns it off |
| placed | boolean | default off. The board turns it on and uses FloatingPanel |
| size | variant | `md` on the board. 32px parts and 180px panels. Unset stays `lg` |

The trial table above stays the trial: specimen names, an empty field that stays empty, and New's `Ctrl+N` caption.

The board bar and the board menu are in FloatingPanel. The trial stays in the page flow.
