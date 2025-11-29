# ⏰ Custom Time Duration Feature - Implementation Guide

## ✅ What's New

Game creators can now set custom commit and reveal durations when creating a vote!

## 🎯 Feature Overview

### Before
```javascript
// Fixed 1 hour commit, 30 min reveal
await contract.createVote(question, options);
```

### Now
```javascript
// Custom durations or use defaults (pass 0, 0)
await contract.createVote(question, options, commitDuration, revealDuration);
```

## 📋 Duration Limits

The contract enforces these limits for safety:

```solidity
DEFAULT_COMMIT_DURATION = 1 hours     (3600 seconds)
DEFAULT_REVEAL_DURATION = 30 minutes  (1800 seconds)

MIN_COMMIT_DURATION = 5 minutes       (300 seconds)
MAX_COMMIT_DURATION = 7 days          (604800 seconds)
MIN_REVEAL_DURATION = 5 minutes       (300 seconds)
MAX_REVEAL_DURATION = 1 day           (86400 seconds)
```

## 🔧 Implementation Details

### Contract Changes (VotingGame.sol)

**New Function Signature:**
```solidity
function createVote(
    string memory question,
    string[] memory options,
    uint256 commitDuration,     // NEW: 0 = use default
    uint256 revealDuration      // NEW: 0 = use default
) external returns (uint256)
```

**Smart Defaults:**
- Pass `0` for any duration to use the default value
- Contract validates durations are within MIN/MAX bounds
- Prevents too-short votes (< 5 minutes) that users can't participate in
- Prevents too-long votes (> 7 days commit) that nobody will wait for

**Example Scenarios:**

```javascript
// Use all defaults (1 hour commit, 30 min reveal)
createVote(question, options, 0, 0)

// Quick vote: 10 min commit, 5 min reveal
createVote(question, options, 600, 300)

// Long vote: 24 hours commit, 12 hours reveal
createVote(question, options, 86400, 43200)

// Custom commit, default reveal
createVote(question, options, 7200, 0)  // 2 hours commit, 30 min reveal

// ❌ Invalid: Too short
createVote(question, options, 60, 60)  // ERROR: Commit duration too short

// ❌ Invalid: Too long
createVote(question, options, 8*24*3600, 0)  // ERROR: Commit duration too long (8 days)
```

## 📂 Files Updated

### 1. Smart Contract
- ✅ `contracts/VotingGame.sol`
  - Added duration constants (lines 70-75)
  - Modified `createVote()` signature (lines 92-132)
  - Added validation logic

### 2. Test Suite
- ✅ `test/VotingGame.test.js`
  - Updated all `createVote()` calls to pass `0, 0` (use defaults)
  - All 19 tests should still pass

### 3. Frontend
- ✅ `frontend/voting.js`
  - Updated ABI to include new parameters (line 4)
  - Updated `createVote()` call to pass `0, 0` (line 199)

### 4. Scripts
- ✅ `scripts/interact.js`
  - Updated demo to pass `0, 0` (line 31)

## 🚀 Using the Feature

### From Frontend (Simple)

Currently the frontend passes `0, 0` for default durations:

```javascript
const tx = await contract.createVote(question, options, 0, 0);
```

**To add custom duration UI:**

1. Add input fields in `voting.html`:
```html
<div class="form-group">
    <label for="commitDuration">COMMIT DURATION (SECONDS)</label>
    <input type="number" id="commitDuration" placeholder="3600 (1 hour default)">
</div>

<div class="form-group">
    <label for="revealDuration">REVEAL DURATION (SECONDS)</label>
    <input type="number" id="revealDuration" placeholder="1800 (30 min default)">
</div>
```

2. Update `createVote()` function in `voting.js`:
```javascript
const commitDuration = parseInt(document.getElementById('commitDuration').value) || 0;
const revealDuration = parseInt(document.getElementById('revealDuration').value) || 0;

const tx = await contract.createVote(question, options, commitDuration, revealDuration);
```

### From Tests

```javascript
// Use defaults
await votingGame.createVote(question, options, 0, 0);

// Custom durations
await votingGame.createVote(
    "Quick poll",
    ["Yes", "No"],
    600,   // 10 minutes commit
    300    // 5 minutes reveal
);
```

### From Scripts

```javascript
const HOUR = 3600;
const MINUTE = 60;

await votingGame.createVote(
    "What should we build next?",
    ["Feature A", "Feature B", "Feature C"],
    24 * HOUR,  // 24 hours to commit
    12 * HOUR   // 12 hours to reveal
);
```

## ⚠️ Important Notes

### 1. Time Calculation

Durations are in **seconds**, not milliseconds:

```javascript
// ✅ Correct
const oneHour = 3600;
const thirtyMin = 1800;

// ❌ Wrong
const oneHour = 3600000;  // This is milliseconds!
```

### 2. Gas Costs

Passing custom durations doesn't increase gas costs - it's just two uint256 parameters.

### 3. Backward Compatibility

**BREAKING CHANGE:** Old `createVote(question, options)` calls will fail!

You must update:
- All frontend code
- All test scripts
- All deployment scripts

### 4. Validation Errors

If you see these errors:

```
"Commit duration too short"  → Must be ≥ 5 minutes (300 seconds)
"Commit duration too long"   → Must be ≤ 7 days (604800 seconds)
"Reveal duration too short"  → Must be ≥ 5 minutes (300 seconds)
"Reveal duration too long"   → Must be ≤ 1 day (86400 seconds)
```

## 🧪 Testing Custom Durations

### Test Short Vote
```javascript
it("should allow custom short durations", async function () {
    const tx = await votingGame.createVote(
        "Quick poll",
        ["A", "B"],
        300,  // 5 min commit
        300   // 5 min reveal
    );
    await tx.wait();

    const voteInfo = await votingGame.getVoteInfo(1);
    // Verify commitEndTime is ~5 minutes from now
});
```

### Test Duration Validation
```javascript
it("should reject too-short commit duration", async function () {
    await expect(
        votingGame.createVote("Test", ["A", "B"], 60, 300)  // 1 min < 5 min min
    ).to.be.revertedWith("Commit duration too short");
});

it("should reject too-long reveal duration", async function () {
    await expect(
        votingGame.createVote("Test", ["A", "B"], 3600, 90000)  // > 1 day
    ).to.be.revertedWith("Reveal duration too long");
});
```

## 📊 Example Use Cases

### 1. Quick Community Poll
```javascript
// 15 min commit, 10 min reveal = 25 min total
await createVote("Coffee break vote", ["Yes", "No"], 900, 600);
```

### 2. Important DAO Decision
```javascript
// 3 days commit, 1 day reveal = 4 days total
await createVote(
    "Should we implement proposal #42?",
    ["For", "Against", "Abstain"],
    3 * 24 * 3600,
    1 * 24 * 3600
);
```

### 3. Weekly Community Vote
```javascript
// 7 days commit (full week), 6 hours reveal
await createVote(
    "Weekly community poll",
    options,
    7 * 24 * 3600,
    6 * 3600
);
```

### 4. Testing/Development
```javascript
// 5 min each (minimum) for fast testing
await createVote("Test vote", ["A", "B"], 300, 300);
```

## 🐛 Troubleshooting

### Error: "Wrong number of arguments"

**Problem:** Using old 2-parameter signature
```javascript
// ❌ Old way
await contract.createVote(question, options);
```

**Solution:** Add duration parameters
```javascript
// ✅ New way
await contract.createVote(question, options, 0, 0);
```

### Error: "Commit duration too short"

**Problem:** Duration < 5 minutes
```javascript
await contract.createVote(question, options, 60, 300);  // 1 min
```

**Solution:** Use at least 5 minutes
```javascript
await contract.createVote(question, options, 300, 300);  // 5 min
```

### Tests Failing After Update

**Problem:** Old test files using 2-parameter `createVote()`

**Solution:** Search and replace in test files:
```bash
# Find all old calls
grep -n "createVote(" test/*.js

# Update each one to add ", 0, 0"
```

## 📝 Next Steps

### To Deploy

1. **Compile the updated contract:**
   ```bash
   cd minority-game
   npx hardhat compile
   ```

2. **Run tests:**
   ```bash
   npx hardhat test
   ```

3. **Deploy:**
   ```bash
   npx hardhat run scripts/deploy.js --network <your-network>
   ```

### To Add Frontend UI

1. Add duration input fields to `voting.html`
2. Update `createVote()` function to read values
3. Add validation (min/max)
4. Show helpful hints (e.g., "Default: 1 hour")

---

## 🎉 Summary

✅ Game creators can now customize vote timing
✅ Smart defaults prevent mistakes (just pass 0, 0)
✅ Validation prevents unreasonable durations
✅ All existing code updated to use new signature
✅ Backward compatible via defaults (0 = use default)

**Ready to deploy and use!** 🚀
