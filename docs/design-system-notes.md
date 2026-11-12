# Design system notes

A running list of what each built piece taught us, so Figma and the token file can be updated from one place.

When a component, toolbar, dropdown, or popover is built, its section is added here. Each section names the Figma component, the node id, the ticket, and the code path. It has its own token table. It lists the Figma properties and their values, and it says which states are painted.

Shadow, blur, the dot grid, and type size are left out of the token build. In the table they are marked `not a token`. They are not mismatches.

## Still to update

- **[Figma] Resting fill is invisible.** `mapped.surface.action` is `#E5F0F9` at 0%. The default button has no fill. Confirm that is the resting state on purpose.
- **[token app] Type size is not a token yet.** The button uses the Figma text style `body/md/tight`: 12px, line height 1em. Responsive type tokens are still 0, so this size is kept as drawn and marked `not a token`. When type tokens are filled in, point this style at a real token.
- **[Figma] Weight label width.** The weight control is held to the width of the words “Bold Italic”, so Regular, Bold, Italic, and Bold Italic do not resize the toolbar. The Figma component may still hug the label. Give that control a minimum width if the bar should stay still.
- **[code] Underline and strikethrough.** They are drawn on `toolbar/contextual/text` and are not in the app. They wait for the text feature. Leave them in Figma.
- **[Figma] Font, size, and weight menus are still the old menus.** Only the alignment popover is built from the contextual button. Those three menus still use the Phase 1 rows. They need their own Figma frames, then the same build.

## Decisions already made

- Heading, body, and caption are Geist. SF Pro is gone from the token export. The Figma text style `body/md/tight` still names SF Pro.
- The spec sheet around a component (state names, the red “32px” note, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.
- Shadow, blur, and the dot grid are `not a token`. Figma effects do not apply until they are planned.
- `mapped.surface.default` in `tokens.json` is `#F0F5FB` at 40%. The text toolbar and the align popover use that fill with the existing 24px blur and the existing shadow, the same frost as the rest of the board. Figma’s 2.6px blur is ignored. The fill stays at 40% so the frost remains.
- Type size, line height, and paragraph spacing are `not a token` until responsive type tokens exist.
- A selection that mixes two values (two alignments, two weights) is not a painted variant. The control stays in the default look.
- Icons are Lucide. The spec shows a case-sensitive icon and a chevron. The app draws those with Lucide, 16px for the main icon and 8px for the chevron. Figma’s own icon components are not imported.
- The contextual button has no focus state. The description that names focus was a mistake. Do not paint a focus ring, and do not use `mapped.border.action-ring-focus` on this button.

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
| Type size | not a token | 12px / 1em, text style `body/md/tight` |
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
- Size keeps the typed number in the label slot. The chevron opens the presets.
- The weight label reserves the width of “Bold Italic”.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | hug. 4px padding and a 32px button make 40px |
| Padding | `brand.scale.100` | 4px |
| Gap inside a group | `brand.scale.50` | 2px |
| Gap between groups | `brand.scale.100` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill | `mapped.surface.default` | `#F0F5FB` at 40% |
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
| Type size on the labels | not a token | 12px / 1em, text style `body/md/tight` |

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

The font, size, and weight menus are still the Phase 1 menus. The alignment control opens the popover below.

## Text align popover

Figma `toolbar/contextual/text/pop-over/text-align`, node `165:2948`. Ticket NB-40. Code `AlignPopover` in `src/TextToolbar.tsx`.

The frame is 142 by 40. That is padding 4, four 32px buttons, and 2px gaps. Four contextual buttons, icon only: left, center, right, and justify. The current alignment is the selected button. The popover opens above a selected element and above an element while it is dragged. This frame has no divider.

| Piece | Token | Value |
| --- | --- | --- |
| Height | none | 40px, from 4px padding and a 32px button |
| Width | none | 142px, from the padding, four buttons, and the gaps |
| Padding | `brand.scale.100` | 4px |
| Gap | `brand.scale.50` | 2px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px, outside the 142 by 40 box |
| Fill | `mapped.surface.default` | `#F0F5FB` at 40% |
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
