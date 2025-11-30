# VLC-Based Media Player - Design Guidelines

## Platform Context
**Native Android APK** for FireStick 4K/Android TV (primary) and mobile (secondary). Supports D-pad navigation and touch. Follows Material Design for Android and Android TV Guidelines.

---

## Core Architecture

### Authentication
- **No login required** (local-first player)
- **Trakt.tv**: OAuth2 PIN flow from Settings
  - Display 6-digit PIN (48sp font)
  - Instruction: "Visit trakt.tv/activate"
  - Poll every 5s, show "Connected as [username]" on success
  - Include "Disconnect" with confirmation
- **Settings include**: Skip preferences, Trakt status, Debrid API keys, playback defaults

### Navigation
**Stack-only** (no tabs/drawer):
1. **Player Screen** (root) - Full-screen playback
2. **Settings Screen** (modal) - Via gear icon
3. **Skip Configuration Screen** (nested modal) - Manual skip times

**TV Navigation**: 
- All elements focusable with D-pad highlight
- Back: Settings → Player → Exit (confirm)
- Launches directly to Player from Stremio

---

## Screen Specifications

### 1. Player Screen
**Full-screen VLC player** with custom overlays:

**Overlays**:
- **Time Display** (top-right, always visible with controls):
  - Format: "7:45 PM • Ends at 10:30 PM"
  - 16sp, white text, semi-transparent dark background
  - Updates real-time with playback speed adjustment
  - Position: 24dp from top + insets.top, 24dp from right

- **Skip Button** (bottom-center, contextual):
  - Label: "Skip Intro (45s)" or "Skip Credits (1:30)"
  - White background (#FFFFFF), black text (#000000), 8dp radius
  - 18sp Bold, padding: 12dp horizontal, 8dp vertical
  - Animation: Slide up (300ms ease-out) + scale (0.8x→1.0x)
  - Position: 80dp from bottom + insets.bottom, centered
  - Auto-hide: 3s before skip segment ends
  - TV: Gold focus border (#FFD700, 2dp stroke)

- **VLC Controls** (bottom, native):
  - Keep standard VLC layout unchanged
  - Gear icon opens Settings
  - TV: Focus indicator on each control

**Safe Areas**: Respect insets.top/bottom for status/nav bars

---

### 2. Settings Screen
**Modal overlay** (dark background #000000 at 80% opacity):

**Header**:
- Title: "Settings"
- Back arrow (left), semi-transparent dark bar

**Sections** (scrollable):

**Skip Detection**:
- Toggle: Chapter-Based Skip (ON)
- Toggle: Audio Fingerprint Skip (ON)
- Toggle: Manual Skip Markers (ON)
- Toggle: Auto-Skip (OFF)
- Button: "Configure Manual Skips"

**Playback**:
- Picker: Speed (0.5x-2.0x, default 1.0x)
- Toggle: Skip fade time (500ms)

**Integrations**:
- **Trakt**: Status + Connect/Disconnect button
- **Debrid**: Service dropdown, API key input (password), Test button

**Visual**:
- Section headers: 14sp uppercase, accent color
- Rows: 48dp height, white text (16sp label, 14sp value)
- Toggles: Material switch (accent when ON)
- TV: Yellow focus outline (#FFD700)
- Padding: 24dp horizontal, 16dp + insets vertical

---

### 3. Skip Configuration Screen
**Nested modal** for manual skip times:

**Header**: Title "Manual Skip Times" + Back + Save

**Content**:
- Episode ID: "Show Name - S01E05" (read-only)
- Input: "Intro Skip (seconds from start)" - numeric, placeholder "120"
- Input: "Credits Skip (seconds from end)" - numeric, placeholder "300"
  - Helper: "Skips last 5:00 of video" (12sp, #888888)

**Style**:
- Inputs: 56dp height, outlined, white text
- Save: Accent color, disabled if empty
- Storage: `manual_skip_{imdbId}_s{season}e{episode}`

**TV Input**: Number picker overlay with D-pad

---

## Design System

### Colors (Dark Theme)
- **Background**: #000000 (OLED optimized)
- **Surface**: #1C1C1C
- **Accent**: #E50914 (Netflix red)
- **Text**: #FFFFFF
- **Disabled**: #888888
- **TV Focus**: #FFD700 (gold, 2dp stroke)

### Typography (Roboto)
- Time Display: 16sp Medium
- Skip Button: 18sp Bold
- Section Headers: 14sp Medium UPPERCASE
- Settings Label: 16sp Regular
- Settings Value: 14sp Regular
- Helper Text: 12sp Regular
- **TV**: +2sp to all sizes

### Icons
Material Icons (24dp): `settings`, `arrow_back`, Material switch component

### TV-Specific
- **Focusable**: `android:focusable="true"` on all interactive elements
- **Focus order**: Define via `android:nextFocus[Up/Down/Left/Right]`
- **Visual**: Gold border + 1.05x scale on focus
- **Initial focus**: Skip button (if visible), else play/pause
- **Min touch target**: 48dp mobile, 64dp TV

---

## Interaction Patterns

### Skip Button Flow
1. **Detection**:
   - Chapter: Immediate activation
   - Audio fingerprint: 5s into segment
   - Manual: At user timestamp

2. **Interaction**:
   - Mobile: Tap to skip
   - TV: OK button when focused
   - Auto-skip mode: "Auto-skip in 3...2...1"

3. **Dismissal**: Slide down 3s before end, or manual (swipe/Back)

### Settings
- Mobile: Tap to edit, swipe to dismiss
- TV: D-pad navigate, OK toggle, Back dismiss

### VLC Integration
- **Preserve native controls** - overlay custom elements above (z-index)
- Ensure skip button doesn't obstruct seek bar

---

## Accessibility

- **Focus indicators**: 3:1 contrast ratio minimum
- **Content descriptions**:
  - Skip: "Skip intro, 45 seconds remaining"
  - Settings: "Open settings"
  - Back: "Go back"
- **Keyboard support**: Tab navigation, Enter activation
- **TalkBack**: Announce time changes (mobile)

---

## Success Criteria
- ✅ Skip button shows correct label on all platforms
- ✅ TV focus navigation (no dead zones)
- ✅ Time display updates with playback speed
- ✅ Settings persist (AsyncStorage)
- ✅ Trakt PIN visible from 10 feet
- ✅ Manual skips stored per-episode
- ✅ Text readable from 10-foot distance

**Token Budget**: ~1,950 tokens