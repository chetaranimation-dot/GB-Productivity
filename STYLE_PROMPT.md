# GB - Productivity Styled Design Prompt

Berikut adalah prompt panduan gaya (Style Prompt) yang lengkap dan terperinci untuk mereplikasi estetika desain aplikasi **GB - Productivity** pada proyek web atau aplikasi lainnya.

---

```markdown
Role: Expert UI/UX Designer & Frontend Developer

Implement a clean, premium, and calm productivity dashboard UI with a cohesive dual-theme (Light & Dark) aesthetic matching the following design specifications:

### 1. Color Palette & Semantic Tokens
- **Brand Primary (Eco-Teal)**: `#0d9488` (Teal 600) / Hover: Teal 500. Represents action, completion, progress selection, and primary headings.
- **Brand Accent (Burgundy Wine)**: `#881337` (Rose 900) or Slate Burgundy. Used for indicators, active tracking highlights, and selected active calendar date frames.
- **Neutral Light Baseline**:
  - Background: Gentle off-white `#f8fafc` (Slate 50) with ambient card patterns.
  - Cards & Panels: Solid White `#ffffff` with very soft borders (`#f1f5f9` - Slate 100).
  - Main text: Deep charcoal slate `#1e293b` (Slate 800) / Subtexts: `#94a3b8` (Slate 400).
- **Neutral Dark Baseline (Dark Mode)**:
  - Background: Deep matte obsidian slate `#020617` (Slate 950).
  - Cards & Panels: Dark slate `#0f172a` (Slate 900) with subtle borders `#1e293b` (Slate 800) and translucent dark overlays `#020617/40` (Slate 950 with opacity).
  - Main text: Light off-white silver `#f8fafc` (Slate 50) / Subtexts: `#64748b` (Slate 500).

### 2. Typography Pairings
- **Display Headings**: Use a geometric, versatile sans-serif like "Inter" or "Outfit" with medium-to-bold weights, tight letter-tracking (`tracking-tight`), and clean margins.
- **Status & Tabular Data**: Use a crisp monospace like "JetBrains Mono" or "Fira Code" for numeric indicators, dates, checkboxes, stats quantities, or conversion indicators to maintain absolute visual rhythm.

### 3. Layout, Shadows, & Borders
- **Spacing**: Generous negative space with fluid padding. Pains should never feel cluttered. Cards use custom responsive padding (e.g., `p-4 sm:p-5`).
- **Rounding Corners**: High organic rounding of cards using `rounded-xl` (12px) and `rounded-2xl` (16px) for an approachable, modern, premium tactile card-deck feel.
- **Shadows**: Only utilize soft ambient shadows (`shadow-sm`) or clean inset shadows (`shadow-inner` for pressed/selected states). Avoid thick, heavily saturated shadows.

### 4. Interactive Feel & Hand-crafted Transitions
- Include micro-animations for hover states: buttons should scale smoothly (`hover:scale-105`), card selections should highlight gently, and checklist ticks should transition with a spring layout fade-in.
- Ensure that elements stack gracefully in mobile portait view (using `flex flex-col sm:flex-row sm:items-center` for stats blocks and calendar cells) to prevent label clipping.
```

---

*Gunakan prompt di atas ketika berhadapan dengan asisten AI pembuat kode atau designer untuk menghasilkan antar-muka yang serasi dengan aplikasi ini!*
