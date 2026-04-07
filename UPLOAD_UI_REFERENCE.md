# Upload Feature - Visual UI/UX Reference

## 📱 Page Layout Overview

### Desktop View (1024px+)
```
┌─────────────────────────────────────────────────────────────────┐
│                                                                   │
│                   Voice Analysis Portal                           │
│          Choose your preferred method to analyze voice            │
│                                                                   │
│     ┌──────────────────┐        ┌──────────────────┐            │
│     │ 🎙️ Record Voice  │        │ 📁 Upload Record │            │
│     │    (ACTIVE)      │        │      ing         │            │
│     └──────────────────┘        └──────────────────┘            │
│                                                                   │
│  ┌────────────────────────────┐  ┌────────────────────────────┐ │
│  │   Record New Voice         │  │   Upload Voice Recording   │ │
│  │   Sample                   │  │                            │ │
│  │                            │  │                            │ │
│  │ ┌──────────────────────┐   │  │ ┌──────────────────────┐   │ │
│  │ │      🎤              │   │  │ │    DRAG & DROP       │   │ │
│  │ │   Ready to record    │   │  │ │   📁 Drop here 📁    │   │ │
│  │ │                      │   │  │ │                      │   │ │
│  │ └──────────────────────┘   │  │ │ or click to browse   │   │ │
│  │                            │  │ │                      │   │ │
│  │ ┌──────────────────────┐   │  │ │ WAV, MP3, WebM, ...  │   │ │
│  │ │ 🎙️ Start Recording  │   │  │ │ Max: 50MB            │   │ │
│  │ └──────────────────────┘   │  │ └──────────────────────┘   │ │
│  │                            │  │                            │ │
│  │ 📋 Recording Guidelines:   │  │ 📋 Upload Tips:            │ │
│  │ ✓ Quiet environment        │  │ ✓ High-quality audio       │ │
│  │ ✓ Normal volume            │  │ ✓ Clear speech             │ │
│  │ ✓ 10-60 seconds            │  │ ✓ No background noise      │ │
│  │ ✓ Good microphone          │  │ ✓ Supported: 7 formats    │ │
│  └────────────────────────────┘  └────────────────────────────┘ │
│                                                                   │
│                ┌──────────────────────────────┐                  │
│                │ 🔍 Analyze Voice Sample      │                  │
│                └──────────────────────────────┘                  │
│                                                                   │
│   ┌──────────┐       ┌──────────┐        ┌──────────┐           │
│   │   🎯     │       │   🔒     │        │   📊     │           │
│   │ Accurate │       │  Secure  │        │ Detailed │           │
│   │ Analysis │       │ & Private│        │ Results  │           │
│   └──────────┘       └──────────┘        └──────────┘           │
│                                                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Mobile View (<1024px)
```
┌──────────────────────────┐
│ Voice Analysis Portal     │
│ Choose your method        │
├──────────────────────────┤
│ 🎙️ Record Voice          │
│ 📁 Upload Recording       │
├──────────────────────────┤
│ Record New Voice Sample   │
│                          │
│ ┌──────────────────────┐ │
│ │      🎤              │ │
│ │   Ready to record    │ │
│ └──────────────────────┘ │
│                          │
│ 🎙️ Start Recording       │
│                          │
│ 📋 Tips:                 │
│  ✓ Quiet room            │
│  ✓ 10-60 sec             │
│  ✓ Clear voice           │
│  ✓ Good mic              │
└──────────────────────────┘
(Swipe to Upload Tab)
```

## 🎨 Color Palette

### Primary Colors
```
Sky Blue:      #0ea5e9    Primary action buttons
Cyan:          #06b6d4    Accents
Dark Blue:     #0c4a6e    Dark text
Light Blue:    #e0f2fe    Backgrounds
```

### Mode Colors
```
Record Mode:   #ef4444    Red (Start button)
Upload Mode:   #3b82f6    Blue (Browse button)
Success:       #22c55e    Green (File selected)
Error:         #ef4444    Red (Invalid file)
```

### Text Colors
```
Primary Text:  #0c4a6e    Dark blue
Secondary:     #075985    Medium blue
Tertiary:      #0369a1    Light blue
Muted:         #64748b    Gray
```

## 📐 Component Breakdown

### Tab Navigation
```
┌─────────────────────────────────────────┐
│ [🎙️ Record Voice] [📁 Upload Recording] │
│  (Red gradient)      (Gray background)   │
└─────────────────────────────────────────┘

Active Tab:
  - Background: Gradient (primary color)
  - Text: White
  - Shadow: Drop shadow
  - Border: Rounded

Inactive Tab:
  - Background: White with opacity
  - Text: Sky blue
  - No shadow
  - Hover: Slightly darker background
```

### Recording Section
```
┌────────────────────────────────────────┐
│ Record New Voice Sample                │
│ Record a voice sample directly using   │
│ your microphone                        │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │        🎤                         │  │
│ │    Ready to record                │  │
│ │     (or Recording: 00:35)          │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 🎙️ Start Recording               │  │
│ │ (Red gradient button)             │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │ 🔊 Playback:                     │  │
│ │ [Audio Player Controls]           │  │
│ └──────────────────────────────────┘  │
│                                        │
│ 📋 Recording Guidelines:               │
│ ✓ Record in quiet environment          │
│ ✓ Speak clearly & normal volume        │
│ ✓ Duration: 10-60 seconds optimal      │
│ ✓ Good microphone quality recommended  │
│                                        │
└────────────────────────────────────────┘
```

### Upload Section
```
┌────────────────────────────────────────┐
│ Upload Voice Recording                 │
│ Upload a pre-recorded voice sample     │
│ from your device                       │
│                                        │
│ ┌──────────────────────────────────┐  │
│ │                                  │  │
│ │ ╱╱╱╱ DRAG & DROP ╱╱╱╱           │  │
│ │ 📁                               │  │
│ │ Drag and drop audio file         │  │
│ │ or click to browse               │  │
│ │                                  │  │
│ │ Supported: WAV, MP3, WebM...     │  │
│ │                                  │  │
│ │ [Browse Files Button]            │  │
│ │                                  │  │
│ └──────────────────────────────────┘  │
│                                        │
│ [File Info Card - After Upload]       │
│ ┌──────────────────────────────────┐  │
│ │ 📄 my_voice_sample.wav           │  │
│ │ 📊 Size: 2.45 MB                 │  │
│ │ 🎵 Type: WAV                      │  │
│ │ ✅ Status: Ready for analysis    │  │
│ │ [Remove Button]                  │  │
│ └──────────────────────────────────┘  │
│                                        │
│ ℹ️ Upload Tips:                        │
│ ✓ High-quality audio recordings        │
│ ✓ Clear speech without noise           │
│ ✓ File size: < 50MB                    │
│ ✓ Supported formats                    │
│                                        │
└────────────────────────────────────────┘
```

## 🎭 Interactive States

### Button States

**Idle State:**
```
┌──────────────────────┐
│ 🎙️ Start Recording   │
│ (Red gradient)       │
│ (Hoverable)          │
└──────────────────────┘
```

**Hover State:**
```
┌──────────────────────┐
│ 🎙️ Start Recording   │
│ (Darker red)         │
│ (Scale up slightly)  │
│ (Drop shadow)        │
└──────────────────────┘
```

**Active/Press State:**
```
┌──────────────────────┐
│ ⏹️ Stop Recording     │
│ (Gray color)         │
│ (Darker shade)       │
└──────────────────────┘
```

**Disabled State:**
```
┌──────────────────────┐
│ ⏳ Analyzing...       │
│ (Gray background)    │
│ (No cursor interact) │
│ (Opacity reduced)    │
└──────────────────────┘
```

### File Upload States

**Empty State (Before Upload):**
```
┌──────────────────────────────────┐
│ 📁                               │
│ Drag and drop audio file         │
│ or click to browse               │
│                                  │
│ Supported formats...             │
│                                  │
│ [Browse Files Button]            │
└──────────────────────────────────┘
```

**Drag Over State:**
```
┌──────────────────────────────────┐ ← Border highlights
│ ╱╱╱╱ DROP YOUR FILE ╱╱╱╱         │ ← Text changes
│ 📁                               │ ← Blue background
│ File is ready to drop            │
│                                  │
│                                  │
│                                  │
└──────────────────────────────────┘
```

**File Selected State:**
```
┌──────────────────────────────────┐
│ 📄 filename.wav                  │
│ 📊 Size: 2.45 MB                 │
│ 🎵 Type: WAV                      │
│ ✅ Status: Ready for analysis    │
│ [Remove] Button                  │
└──────────────────────────────────┘
```

## 📊 Information Cards

### Formatting Example
```
┌────────────────────────────────────┐
│ 🎯 Card Title                      │
│                                    │
│ Main description text goes here.   │
│ It can be multiple lines.          │
│                                    │
│ • Optional bullet point            │
│ • Another feature                  │
└────────────────────────────────────┘
```

### Bottom Info Cards
```
┌──────────┐  ┌──────────┐  ┌──────────┐
│   🎯     │  │   🔒     │  │   📊     │
│ Accurate │  │  Secure  │  │ Detailed │
│ Analysis │  │& Private │  │ Results  │
└──────────┘  └──────────┘  └──────────┘
```

## 🎬 Animation Details

### Tab Switch Animation
```
   Smooth transition (300ms)
   Opacity fade-in/out
   Slight scale movement
```

### Loading State
```
   Spinning loader circle
   Pulsing opacity
   Message: "⏳ Analyzing..."
```

### Success Animation
```
   Green checkmark ✅
   File info appears with slide-down
   Duration: 200ms ease-out
```

### Error Animation
```
   Red alert icon 🔴
   Shake animation (optional)
   Alert dialog appears
   Duration: 150ms
```

## 📱 Responsive Breakpoints

### Desktop (1024px+)
```
Layout: 2 columns side-by-side
Container: max-width 1280px
Padding: 32px
Gap: 32px
Font size: 16px base
```

### Tablet (769px - 1023px)
```
Layout: 2 columns (stacked when needed)
Container: max-width 100%
Padding: 24px
Gap: 24px
Font size: 15px base
```

### Mobile (<768px)
```
Layout: 1 column (stacked)
Container: max-width 100%
Padding: 16px
Gap: 16px
Font size: 14px base
Tab buttons: Full width
Buttons: Full width
```

## 🔤 Typography

### Headings
```
H1 (Page Title):
  Font: Bold sans-serif
  Size: 32-36px (desktop), 24px (mobile)
  Color: Gradient (sky-900 to cyan-900)
  
H2 (Section Title):
  Font: Bold sans-serif
  Size: 24-28px (desktop), 18px (mobile)
  Color: #0c4a6e (dark blue)
  
H3 (Component Title):
  Font: Bold sans-serif
  Size: 14-18px
  Color: #0c4a6e
```

### Body Text
```
Regular:
  Font: Regular sans-serif
  Size: 14-16px
  Color: #075985 (medium blue)
  Line-height: 1.5-1.6
  
Small:
  Font: Regular sans-serif
  Size: 12-14px
  Color: #64748b (gray)
  
Strong:
  Font: Semi-bold sans-serif
  Size: 14-16px
  Color: #0c4a6e
```

## 🎨 Visual Examples

### Recording in Progress
```
┌──────────────────────────┐
│      🎤 Recording        │
│   [00:35] Timer         │
│                          │
│  🔴 🔴 🔴              │
│(Animated pulses)         │
│                          │
│  ⏹️ Stop Recording       │
│  (Gray button)           │
└──────────────────────────┘
```

### Analysis in Progress
```
┌──────────────────────────┐
│                          │
│  ⟳                      │
│ (Spinning loader)        │
│                          │
│ Analyzing Voice...       │
│ Extracting voice         │
│ features and performing  │
│ assessment. Please wait. │
│                          │
└──────────────────────────┘
```

### Error State
```
┌──────────────────────────┐
│ ⚠️ Analysis Failed       │
│                          │
│ "Audio file too short.   │
│ Please record at least   │
│ 1 second."              │
│                          │
│ [Try Again Button]       │
│                          │
└──────────────────────────┘
```

---

**Version**: 2.0
**Last Updated**: March 28, 2026
**Status**: ✅ Production Ready
