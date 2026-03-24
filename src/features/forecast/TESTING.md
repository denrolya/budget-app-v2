# Forecast Feature — Testing Guide

## Setup

1. Start your dev server
2. Navigate to `/forecast` (or press `7`)
3. Clear localStorage keys `forecast-config`, `forecast-events`, `forecast-scenarios` if you want a clean start (DevTools → Application → Local Storage)

---

## Test 1: First Load

- [ ] Page loads without errors
- [ ] Charts render (balance runway top, investment growth bottom)
- [ ] Header shows: horizon toggle, FI button with %, prediction mode badge (SMART or BUDGET), export/import icons, `?` icon
- [ ] Sidebar shows: Cash Flow controls, Investment controls, Starting Position, Events section, Scenarios section
- [ ] Diagnostics bar at bottom shows letter grade — click to expand

**Note:** What prediction mode badge do you see? BUDGET (green), SMART (blue), or SIMPLE (grey)?

---

## Test 2: Horizon Toggle

- [ ] Click through 6m → 1y → 2y → 5y → 10y → 15y → 20y → 30y
- [ ] Chart scales smoothly, more data points appear
- [ ] At 10y+ the seasonal wave pattern should be visible (repeating annual dip)
- [ ] FI line becomes reachable at longer horizons
- [ ] Investment growth chart scales to show FI threshold

---

## Test 3: Sidebar Controls

- [ ] Change income → chart updates live
- [ ] Change expenses → chart updates live
- [ ] Drag savings rate slider → investment growth curve changes
- [ ] Change return rate → investment growth steepness changes
- [ ] Delta badges appear showing +/- vs actuals
- [ ] "Reset to actuals" button appears when values differ — click it → everything resets
- [ ] Hover any label (dotted underline) → tooltip explains the field

---

## Test 4: Seasonal Effect

- [ ] At 2y+ horizon, balance line should be wavy (not perfectly straight)
- [ ] Hover different months in the tooltip — income/expense numbers should vary
- [ ] December/holiday months should show higher expenses (if your data has this pattern)

---

## Test 5: Events

- [ ] Click `+` → presets appear (Salary raise, Sell asset, Large purchase, etc.)
- [ ] Click "Salary raise" → form fills with +500, recurring checked
- [ ] Change month, amount, save → event appears in list
- [ ] Chart should visibly change from the event's start month (balance bends upward)
- [ ] Click "Sell asset" → note the "→invest 80%" field pre-filled
- [ ] Toggle event eye icon → chart reverts. Toggle again → comes back.
- [ ] Delete event → removed from list + chart
- [ ] Hover event type badges (Inc/Exp/Inv/Wdl) → tooltip explains each

---

## Test 6: FI Tracking

- [ ] Click FI button to toggle on/off
- [ ] When on: green dashed line on both charts at the FI target level
- [ ] Investment chart Y-axis extends to show the FI threshold
- [ ] FI % in header updates when you change controls
- [ ] Set 20y+ horizon with decent savings rate → FI line should be reachable
- [ ] Hover FI button → tooltip shows target amount + ETA

---

## Test 7: Strategy Scorecard

- [ ] Bottom panel shows two rows of KPIs with colors (green/yellow/red)
- [ ] Hover each label → tooltip explains the metric
- [ ] Change savings rate → Save %, Buffer, Runway all update
- [ ] Stress test numbers (Exp shock, Inc loss) should make sense — e.g., if expenses are 60% of income, expense shock tolerance should be ~40%+

---

## Test 8: Diagnostics

- [ ] Click the grade bar to expand
- [ ] 12 rules visible in 2-column grid
- [ ] Each rule shows pass (green check) / warn (yellow triangle) / fail (red X)
- [ ] Warn/fail rules show suggestion text below
- [ ] Change a control → grade updates live
- [ ] Set income below expenses → "Positive Surplus" should fail

---

## Test 9: Scenarios

- [ ] Click save icon in Scenarios section → enter name "Plan A" → save
- [ ] Adjust income +1000, save as "Plan B"
- [ ] Both appear in list
- [ ] Click "Plan A" → controls revert to Plan A's values
- [ ] Click compare icon on "Plan B" → second dashed line appears on chart
- [ ] Header shows "vs Plan B"
- [ ] Strategy panel shows third row with Plan B's KPIs
- [ ] Click compare icon again → comparison deactivates
- [ ] Delete a scenario → gone from list
- [ ] Refresh page → scenarios persist

---

## Test 10: Persistence

- [ ] Adjust controls + add events → refresh page → everything persists
- [ ] Click export (↓) → JSON file downloads
- [ ] Reset everything → click import (↑) → select the JSON → state restores
- [ ] Saved scenarios persist across refreshes

---

## Test 11: Info Dialog

- [ ] Click `?` icon → dialog opens
- [ ] Scroll through all sections — content should be readable and make sense
- [ ] Check that prediction modes, FI explanation, event types, diagnostics are all covered

---

## Feedback Framework

For each test, report using this format:

```
Test N: [PASS / ISSUES]
- What works: ...
- What's broken: ...
- What looks wrong visually: ... (screenshot if possible)
- What's confusing: ...
- What I expected but didn't see: ...
```

Priority tags for issues:

- **BUG** — something is broken/wrong
- **UX** — works but confusing or ugly
- **MISSING** — expected feature/behavior not there
- **MATH** — numbers look wrong or unrealistic
- **VISUAL** — layout, spacing, colors, chart rendering

You can batch feedback — don't need to do all 11 tests in order. Start with Tests 1-3 (the basics), then jump to whatever interests you most.
