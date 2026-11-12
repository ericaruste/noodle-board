# Design system notes

A running list of what each built piece taught us, so Figma and the token file can be updated from one place.

When a component, toolbar, dropdown, or popover is built, its section is added here. Each section names the Figma frame, the tokens it uses, and what still needs a change in Figma or the token app.

## Still to update

- **Focus on the contextual button.** The description names focus. The frame does not paint a focus ring. The token `mapped.border.action-ring-focus` (`#4A94DB`) exists, and the button does not use it. Add a painted focus variant, or take “focus” out of the description.
- **Resting fill is invisible.** `mapped.surface.action` is `#E5F0F9` at 0%. The default button has no fill. Confirm that is the resting state on purpose.
- **Type size is not a token yet.** The button uses the Figma text style `body/md/tight`: 12px, line height 1em. Responsive type tokens are still 0, so this size is kept as drawn. When type tokens are filled in, point this style at a real token.
- **Toolbar frost is not the token.** `mapped.surface.default` is `#F0F5FB` at 30%, with no blur. The text toolbar and the align popover use that color at the board’s existing frost: 40% opacity, a 24px blur, and the existing shadow. Figma’s blur is 2.6px, and Figma’s shadow is not used. Leave the token at 30%. Do not raise it to 100% to fix hover — a solid fill would remove the frost. At 30% with no blur, the button hover (`#E5F0F9`) does not read when the bar sits over other elements. The 40% frost is what makes hover readable. Frost, blur, and shadow stay out of the token file until effects are planned.
- **Weight label width.** The weight control is held to the width of the words “Bold Italic”, so Regular, Bold, Italic, and Bold Italic do not resize the toolbar. The Figma component may still hug the label. Give that control a minimum width if the bar should stay still.
- **Underline and strikethrough.** They are drawn on `toolbar/contextual/text` and are not in the app. They wait for the text feature. Leave them in Figma.
- **Font, size, and weight menus are still the old menus.** Only the alignment popover is built from the contextual button. Those three menus still use the Phase 1 rows. They need their own Figma frames, then the same build.
- **Icons are Lucide.** The spec shows a case-sensitive icon and a chevron. The app draws those with Lucide, 16px for the main icon and 8px for the chevron. Figma’s own icon components are not imported.

## Decisions already made

- Heading, body, and caption are Geist. SF Pro is gone from the token export.
- The spec sheet around a component (state names, the red “32px” note, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.
- Figma effects (blur, shadow) do not apply until they are planned. Toolbars keep the board’s existing frost.
- A selection that mixes two values (two alignments, two weights) is not a painted variant. The control stays in the default look.

## Contextual button

Figma `button/contextual`, node `193:3525`. Ticket NB-38. Code `src/ContextualButton.tsx`. The trial page is `?trial=contextual-button`.

| Piece | Token | Value |
| --- | --- | --- |
| Height | `brand.scale.700` | 32px |
| Padding | `brand.scale.200` | 8px |
| Gap | `brand.scale.100` | 4px |
| Corner radius | `alias.border-radius.lg` | 8px |
| Font | `alias.font-family.body` | Geist |
| Type size | none yet | 12px / 1em, text style `body/md/tight` |
| Icon | `brand.scale.400` | 16px |
| Chevron | `brand.scale.200` | 8px |
| Default fill | `mapped.surface.action` | `#E5F0F9` at 0% |
| Hover fill | `mapped.surface.action-hover` | `#E5F0F9` |
| Selected fill | `mapped.surface.action-selected` | `#DBEAF8` |
| Disabled fill | `mapped.surface.action` | same as default |
| Text and icon, default | `mapped.text.action`, `mapped.icon.action` | `#303132` |
| Text and icon, hover and selected | `mapped.text.action-hover`, `mapped.icon.action-hover`, and the selected pair | `#1E3B58` |
| Disabled text and icon | `mapped.text.disabled`, `mapped.icon.disabled` | cool neutral 700 |

Slots that can be turned off: label, left icon, right icon, dropdown chevron.

Painted variants: default, hover, selected, disabled.

This button is not a toolbar. A toolbar that places it is its own component.

## Text toolbar

Figma `toolbar/contextual/text`, node `165:2947`. Ticket NB-39. Code `src/TextToolbar.tsx`.

Every control is a contextual button with the unused slots turned off.

- First group: font, size, weight, alignment. A divider sits on the right of the group.
- Second group: bulleted list, numbered list, link. Icon only.
- Size keeps the typed number in the label slot. The chevron opens the presets.
- The weight label reserves the width of “Bold Italic”.

| Piece | Token | Value |
| --- | --- | --- |
| Padding | `brand.scale.100` | 4px |
| Gap inside a group | `brand.scale.50` | 2px |
| Gap between groups | `brand.scale.100` | 4px |
| Corner radius | `alias.border-radius.xl` | 12px |
| Stroke | `mapped.border.default`, `alias.border-width.xsm` | `#D8DCE2`, 1px |
| Fill color | `mapped.surface.default` | `#F0F5FB` |
| Opacity and blur | not a token | 40% and a 24px blur, the existing frost |
| Shadow | not a token | the existing shadow |

Underline and strikethrough are in the Figma group and left out on purpose.

The font, size, and weight menus are still the Phase 1 menus. The alignment control opens the popover below.

## Text align popover

Figma `toolbar/contextual/text/pop-over/text-align`, node `165:2948`. Ticket NB-40.

The frame is 142 by 40. That is padding 4, four 32px buttons, and 2px gaps. Four contextual buttons, icon only: left, center, right, and justify. The current alignment is the selected button.

The surface, stroke, radius, and frost match the text toolbar. The popover opens above a selected element and above an element while it is dragged.
