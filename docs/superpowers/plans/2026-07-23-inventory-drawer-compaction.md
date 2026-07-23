# Inventory Drawer Compaction Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Shorten the inventory drawer's primary workflow so adoption and owner assignment appear near the top while evidence, calculation details, and trends remain available below.

**Architecture:** Keep all business state and task creation logic in the existing `Inventory` page. Add only local disclosure state for the adjustment form and evidence details, then reorganize `SkuDetailDrawerContent` into compact visual sections without changing the replenishment, clearance, or transfer scenario resolvers.

**Tech Stack:** React 18, Vite, Tailwind CSS, lucide-react, recharts, Node test runner

## Global Constraints

- Keep the inventory drawer width at `450px` and retain its fixed footer.
- Preserve all existing replenishment, clearance, transfer, adoption, assignment, and task creation behavior.
- Do not add dependencies or modify the shared `DetailDrawer` component.
- Reset disclosure state when another SKU opens, but preserve saved inventory fields and owner assignment.
- Keep complete AI evidence, calculation basis, and sales trend data accessible.

---

### Task 1: Lock the compact workflow with source-level tests

**Files:**
- Modify: `src/pages/inventoryDrawerLayout.test.mjs`
- Modify: `src/pages/inventorySuggestionInteractions.test.mjs`

**Interfaces:**
- Consumes: current `Inventory.jsx` drawer source
- Produces: regression assertions for `adjustmentOpen`, `evidenceOpen`, compact metrics, inline assignment, and the shorter trend chart

- [ ] **Step 1: Add failing layout assertions**

Add assertions that require compact section markers and sizes:

```js
assert.match(source, /data-testid="inventory-compact-overview"/);
assert.match(source, /data-testid="inventory-ai-action"/);
assert.match(source, /data-testid="inventory-evidence-disclosure"/);
assert.match(source, /style=\{\{ height: 88 \}\}/);
assert.doesNotMatch(source, /style=\{\{ height: 132 \}\}/);
assert.doesNotMatch(source, /style=\{\{ width: `\$\{confidence\}%` \}\}/);
```

- [ ] **Step 2: Add failing interaction assertions**

Require local disclosure state, accessible toggle attributes, inline owner assignment, and SKU reset behavior:

```js
assert.match(source, /const \[adjustmentOpen, setAdjustmentOpen\] = useState\(false\)/);
assert.match(source, /const \[evidenceOpen, setEvidenceOpen\] = useState\(false\)/);
assert.match(source, /setAdjustmentOpen\(false\)/);
assert.match(source, /aria-expanded=\{adjustmentOpen\}/);
assert.match(source, /aria-expanded=\{evidenceOpen\}/);
assert.match(source, /onAssignOwner=\{handleAssignInventoryOwner\}/);
```

- [ ] **Step 3: Run tests and verify RED**

Run:

```powershell
node --test src/pages/inventoryDrawerLayout.test.mjs src/pages/inventorySuggestionInteractions.test.mjs
```

Expected: FAIL because compact section markers and disclosure state do not exist.

- [ ] **Step 4: Commit the tests**

```powershell
git add src/pages/inventoryDrawerLayout.test.mjs src/pages/inventorySuggestionInteractions.test.mjs
git commit -m "test: define compact inventory drawer workflow"
```

### Task 2: Reorganize the inventory drawer

**Files:**
- Modify: `src/pages/Inventory.jsx:250-550`
- Modify: `src/pages/Inventory.jsx:770-1110`

**Interfaces:**
- Consumes: `selectedSku`, `selectedScenario`, `directSuggestionAdopted`, `handleAdoptSuggestion`, `handleAssignInventoryOwner`
- Produces: local `adjustmentOpen: boolean`, local `evidenceOpen: boolean`, compact overview and AI action sections

- [ ] **Step 1: Add disclosure state and reset it when opening a SKU**

Add page state next to the existing adjustment fields:

```jsx
const [adjustmentOpen, setAdjustmentOpen] = useState(false);
const [evidenceOpen, setEvidenceOpen] = useState(false);
```

In the existing SKU opening handler, restore the current saved fields and reset only disclosure state:

```jsx
setAdjustmentOpen(false);
setEvidenceOpen(false);
```

- [ ] **Step 2: Make the footer adjustment button a disclosure control**

Replace the direct save click with an accessible toggle. Keep saving inside the expanded form:

```jsx
<button
  aria-expanded={adjustmentOpen}
  className="h-10 flex-1 rounded-[8px] border border-[#2F7BFF] bg-white px-2 text-sm font-semibold text-[#2F7BFF]"
  onClick={() => setAdjustmentOpen((open) => !open)}
  type="button"
>
  {adjustmentOpen ? '收起调整' : '调整方案'}
</button>
```

Pass `adjustmentOpen`, `evidenceOpen`, `setEvidenceOpen`, and `onSaveAdjustment={handleModifyPurchase}` into `SkuDetailDrawerContent`.

- [ ] **Step 3: Merge product and inventory metrics into one compact card**

Replace the separate product card and four metric cards with one section:

```jsx
<section data-testid="inventory-compact-overview" className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
  <div className="flex items-center gap-3">{/* existing product image and identity */}</div>
  <div className="mt-3 grid grid-cols-4 border-t border-[#EEF1F6] pt-3">
    {metrics.map((metric) => (
      <div key={metric.label} className="min-w-0 border-r border-[#EEF1F6] px-2 last:border-r-0">
        <div className="text-[11px] text-[#7889A8]">{metric.label}</div>
        <div className={`mt-1 truncate text-sm font-semibold ${metric.tone}`}>{metric.value}</div>
      </div>
    ))}
  </div>
</section>
```

- [ ] **Step 4: Merge adoption and owner assignment into the AI action card**

Use the existing suggestion copy and adoption handler, remove the confidence progress bar, and render the owner field directly below the recommendation:

```jsx
<section data-testid="inventory-ai-action" className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
  <div className="flex items-start justify-between gap-3">
    <div>{/* scenario title and recommendation */}</div>
    <button aria-pressed={directSuggestionAdopted} onClick={onAdoptSuggestion} type="button">
      {directSuggestionAdopted ? '已采纳' : '采纳'}
    </button>
  </div>
  <div className="mt-2 flex items-center gap-4 text-xs">
    <span>置信度 <strong>{confidence}%</strong></span>
    <span>处理状态 <strong>{selectedSku.status ?? '待处理'}</strong></span>
  </div>
  <label className="mt-3 block border-t border-[#EEF1F6] pt-3">
    <span className="text-xs text-[#7889A8]">负责人</span>
    <AssigneeWorkloadSelect
      ariaLabel="分派库存负责人"
      className="mt-1"
      disabled={selectedSku.status !== '待分派'}
      members={taskTeamMembers}
      onChange={onAssignOwner}
      source={selectedSku}
      tasks={tasks}
      triggerClassName="h-9 w-full rounded-[8px] px-3 text-sm"
      value={selectedSku.owner}
    />
  </label>
</section>
```

- [ ] **Step 5: Render the adjustment form only when requested**

Keep the current scenario-specific fields, remove the duplicated AI suggestion row and owner selector, and add an explicit save button:

```jsx
{adjustmentOpen ? (
  <section className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
    <h3 className="text-sm font-semibold text-[#1D273B]">调整方案</h3>
    {/* existing quantity, transfer route, reason, and note fields */}
    <button className="mt-3 h-9 w-full rounded-[8px] bg-[#2F7BFF] text-sm font-semibold text-white" onClick={onSaveAdjustment} type="button">
      保存调整方案
    </button>
  </section>
) : null}
```

- [ ] **Step 6: Combine evidence and calculation details behind one disclosure**

Render a compact summary button and mount the existing panels only while expanded:

```jsx
<section data-testid="inventory-evidence-disclosure" className="rounded-[14px] border border-[#E6EAF2] bg-white p-3">
  <button aria-expanded={evidenceOpen} className="flex w-full items-center justify-between text-left" onClick={() => setEvidenceOpen((open) => !open)} type="button">
    <span><strong>建议依据</strong><small> AI判断、计算口径与执行风险</small></span>
    <ChevronDown className={evidenceOpen ? 'rotate-180' : ''} />
  </button>
  {evidenceOpen ? (
    <div className="mt-3 space-y-3">
      <AiEvidencePanel evidence={selectedSku.aiEvidence} connection={connection} />
      <InventoryScenarioBasis
        planning={planning}
        replenishment={replenishment}
        scenario={suggestionScenario}
        selectedSku={selectedSku}
      />
    </div>
  ) : null}
</section>
```

- [ ] **Step 7: Move and shorten the sales trend**

Keep the existing Recharts series but change the stable chart height:

```jsx
<div className="mt-2" style={{ height: 88 }}>
  <ResponsiveContainer width="100%" height="100%">
    <LineChart data={salesTrend} margin={{ top: 8, right: 8, left: -24, bottom: 0 }}>
      <CartesianGrid stroke="#E8EDF5" vertical={false} />
      <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7889A8' }} />
      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: '#7889A8' }} />
      <Tooltip />
      <Line type="monotone" dataKey="sales" stroke="#2F7BFF" strokeWidth={2.5} dot={false} />
    </LineChart>
  </ResponsiveContainer>
</div>
```

- [ ] **Step 8: Run focused tests and verify GREEN**

Run:

```powershell
node --test src/pages/inventoryDrawerLayout.test.mjs src/pages/inventorySuggestionInteractions.test.mjs src/pages/inventory/inventoryTaskScenario.test.mjs src/pages/sourceTaskCreationFlow.test.mjs
```

Expected: all selected tests PASS.

- [ ] **Step 9: Commit the implementation**

```powershell
git add src/pages/Inventory.jsx
git commit -m "feat: compact inventory decision drawer"
```

### Task 3: Verify the complete inventory workflow

**Files:**
- Modify only if verification reveals a defect: `src/pages/Inventory.jsx`

**Interfaces:**
- Consumes: completed compact drawer implementation
- Produces: verified replenishment, clearance, and transfer flows at the target viewport

- [ ] **Step 1: Run the complete test suite**

```powershell
node --test
```

Expected: all tests PASS with zero failures.

- [ ] **Step 2: Build the production bundle**

```powershell
npm.cmd run build
```

Expected: Vite exits with code 0 and emits `dist/`.

- [ ] **Step 3: Verify in the browser at 1440×900**

Open `/inventory`, then verify:

1. Replenishment SKU shows product summary, AI recommendation, adoption, and owner near the top.
2. “调整方案” expands fields without clearing the owner.
3. Slow-moving SKU shows clearance controls without replenishment quantity.
4. Transfer SKU shows quantity and source/destination warehouses.
5. “建议依据” expands and collapses without layout overlap.
6. The footer stays fixed and the body remains scrollable.

- [ ] **Step 4: Review the final diff**

```powershell
git diff --check
git status --short
```

Expected: no whitespace errors; only intended files are changed.
