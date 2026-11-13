# Design system notes

A running list of what each built piece taught us, so Figma and the token file can be updated from one place.

When a component, toolbar, dropdown, or popover is built, its section is added here. Each section names the Figma component, the node id, the ticket, and the code path. It has its own token table. It lists the Figma properties and their values, and it says which states are painted.

Shadow, blur, and the dot grid are left out of the token build. In the table they are marked `not a token`. They are not mismatches. Font size and line height use the responsive desktop tokens. Paragraph spacing is not in the export, so it stays `not a token`.

## Still to update

- **[Figma] Resting fill is invisible.** `mapped.surface.action` is `#E5F0F9` at 0%. The default button has no fill. Confirm that is the resting state on purpose.
- **[Figma] Weight label width.** The weight control is held to the width of the words “Bold Italic”, so Regular, Bold, Italic, and Bold Italic do not resize the toolbar. The Figma component may still hug the label. Give that control a minimum width if the bar should stay still.
- **[code] Underline and strikethrough.** They are drawn on `toolbar/contextual/text` and are not in the app. They wait for the text feature. Leave them in Figma.
- **[Figma] Caption and chevron switches.** The layers are `caption` and `icon/lucide/chevron-right`. The property panel was not readable, so the boolean names are not confirmed. The code hides each slot.
- **[Figma] Font style menu width.** The frame is 104px wide. No spacing token is 104px. The code keeps 104px and marks the mismatch.
- **[Figma] Hex input width.** The frame is 108px wide. No spacing token is 108px. The code keeps 108px and marks the mismatch.
- **[code] Contextual button and icon button node ids.** Both notes cite node `193:3525`. That node is the color-swatch spec. Their node ids still need a check.

## Decisions already made

- Heading, body, and caption are Geist. SF Pro is gone from the token export. The Figma text style `body/md/tight` still names SF Pro.
- The spec sheet around a component (state names, the red height notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.
- Shadow, blur, and the dot grid are `not a token`. Figma effects do not apply until they are planned.
- `mapped.surface.default` in `tokens.json` is `#F0F5FB` at 80%. The text toolbar, the align popover, the font style menu, the typeface menu, and the font size menu use that fill with the existing 24px blur and the existing shadow, the same frost as the rest of the board. Figma’s 2.6px blur is ignored.
- Desktop font size and line height are tokens under `responsive.desktop`. The text style `body/md/tight` is `responsive.desktop.body.md.size` (12px) and `responsive.desktop.body.md.line-height-tight` (12px). The caption size is `responsive.desktop.caption.md.size` (10px) and `responsive.desktop.caption.md.line-height-tight` (10px). Paragraph spacing is not in the export, so it stays `not a token`.
- 6px is `brand.scale.150` and 28px is `brand.scale.700`. Inserting them moved the later steps: 32px is `brand.scale.800`, 36px is `brand.scale.900`, 40px is `brand.scale.1000`, 44px is `brand.scale.1100`, and 48px is `brand.scale.1200`. Names through `brand.scale.600` (24px) stayed put.
- A selection that mixes two values (two alignments, two weights) is not a painted variant. The control stays in the default look.
- Icons are Lucide. The spec shows a case-sensitive icon and a chevron. The app draws those with Lucide, 16px for the main icon and 8px for the chevron. The menu item chevron is `chevron-right` at 12px. Figma’s own icon components are not imported.
- The contextual button has no focus state. The description that names focus was a mistake. Do not paint a focus ring, and do not use `mapped.border.action-ring-focus` on this button. The menu item has no focus state either. Its painted set is default, hover, selected, and disabled.
- The font size button opens its preset menu on a single click of the number or the chevron. A double click edits the number.
- The typeface menu lists the `alias.typeface` collection, in that order: Geist Mono, Open Sans, Coming Soon, Noto Serif, Montserrat. Each label is drawn in its own `alias.typeface` token. Other menus keep Geist.
- Each font size row is `brand.scale.900` (36px). The menu hugs that width. A row that hugged its label would change width between 10 and 72. The list is 10, 12, 14, 16, 18, 24, 32, 36, 40, 48, 64, 72. 40 is in the frame and was not in the Phase 1 list.
- A popover or dropdown sits `brand.scale.100` (4px) away from the floating toolbar that opened it. The gap is measured from the toolbar’s outer edge, not from the button inside it.
- The color swatch action ring is an outline stroke outside the disc. Figma draws that ring as a drop shadow, because a second stroke there changes the disc border. Outline leaves the disc border alone. Hover and selected are 4px, `alias.border-width.md`. The frame measures 3px. Selected uses `mapped.border.action-ring-focus`, not `mapped.border.action-ring-selected`.
- Color swatches and the custom swatch are separate choices. A color swatch uses `alias.swatch`. Fill and sticky notes use step 200. Stroke and noodles use step 500. The custom swatch can be selected on its own. Its color comes from the color picker (react-colorful), not from `alias.swatch`.

## Contextual button

Figma `button/contextual`, node `193:3525`. Ticket NB-38. Code `src/ContextualButton.tsx`. The trial page is `?trial=contextual-button`.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.800` | 32px |
| Padding | `brand.scale.200` | 8px |
| Gap | `brand.scale.100` | 4px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the button has no stroke |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 12px / 12px, text style `body/md/tight` |
| Icon | `brand.scale.400` | 16px |
| Chevron | `brand.scale.200` | 8px |
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

The icon nodes did not return a fill of their own. The icon color is the label color for that state.

Figma properties:

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

## Text toolbar

Figma `toolbar/contextual/text`, node `165:2947`. Ticket NB-39. Code `src/TextToolbar.tsx`.

Every control is a contextual button with the unused slots turned off.

- First group: font, size, weight, alignment. A divider sits on the right of the group.
- Second group: bulleted list, numbered list, and link. Icon only. Underline and strikethrough are in the Figma group and left out on purpose.
- Size keeps the number in the label slot. A single click anywhere on the size button opens the presets. A double click edits the number.
- The weight label reserves the width of “Bold Italic”.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | hug. 4px padding and a 32px button make 40px, which is `brand.scale.1000` |
| Padding | `brand.scale.100` | 4px |
| Gap inside a group | `brand.scale.50` | 2px |
| Gap between groups | `brand.scale.100` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F0F5FB` at 80% |
| Blur | not a token | the existing 24px blur. Figma’s 2.6px blur is ignored |
| Shadow | not a token | the existing `shadow-lg`. Figma’s shadow is ignored |
| Divider | `mapped.border.default`, `alias.border-width.xsm` | 1px `#D8DCE2` on the right of the first group, with 4px (`brand.scale.100`) of padding before it |
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
| Type size on the labels | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 12px / 12px, text style `body/md/tight` |

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

Figma `toolbar/contextual/text/pop-over/text-align`, node `165:2948`. Ticket NB-40. Code `AlignPopover` in `src/TextToolbar.tsx`.

The frame is 142 by 40. That is padding 4, four 32px buttons, and 2px gaps. Four contextual buttons, icon only: left, center, right, and justify. The current alignment is the selected button. The popover opens above a selected element and above an element while it is dragged. This frame has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.1000`), from 4px padding and a 32px button |
| Width | none | 142px, from the padding, four buttons, and the gaps |
| Padding | `brand.scale.100` | 4px |
| Gap | `brand.scale.50` | 2px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px, outside the 142 by 40 box |
| Fill | `mapped.surface.default` | `#F0F5FB` at 80% |
| Blur | not a token | the existing 24px blur. Figma’s blur is ignored |
| Shadow | not a token | the existing `shadow-lg`. Figma’s shadow is ignored |
| Control fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Control fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Control fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Control text | none on this frame | the label slot is off, so the frame shows no text. A label would use the contextual button text colors |
| Control icon, default | `mapped.icon.action` | `#303132` |
| Control icon, hover | `mapped.icon.action-hover` | `#1E3B58` |
| Control icon, selected | `mapped.icon.action-selected` | `#1E3B58` |
| Control icon, disabled | `mapped.icon.disabled` | `#909397` |

The four buttons use the contextual button slots: label off, left icon off, dropdown off, right icon on.

The property list on this component was not in the saved frame read. It is not confirmed whether the popover exposes `state`, `type`, `selected`, or its own slots.

Painted: one resting frame of four icon buttons.

Not painted on this frame, as far as the saved read shows: hover and disabled. The button has no focus state. Whether Figma paints one of the four buttons as `selected` was not in that read. The app paints the current alignment with the button’s selected state.

## Menu item

Figma `menu-item`, component set node `206:3727` (389 by 199). Spec frame `menu item`, node `193:3525`. Ticket NB-41. Code `src/MenuItem.tsx`. The trial page is `?trial=menu-item`.

A single row for a dropdown. The label sits on the left. The caption and the submenu chevron sit on the right. In a wide row the space falls between the label and that pair.

| Piece | Token | Value |
| --- | --- | --- |
| Height, md | `brand.scale.800` | 32px |
| Height, sm | `brand.scale.700` | 28px |
| Padding, horizontal | `brand.scale.200` | 8px |
| Gap between label and the caption group | `brand.scale.200` | 8px, and the row pushes the caption group to the far side |
| Gap between caption and chevron | `brand.scale.100` | 4px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | none | the row has no stroke |
| Font | `alias.font-family.body` | Geist |
| Label size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 12px / 12px, text style `body/md/tight`. The row still writes 12px |
| Caption size | `responsive.desktop.caption.md.size`, `responsive.desktop.caption.md.line-height-tight` | 10px / 10px. The row still writes 10px. Paragraph spacing is `not a token` |
| Chevron | `brand.scale.300` | 12px, Lucide `chevron-right` |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |
| Label, default | `mapped.text.action` | `#303132` |
| Label, hover | `mapped.text.action-hover` | `#1E3B58` |
| Label, selected | `mapped.text.action-selected` | `#1E3B58` |
| Label, disabled | `mapped.text.disabled` | `#909397` |
| Caption, default, hover, and selected | `mapped.text.caption` | `#606264` |
| Caption, disabled | `mapped.text.disabled` | `#909397` |
| Chevron, default, hover, and selected | `mapped.text.caption` | `#606264`. The icon layer did not return a fill of its own. It reads as the caption color |
| Chevron, disabled | `mapped.text.disabled` | `#909397` |

The component set is two columns and four rows. The columns are the sizes. The rows are the states. The fills were matched to the action surface tokens by eye. The file request was rate limited, and the inspect panel was behind the Figma sign-up wall.

Figma properties:

| Property | Kind | Values |
| --- | --- | --- |
| size | variant | `sm`, `md` |
| state | variant | `default`, `hover`, `selected`, `disabled` |
| Label | text | default `Label`. It sits in the layer named `container` |
| caption | text | default `caption` |
| chevron | slot | `icon/lucide/chevron-right`. Shown unless turned off |

The boolean names for hiding the caption and the chevron were not in the property panel.

Painted states: `default`, `hover`, `selected`, `disabled`, in both `sm` and `md`.

Not painted: focus. A leading icon is not in the painted rows.

## Font style menu

Figma node `165:2949`, on the contextual toolbar sheet. Ticket NB-42. Code `src/TextToolbar.tsx`, opened from the weight control. The frame is 104 by 120.

Four small menu items, caption and chevron off. The order is Regular, Bold, Italic, Bold Italic. The labels stay in Geist. They are not drawn in bold or italic.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 104px. TODO token mismatch: Figma 104px. The label is narrower, and the extra space sits to its right |
| Height | hug | 120px |
| Padding | `brand.scale.100` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | `mapped.border.default` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F0F5FB` at 80% |
| Shadow | not a token | the same shadow the other menus already use |
| Blur | not a token | the same blur the text toolbar already uses |
| Row | menu item, `sm` | `brand.scale.700`, 28px. Caption and chevron are off |

The file request was rate limited. Padding, radius, and the stroke were read from the canvas. The first row is painted with the hover fill, `#E5F0F9`. The toolbar above that frame shows Bold Italic, so that row is the hover example. The live menu marks the current weight with the selected fill.

The layer name above the frame was cut off. It starts with `toolbar/contextual`.

## Typeface menu

Figma node `168:3116`, on the contextual toolbar sheet. Ticket NB-43. Code `TypefaceMenu` in `src/TextToolbar.tsx`, opened from the typeface control. The frame is 128 by 148.

Five small menu items, caption and chevron off. The order is Geist Mono, Open Sans, Coming Soon, Noto Serif, Montserrat. Each label uses its `alias.typeface` token. The menu item body font stays Geist on every other menu.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 128px. TODO token mismatch: Figma 128px. The label is narrower, and the extra space sits to its right |
| Height | hug | 148px |
| Padding | `brand.scale.100` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | `mapped.border.default` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F0F5FB` at 80% |
| Shadow | not a token | the same shadow the other menus already use |
| Blur | not a token | the same blur the text toolbar already uses |
| Row | menu item, `sm` | `brand.scale.700`, 28px. Caption and chevron are off |
| Label, Geist Mono | `alias.typeface.geist-mono` | Geist Mono |
| Label, Open Sans | `alias.typeface.open-sans` | Open Sans |
| Label, Coming Soon | `alias.typeface.coming-soon` | Coming Soon |
| Label, Noto Serif | `alias.typeface.noto-serif` | Noto Serif |
| Label, Montserrat | `alias.typeface.montserrat` | Montserrat |
| Label size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 12px / 12px, text style `body/md/tight`. The row still writes 12px |
| Label, default | `mapped.text.action` | `#303132` |
| Label, hover | `mapped.text.action-hover` | `#1E3B58` |
| Label, selected | `mapped.text.action-selected` | `#1E3B58` |
| Label, disabled | `mapped.text.disabled` | `#909397` |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |

The file request was rate limited. Padding, radius, and the stroke were read from the canvas, beside the font style menu. The first row, Geist Mono, is painted with the hover fill, `#E5F0F9`. The live menu marks the current family with the selected fill.

The rows use the menu item properties: size `sm`, caption off, chevron off. The frame itself exposes no properties.

Painted: one resting frame. Geist Mono is the hover example. The other four rows are default.

Not painted on this frame: selected and disabled. Those states belong to the menu item. There is no focus state.

The layer name above the frame was cut off. It starts with `toolbar/contextual`.

## Font size menu

Figma node `212:4004`, on the contextual toolbar sheet. Ticket NB-44. Code `FontSizeField` in `src/TextToolbar.tsx`, opened from the size control. The frame is 44 by 344 hug.

Twelve small menu items, caption and chevron off. The order is 10, 12, 14, 16, 18, 24, 32, 36, 40, 48, 64, 72. Each row is a fixed `brand.scale.900` (36px) so the column does not change width with the digits. The labels stay in Geist.

| Piece | Token | Value |
| --- | --- | --- |
| Row width | `brand.scale.900` | 36px. The same width on every row |
| Width | `brand.scale.1100` | 44px hug. That is 4px padding, the 36px row, and 4px padding. The 1px stroke sits on that box |
| Height | hug | 344px |
| Padding | `brand.scale.100` | 4px |
| Gap | `brand.scale.0` | 0px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F0F5FB` at 80% |
| Shadow | not a token | the same shadow the other menus already use |
| Blur | not a token | the same blur the text toolbar already uses |
| Row | menu item, `sm` | `brand.scale.700`, 28px. Caption and chevron are off |
| Font | `alias.font-family.body` | Geist |
| Label size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 12px / 12px, text style `body/md/tight`. The row still writes 12px. Paragraph spacing is `not a token` |
| Label, default | `mapped.text.action` | `#303132` |
| Label, hover | `mapped.text.action-hover` | `#1E3B58` |
| Label, selected | `mapped.text.action-selected` | `#1E3B58` |
| Label, disabled | `mapped.text.disabled` | `#909397` |
| Fill, default and disabled | `mapped.surface.action` | `#E5F0F9` at 0% |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9` |
| Fill, selected | `mapped.surface.action-selected` | `#DBEAF8` |

There is no icon on this frame. Caption and chevron are off, so the menu item draws no caption color and no chevron.

The frame has no divider.

The rows use the menu item properties: size `sm`, caption off, chevron off, and a fixed width of `brand.scale.900`. The frame itself exposes no properties. A note on the sheet says each font size menu item is a fixed width of 36px.

Painted: one resting frame. 14 is filled, and the toolbar above shows 14, so that row is the current size. The live menu marks the current size with the selected fill.

Not painted on this frame: hover and disabled. Those states belong to the menu item. There is no focus state.

## Icon button

Figma `button/icon`, spec frame `button icon`, node `193:3525`. Ticket NB-46. Code `src/IconButton.tsx`. The trial page is `?trial=icon-button`.

A square button whose only content is an icon. It is not a contextual button with the label turned off. Large is 32px, medium is 28px, and small is 20px. The default type has four states. The destructive type has three.

| Piece | Token | Value |
| --- | --- | --- |
| Size, lg | `brand.scale.800` | 32px square |
| Size, md | `brand.scale.700` | 28px square |
| Size, sm | `brand.scale.500` | 20px square |
| Padding, lg | `brand.scale.200` | 8px, the space left by a 16px icon in the 32px square |
| Padding, md | `brand.scale.150` | 6px, the space left by a 16px icon in the 28px square |
| Padding, sm | `brand.scale.100` | 4px, the space left by a 12px icon in the 20px square |
| Corner radius, lg and md | `alias.border-radius.lg` | 8px |
| Corner radius, sm | `alias.border-radius.md` | 4px |
| Stroke | none | the button has no stroke |
| Icon, lg and md | `brand.scale.400` | 16px, Lucide |
| Icon, sm | `brand.scale.300` | 12px, Lucide |
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

The file request was rate limited, and the property panel was behind the Figma sign-up wall. Fills were matched to the action and error surface tokens by eye. The icon slot in the spec is the case-sensitive glyph.

Figma properties, read from the variant grid:

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

Figma `input/hex`, on the spec frame titled `input`. Ticket NB-47. Code `src/HexInput.tsx`. The trial page is `?trial=hex-input`.

A hex field for the color toolbar that comes later. It is not that toolbar. Two labels sit in the box. `#` is constant. The hex code is the value the user types or pastes.

| Piece | Token | Value |
| --- | --- | --- |
| Width | none | 108px fixed. No spacing token is 108px |
| Height | `brand.scale.700` | 28px hug |
| Padding | `brand.scale.200` | 8px |
| Gap | `brand.scale.100` | 4px between `#` and the hex code |
| Corner radius | `alias.border-radius.lg` | 8px |
| Font | `alias.font-family.body` | Geist |
| Type size | `responsive.desktop.body.md.size`, `responsive.desktop.body.md.line-height-tight` | 12px / 12px, text style `body/md/tight`. Paragraph spacing is `not a token` |
| Text, every state | `mapped.text.default` | `#303132`. The Figma text style is named `default` |
| Fill, default | none | the field has no fill |
| Fill, hover | `mapped.surface.action-hover` | `#E5F0F9`. The Figma style is `action-hover` |
| Fill, focus | `mapped.surface.default` | `#F0F5FB` at 80%. The Figma style is `default` |
| Stroke, default and hover | none | those variants have no stroke |
| Stroke, focus | `mapped.border.action-ring-focus`, `alias.border-width.sm` | `#4A94DB`, 2px, drawn outside the box. The Figma style is `action-ring-focus` |
| Shadow | not a token | excluded from the component |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no icon and no divider.

The file request was rate limited. Sizes, padding, gap, radius, fills, and the stroke were read from the Figma property panel on the component set.

Figma properties:

| Property | Kind | Values |
| --- | --- | --- |
| state | variant | `default`, `hover`, `focus` |

`#` and the hex code are text layers, not variant properties. `#` does not change. The hex layer is the editable value. The spec shows `EBCFFF`.

Painted states: `default`, `hover`, and `focus`.

Not painted: disabled, selected, and pressed.

This field is not a toolbar. The color toolbar that places it is its own component.

## Color swatch

Figma `color-swatch`, on the spec frame titled `color-swatch`, node `193:3525`. Ticket NB-48. Code `src/ColorSwatch.tsx`. The trial page is `?trial=color-swatch`.

A round color choice for the fill and stroke toolbar, and for the color picker that comes later. It is not that toolbar. The disc is 28px. The action ring sits outside it.

| Piece | Token | Value |
| --- | --- | --- |
| Size | `brand.scale.700` | 28px circle |
| Corner radius | not a token | a full circle. No radius token is fully round |
| Disc stroke | `mapped.border.control`, `alias.border-width.xsm` | `#C0C4C9`, 1px, drawn inside the disc on every type and state |
| None fill | `brand.foundation.white` | `#FFFFFF`. No mapped surface is white |
| Slash color | `mapped.icon.action` | `#303132` |
| Slash thickness | `alias.border-width.sm` | 2px |
| Slash length | `brand.scale.600` | 24px, rotated 45 degrees so the ends stay off the disc stroke |
| Color fill | `alias.swatch` | Fill and sticky notes use step 200. Stroke and noodles use step 500. The Figma specimen is `alias.swatch.purple.500`, `#BF66FF` |
| Custom wheel | not a token | Angular gradient. Stops, each at 100% opacity: 0% `#F43F5E`, 14% `#F59E0B`, 29% `#EAB308`, 43% `#22C55E`, 57% `#06B6D4`, 71% `#6366F1`, 86% `#D946EF`, 100% `#F43F5E`. None of these colors are tokens. 0% sits at the left, matching the stop handles on the frame |
| Custom white gap | `brand.foundation.white`, `brand.scale.50` | `#FFFFFF`, 2px. A `brand.scale.400` (16px) white circle around the preview |
| Custom preview | the picker color, `brand.scale.300` | 12px circle. The Figma specimen shows purple. That color is not an `alias.swatch`, and it does not follow the color type |
| Custom wheel thickness | `brand.scale.150` | 6px, the space from the disc edge to the white circle |
| Ring, default | none | the disc has no action ring |
| Ring, hover | `mapped.border.action-ring`, `alias.border-width.md` | `#B7D4F1`, 4px, drawn outside the disc. The Figma style is `action-ring`. The frame measures 3px |
| Ring, selected | `mapped.border.action-ring-focus`, `alias.border-width.md` | `#4A94DB`, 4px, drawn outside the disc. The Figma style on the frame is `action-ring-selected`. The swatch uses `action-ring-focus` |
| Shadow | not a token | Figma uses a drop shadow for the action ring. The code uses an outline stroke. The frame shadow is excluded |
| Blur | not a token | excluded from the component |
| Dot grid | not a token | excluded from the component |

There is no text and no divider. The slash is part of the none type, not a separate icon slot.

The file request was rate limited. Sizes and colors were read from the rendered frame at 400%. The property panel was behind the Figma sign-up wall.

Figma properties, read from the variant grid and the spec labels:

| Property | Kind | Values |
| --- | --- | --- |
| type | variant | `none`, `color`, `custom` |
| state | variant | `default`, `hover`, `selected` |

The fill is not a variant. The spec paints purple on the color type and on the custom preview. Those two paints are specimens. In the product they stay separate.

Color type reads `alias.swatch`, in token-file order: purple, sky, lime, orange, yellow, coral, tomato, pink. Fill and sticky notes use step 200. Stroke and noodles use step 500.

Custom can be selected. Its inner circle is whatever color the picker returns. The picker is react-colorful, and it is not built yet. Choosing a color swatch does not change the custom swatch. Choosing custom does not change a color swatch.

Painted states: `default`, `hover`, and `selected`, on `none`, `color`, and `custom`.

Not painted: focus, disabled, and pressed. Keyboard focus uses the hover ring at 4px so the swatch stays visible. That ring is not a Figma state.

This swatch is not a toolbar. The color toolbar that places it is its own component.
