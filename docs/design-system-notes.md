# Design system notes

A running list of what each built piece taught us, so Figma and the token file can be updated from one place.

When a component, toolbar, dropdown, or popover is built, its section is added here. Each section names the Figma component, the node id, the ticket, and the code path. It has its own token table. It lists the Figma properties and their values, and it says which states are painted.

Shadow, blur, and the dot grid are left out of the token build. In the table they are marked `not a token`. They are not mismatches. Font size and line height use the responsive desktop tokens. Paragraph spacing is not in the export, so it stays `not a token`.

## Still to update

- **[Figma] Resting fill is invisible.** `mapped.surface.action` is `#E5F0F9` at 0%. The default button has no fill. Confirm that is the resting state on purpose.
- **[Figma] Weight label width.** The weight control is held to the width of the words “Bold Italic”, so Regular, Bold, Italic, and Bold Italic do not resize the toolbar. The Figma component may still hug the label. Give that control a minimum width if the bar should stay still.
- **[code] Underline and strikethrough.** They are drawn on `toolbar/contextual/text` and are not in the app. They wait for the text feature. Leave them in Figma.
- **[Figma] Font size menu is still the old rows.** Alignment is the popover. Weight is the font style menu. Typeface is the typeface menu. The size list still uses the Phase 1 rows.
- **[token app] Small row height.** Size `sm` is 28px. No spacing token is 28px. The code keeps 28px and marks the mismatch. Add a spacing token if small rows should stop using a raw size.
- **[Figma] Caption and chevron switches.** The layers are `caption` and `icon/lucide/chevron-right`. The property panel was not readable, so the boolean names are not confirmed. The code hides each slot.
- **[Figma] Font style menu width.** The frame is 104px wide. No spacing token is 104px. The code keeps 104px and marks the mismatch.

## Decisions already made

- Heading, body, and caption are Geist. SF Pro is gone from the token export. The Figma text style `body/md/tight` still names SF Pro.
- The spec sheet around a component (state names, the red height notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.
- Shadow, blur, and the dot grid are `not a token`. Figma effects do not apply until they are planned.
- `mapped.surface.default` in `tokens.json` is `#F0F5FB` at 80%. The text toolbar, the align popover, the font style menu, and the typeface menu use that fill with the existing 24px blur and the existing shadow, the same frost as the rest of the board. Figma’s 2.6px blur is ignored.
- Desktop font size and line height are tokens under `responsive.desktop`. The text style `body/md/tight` is `responsive.desktop.body.md.size` (12px) and `responsive.desktop.body.md.line-height-tight` (12px). The caption size is `responsive.desktop.caption.md.size` (10px) and `responsive.desktop.caption.md.line-height-tight` (10px). Paragraph spacing is not in the export, so it stays `not a token`.
- The spacing scale includes `brand.scale.800` (36px), `brand.scale.900` (40px), `brand.scale.1000` (44px), and `brand.scale.1100` (48px). 36px was inserted after 32px (`brand.scale.700`), so 40px moved from `brand.scale.800` to `brand.scale.900`, 44px moved to `brand.scale.1000`, and 48px moved to `brand.scale.1100`.
- A selection that mixes two values (two alignments, two weights) is not a painted variant. The control stays in the default look.
- Icons are Lucide. The spec shows a case-sensitive icon and a chevron. The app draws those with Lucide, 16px for the main icon and 8px for the chevron. The menu item chevron is `chevron-right` at 12px. Figma’s own icon components are not imported.
- The contextual button has no focus state. The description that names focus was a mistake. Do not paint a focus ring, and do not use `mapped.border.action-ring-focus` on this button. The menu item has no focus state either. Its painted set is default, hover, selected, and disabled.
- The font size button opens its preset menu on a single click of the number or the chevron. A double click edits the number.
- The typeface menu lists the `alias.typeface` collection, in that order: Geist Mono, Open Sans, Coming Soon, Noto Serif, Montserrat. Each label is drawn in its own `alias.typeface` token. Other menus keep Geist.

## Contextual button

Figma `button/contextual`, node `193:3525`. Ticket NB-38. Code `src/ContextualButton.tsx`. The trial page is `?trial=contextual-button`.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.700` | 32px |
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
| Height | none | hug. 4px padding and a 32px button make 40px, which is `brand.scale.900` |
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

The typeface control opens the typeface menu. The font size list still uses the Phase 1 rows. The weight control opens the font style menu. The alignment control opens the popover below.

## Text align popover

Figma `toolbar/contextual/text/pop-over/text-align`, node `165:2948`. Ticket NB-40. Code `AlignPopover` in `src/TextToolbar.tsx`.

The frame is 142 by 40. That is padding 4, four 32px buttons, and 2px gaps. Four contextual buttons, icon only: left, center, right, and justify. The current alignment is the selected button. The popover opens above a selected element and above an element while it is dragged. This frame has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px (`brand.scale.900`), from 4px padding and a 32px button |
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
| Height, md | `brand.scale.700` | 32px |
| Height, sm | none | 28px. TODO token mismatch: Figma 28px |
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
| Row | menu item, `sm` | 28px. Caption and chevron are off |

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
| Row | menu item, `sm` | 28px. Caption and chevron are off |
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
