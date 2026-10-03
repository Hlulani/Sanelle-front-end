# Contrast record: Sanelle visual slice

Measured with the WCAG 2.x relative-luminance formula for every colour pairing used on Welcome, Today and Food Clarity. Text needs 4.5:1 (3:1 for large text); controls, borders and focus indicators need 3:1.

| Kind | Where | Foreground | Background | Ratio | Needs | Result |
|---|---|---|---|---|---|---|
| Text | Body and headings | `#2a1a20` | `#fbf5ef` | 15.32:1 | 4.5:1 | Pass |
| Text | Body and headings on cards | `#2a1a20` | `#ffffff` | 16.57:1 | 4.5:1 | Pass |
| Text | Secondary text (dates, sources, hints) | `#6b5560` | `#fbf5ef` | 6.27:1 | 4.5:1 | Pass |
| Text | Secondary text on cards | `#6b5560` | `#ffffff` | 6.79:1 | 4.5:1 | Pass |
| Text | Topic claim on blush panel | `#6b5560` | `#f6e1e3` | 5.43:1 | 4.5:1 | Pass |
| Text | Topic question on blush panel | `#74203f` | `#f6e1e3` | 8.31:1 | 4.5:1 | Pass |
| Text | Text on berry (headers, answer panel) | `#fff6f0` | `#74203f` | 9.74:1 | 4.5:1 | Pass |
| Text | Secondary text on berry | `#f0d6dd` | `#74203f` | 7.60:1 | 4.5:1 | Pass |
| Text | Fine print on deep berry | `#f0d6dd` | `#561530` | 9.94:1 | 4.5:1 | Pass |
| Text | "Short answer" label on berry | `#f2b37e` | `#74203f` | 5.70:1 | 4.5:1 | Pass |
| Text | Appointment line, links | `#74203f` | `#ffffff` | 10.39:1 | 4.5:1 | Pass |
| Text | Source links | `#74203f` | `#fbf5ef` | 9.60:1 | 4.5:1 | Pass |
| Status | Present (documented value) | `#1e5f63` | `#ffffff` | 7.31:1 | 4.5:1 | Pass |
| Status | Explicitly absent | `#34497a` | `#ffffff` | 8.82:1 | 4.5:1 | Pass |
| Status | Not recorded / no studies found | `#6b5560` | `#ffffff` | 6.79:1 | 4.5:1 | Pass |
| Status | Mixed results / user reported | `#8a5a12` | `#ffffff` | 5.91:1 | 4.5:1 | Pass |
| Status | Draft marker and banner | `#8a5a12` | `#ffffff` | 5.91:1 | 4.5:1 | Pass |
| Status | Draft marker on blush panel | `#8a5a12` | `#f6e1e3` | 4.73:1 | 4.5:1 | Pass |
| Status | Error message | `#a1262b` | `#ffffff` | 7.43:1 | 4.5:1 | Pass |
| Control | Primary button | `#fff6f0` | `#74203f` | 9.74:1 | 4.5:1 | Pass |
| Control | Primary button, pressed | `#fff6f0` | `#561530` | 12.74:1 | 4.5:1 | Pass |
| Control | Apricot button | `#2a1a20` | `#f2b37e` | 9.10:1 | 4.5:1 | Pass |
| Control | Apricot button, pressed | `#2a1a20` | `#e89c5f` | 7.38:1 | 4.5:1 | Pass |
| Control | Outline button on deep berry | `#fff6f0` | `#561530` | 12.74:1 | 4.5:1 | Pass |
| Control | Saved state | `#74203f` | `#f6e1e3` | 8.31:1 | 4.5:1 | Pass |
| Control | Disabled button text | `#6b5560` | `#e6d8d4` | 4.89:1 | 4.5:1 | Pass |
| Control | Tab bar label, unselected | `#f0d6dd` | `#74203f` | 7.60:1 | 4.5:1 | Pass |
| Control | Tab bar label, selected | `#f2b37e` | `#74203f` | 5.70:1 | 4.5:1 | Pass |
| Text | Draft tag on berry header | `#f2b37e` | `#74203f` | 5.70:1 | 4.5:1 | Pass |
| Text | "Short answer" label on apricot | `#2a1a20` | `#f2b37e` | 9.10:1 | 4.5:1 | Pass |
| Non-text | Outline button border on deep berry | `#f0d6dd` | `#561530` | 9.94:1 | 3:1 | Pass |
| Non-text | Focus ring on light surfaces | `#2a1a20` | `#fbf5ef` | 15.32:1 | 3:1 | Pass |
| Non-text | Focus ring on apricot button over berry | `#fff6f0` | `#561530` | 12.74:1 | 3:1 | Pass |
| Non-text | Focus ring on outline button | `#f2b37e` | `#561530` | 7.46:1 | 3:1 | Pass |
| Non-text | Error border | `#a1262b` | `#ffffff` | 7.43:1 | 3:1 | Pass |

Rendered screens were also audited automatically (19 states at 390px and 320px, with 125% text): every visible text element met its threshold against its actual background, every button and link was at least 44 x 44px (inline source links excepted), and no screen scrolled horizontally.

Recipe tiles carry no text, so they aren't in this table.
