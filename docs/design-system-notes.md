# Design system notes

A running list of what each built piece taught us, so Figma and the token file can be updated from one place.

When a component, toolbar, dropdown, or popover is built, its section is added here. Each section names the Figma component, the node id, the ticket, and the code path. It has its own token table. It lists the Figma properties and their values, and it says which states are painted.

Shadow, blur, and the dot grid are left out of the token build. In the table they are marked `not a token`. They are not mismatches. Font size and line height use the responsive desktop tokens when those tokens exist. On this branch they are still 0, so a size taken from the Figma text style is not a mismatch. Paragraph spacing is not in the export, so it stays `not a token`.

## Still to update

- **[token app] Small row height.** Size `sm` is 28px. No spacing token is 28px. The code keeps 28px and marks the mismatch. Add a spacing token if small rows should stop using a raw size.
- **[Figma] Caption and chevron switches.** The layers are `caption` and `icon/lucide/chevron-right`. The property panel was not readable, so the boolean names are not confirmed. The code hides each slot.
- **[Figma] Text styles.** The label is drawn as `body/md/tight` (12px). The caption is drawn smaller (10px). The file did not return the text style names.

## Decisions already made

- The spec sheet around a component (state names, the red height notes, the purple dashed frame, the title, and the description) is documentation. It is not part of the component.
- Shadow, blur, and the dot grid are `not a token`. This row has none of them.
- Responsive type tokens are still 0. A size taken from the Figma text style is not a mismatch. Paragraph spacing is not in the export.
- Icons are Lucide. The chevron is `chevron-right`, 12px. Figma’s own icon component is not imported.
- The menu item has no focus state. The painted set is default, hover, selected, and disabled.

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
| Label size | none | 12px / line height 1em, text style `body/md/tight`. Responsive type tokens are still 0 |
| Caption size | none | 10px / line height 1em. Responsive type tokens are still 0. Paragraph spacing is `not a token` |
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
