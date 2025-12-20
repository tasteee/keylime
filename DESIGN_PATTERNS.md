# Keylime Design Patterns

## Color System

The application uses a neutral scale for most UI elements, defined in `src/app.css`.

- **Backgrounds**
  - App Background: `var(--n-00)` (#F8F9FC) - Used for the main page background.
  - Panel Background: `var(--n-01)` (#F2F3F6) - Used for sidebars or secondary panels.
  - Card Background: `var(--colorWhite)` (#ffffff) - Used for cards and elevated surfaces.
  - Element Background: `var(--n-01)` (#F2F3F6) - Used for inputs or internal card elements.

- **Borders**
  - Subtle: `var(--n-02)` (#E2E5E9)
  - Standard: `var(--n-03)` (#D1D5DB) - Used for most component borders.
  - Hover: `var(--n-04)` (#9DA3AE)

- **Text**
  - Headings: `var(--n-10)` (#030813)
  - Primary: `var(--n-09)` (#111927)
  - Secondary: `var(--n-06)` (#4D5562)
  - Tertiary: `var(--n-05)` (#6C7381)

## Component Patterns

### 1. Toolbar Pattern
Used in `ChordCardGrid`, `PatternEditor`, `ProgressionPanel`.

- **Height**: `54px` (standard) or `48px` (compact).
- **Padding**: `0 24px`.
- **Background**: `var(--color-panel-bg)` or `var(--n-01)`.
- **Border**: Bottom border `1px solid var(--n-03)`.
- **Layout**: Flexbox, `align-items: center`, `justify-content: space-between` (or gap).
- **Typography**: Title uses `herPanelTitle` class (or similar weight/size).

### 2. Card Pattern
Used for `ChordCard`, Projects, Users.

- **Background**: `var(--colorWhite)` (or `var(--n-01)` in some contexts).
- **Border**: `1px solid var(--n-03)`.
- **Border Radius**: `8px` (implied, or standard radius).
- **Hover Effect**:
  - Background change to `var(--colorWhite)` (if starting darker).
  - Transform `translateY(-2px)` or similar.
  - Shadow increase.
- **Content**:
  - Clear hierarchy: Title, Description, Meta tags.
  - Actions often hidden until hover (e.g., `ChordCard` actions).

### 3. Page Layout
- **Background**: `var(--n-00)`.
- **Header**: `TopBar` component (Sticky, 64px height, backdrop blur).
- **Content**:
  - Max-width container (e.g., 1200px) or fluid with padding.
  - Padding: `24px` or `40px`.

### 4. Typography
- **Font Family**: `Geologica`, `Plus Jakarta Sans`, system fonts.
- **Titles**: Bold, dark (`--n-10`).
- **Body**: Regular, `--n-07` or `--n-06`.

## UX Guidelines
- **Consistency**: Use the defined CSS variables for all colors.
- **Feedback**: Ensure hover states are present for all interactive elements.
- **Whitespace**: Use generous padding (16px, 24px, 32px) to create breathing room.
- **Simplicity**: Avoid clutter. Use "ghost" buttons for secondary actions.
