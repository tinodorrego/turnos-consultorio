# Design

Visual world: **pharmacy wall calendar** (almanaque de farmacia), the kind Argentine pharmacies give away and people hang in the kitchen. The page *is* the calendar sheet: the month is the booking widget.

## Tokens (`src/app/globals.css`)

| Token | Value | Use |
|---|---|---|
| `farmacia` / `-oscuro` / `-claro` | `#0a6447` / `#064833` / `#d9efe5` | Wall behind the sheet, sponsor band, primary confirm button |
| `amarillo` | `#ffd23f` | Rule under the sponsor band, "add to calendar" button, current step |
| `hoja` | `#ffffff` | Calendar sheet and cards |
| `tinta` / `tinta-2` | `#15181d` / `#4a515c` | Text |
| `gris` | `#868d98` | Days without availability (3.35:1, large numerals) |
| `regla` | `#e3e6ea` | Grid rules and inactive borders |
| `rojo` | `#cf2a1f` | Sundays, holidays, cancel and errors |
| `birome` | `#1f47c8` | "Today" ballpoint circle, rubber stamp, focus ring |
| `kine` / `nutri` / `psico` | `#b84a08` / `#0b7d87` / `#6440d0` | Specialty colour: selected tab, selected day, slots, headline accent (white on each ≥ 4.89:1) |

## Type

Archivo (variable, `wdth` axis). Display uses `.condensada` (`font-stretch: 68%`), black weight, uppercase: the printed-calendar voice for numerals, month names and headings. Body uses Archivo at normal width.

## Components

- **Sheet (`Hoja`):** white sheet on the green wall, real soft shadow, a rivet at the top.
- **Sponsor band:** practice name in condensed caps, specialties, address and phone; yellow rule below.
- **Month grid:** 7 columns Monday to Sunday; numerals 3xl (mobile) to 5xl; available days show a specialty-coloured dot and "N libres"; the selected day fills with the specialty colour; closed days read "Cerrado" or "Feriado" (never colour alone).
- **Stub (`#talon`):** separated by a dashed perforation with semicircular notches; slides in when a day is chosen; slots are 48px-tall outlined buttons grouped under a compact professional identity (initials disc, name, licence).
- **Booking summary:** specialty-coloured block with the time at display size.
- **Appointment card:** coloured top strip, ruled header, `dl` of details, and the rubber stamp.

## Signature move

The **rubber stamp** on the appointment card: scale 1.9 → 0.94 → 1, rotation −14° → −9°, blur 2px → 0, then ink settles at 0.92 opacity (620 ms, 350 ms delay). It turns red with "Cancelado" when the appointment is cancelled. The stub also slides in (360 ms). Both are static under `prefers-reduced-motion`.

## Panel

Same world, quieter: sponsor band, date heading in condensed caps, a light-grey indicator block with per-specialty occupancy bars, and one column per professional headed by their specialty colour.
