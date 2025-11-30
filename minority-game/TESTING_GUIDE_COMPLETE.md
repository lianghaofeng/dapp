# 🧪 Complete Testing Guide for Minority Game

## Overview

This guide provides comprehensive testing strategies for the Minority Game, including multi-player simulations, empirical analysis, and quantitative results.

---

## 📋 Table of Contents

1. [Test Environment Setup](#test-environment-setup)
2. [Multi-Player Testing](#multi-player-testing)
3. [Empirical Analysis](#empirical-analysis)
4. [Manual Multi-Account Testing](#manual-multi-account-testing)
5. [Performance Testing](#performance-testing)
6. [Results Interpretation](#results-interpretation)

---

## 1. Test Environment Setup

### Prerequisites

- Node.js v16+
- Hardhat installed
- At least 10 test accounts (Hardhat provides 20 by default)

### Installation

```bash
cd /home/user/dapp/minority-game
npm install
npx hardhat compile
```

### Start Local Node

```bash
# Terminal 1
npx hardhat node
```

This provides 20 test accounts, each with 10,000 ETH.

---

## 2. Multi-Player Testing

### Automated Multi-Player Test

This test simulates a complete game with 10 players.

**Run the test:**

```bash
# Terminal 2
npx hardhat run scripts/multi-player-test.js --network localhost
```

**What it tests:**

- ✅ Contract deployment
- ✅ Vote creation with custom time settings
- ✅ Multi-player commit phase (10 players)
- ✅ Reveal phase with realistic reveal rate (80%)
- ✅ Vote finalization
- ✅ Reward calculation and distribution
- ✅ Minority win principle validation

**Expected output:**

```
🎮 Starting Multi-Player Minority Game Test

📋 STEP 1: Test Setup
✅ Deployer: 0xf39F...
✅ Number of players: 10

📋 STEP 2: Deploy Contract
✅ Contract deployed at: 0x...

📋 STEP 3: Create Vote
✅ Vote created successfully

📋 STEP 4: Commit Phase - Multi-Player Simulation
Player 1 (0x7099...)
   Choice: Bitcoin
   Bet: 0.1 ETH
   ✅ Committed
...

📋 STEP 9: Analyze Results
🎯 VOTE RESULTS:
   Winning Option: Bitcoin
...
```

**Results saved to:** `test-results-multi-player.json`

---

## 3. Empirical Analysis

### Multi-Round Statistical Analysis

This script runs multiple rounds (default: 5) to gather statistical data.

**Run the analysis:**

```bash
npx hardhat run scripts/empirical-analysis.js --network localhost
```

**What it tests:**

- ✅ Multiple game rounds (5 rounds)
- ✅ Strategic vs random player behavior
- ✅ Distribution pattern analysis
- ✅ Minority win rate calculation
- ✅ Reveal rate consistency
- ✅ ROI (Return on Investment) tracking

**Expected output:**

```
📊 EMPIRICAL ANALYSIS - MINORITY GAME

🎮 ROUND 1
✅ Vote 1 created
📝 COMMIT PHASE
   Player 1: A - 0.234 ETH
...

📈 AGGREGATE ANALYSIS
🎯 KEY FINDINGS:
   Total Rounds Played: 5
   Minority Win Rate: 100%
   Average Reveal Rate: 90.00%
   Total Pool (All Rounds): 3.456 ETH
...

🔬 STATISTICAL VALIDATION:
   Minority Win Principle: ✅ VALIDATED
   Reveal Rate Consistency: ✅ GOOD
```

**Results saved to:**
- `empirical-analysis-results.json` (detailed data)
- `empirical-analysis-summary.txt` (readable summary)

---

## 4. Manual Multi-Account Testing

### Using MetaMask with Multiple Accounts

Since MetaMask can only connect one account at a time, here's how to test multi-player scenarios:

#### Method 1: Multiple Browser Profiles

1. **Chrome Profile 1:**
   - Import Hardhat Account #1
   - Private Key: `0x59c6995e998f97a5a0044966f0945389dc9e86dae88c7a8412f4603b6b78690d`

2. **Chrome Profile 2:**
   - Import Hardhat Account #2
   - Private Key: `0x5de4111afa1a4b94908f83103eb1f1706367c2e68ca870fc3fb9a804cdab365a`

3. **Firefox:**
   - Import Hardhat Account #3
   - Private Key: `0x7c852118294e51e653712a81e05800f419141751be58f605c371e15141b007a6`

4. **Brave:**
   - Import Hardhat Account #4
   - etc.

#### Method 2: Hardhat Console

Use Hardhat console to interact programmatically:

```bash
npx hardhat console --network localhost
```

```javascript
// Get accounts
const [deployer, player1, player2, player3] = await ethers.getSigners();

// Get contract
const contract = await ethers.getContractAt("VotingGame", "0x...");

// Player 1 commits
const p1Contract = contract.connect(player1);
const secret1 = ethers.hexlify(ethers.randomBytes(32));
const hash1 = ethers.keccak256(
    ethers.solidityPacked(
        ['uint256', 'uint256', 'bytes32', 'address'],
        [1, 0, secret1, player1.address]
    )
);
await p1Contract.commit(1, hash1, { value: ethers.parseEther("0.1") });

// Player 2 commits (different choice)
const p2Contract = contract.connect(player2);
const secret2 = ethers.hexlify(ethers.randomBytes(32));
const hash2 = ethers.keccak256(
    ethers.solidityPacked(
        ['uint256', 'uint256', 'bytes32', 'address'],
        [1, 1, secret2, player2.address]
    )
);
await p2Contract.commit(1, hash2, { value: ethers.parseEther("0.2") });

// Continue for more players...
```

#### Method 3: Test Script with Browser Integration

Use the improved frontend `voting-improved.html` with different accounts:

1. Open `http://localhost:8000/voting-improved.html` in Browser 1
2. Connect Account #1
3. Create a vote or participate
4. Switch MetaMask account to Account #2 (Settings → Select Account)
5. Refresh page
6. Participate with Account #2

**Note:** This requires refreshing after each account switch.

---

## 5. Performance Testing

### Gas Usage Analysis

```bash
npx hardhat test test/VotingGame.test.js --network hardhat
```

Look for gas usage in output:
- `createVote`: ~XXX,XXX gas
- `commit`: ~XX,XXX gas
- `reveal`: ~XX,XXX gas
- `finalizeVote`: ~XXX,XXX gas

### Stress Testing

Modify `multi-player-test.js` config:

```javascript
const TEST_CONFIG = {
    numPlayers: 20,  // Increase to 20
    // ...
};
```

Run:
```bash
npx hardhat run scripts/multi-player-test.js --network localhost
```

---

## 6. Results Interpretation

### Understanding Test Results

#### Multi-Player Test Results

**File:** `test-results-multi-player.json`

```json
{
  "players": [
    {
      "index": 1,
      "address": "0x...",
      "choice": 0,
      "choiceName": "Bitcoin",
      "betAmount": "0.1"
    }
  ],
  "analysis": {
    "winner": "Bitcoin",
    "winnerCount": 3,
    "totalRewards": "2.5000",
    "averageReward": "0.8333",
    "profitMargin": {
      "Player 1": "733.33%"
    }
  }
}
```

**Key metrics:**
- `winnerCount`: Number of players in the minority
- `totalRewards`: Sum of all rewards distributed
- `averageReward`: Mean reward per winner
- `profitMargin`: ROI for each winner

#### Empirical Analysis Results

**File:** `empirical-analysis-results.json`

```json
{
  "aggregateStats": {
    "totalRounds": 5,
    "minorityWinRate": "100%",
    "averageRevealRate": "90.00%",
    "totalPoolAllRounds": "3.4560",
    "averageWinnersPerRound": "2.40"
  }
}
```

**Key metrics:**
- `minorityWinRate`: % of rounds where minority won
- `averageRevealRate`: % of players who revealed
- `averageWinnersPerRound`: Mean winners per game

### Success Criteria

✅ **Minority Win Rate:** Should be ≥ 80%
✅ **Reveal Rate:** Should be ≥ 85%
✅ **No Reverts:** All transactions should succeed
✅ **Correct Rewards:** Sum of rewards ≈ total pool

---

## 7. Advanced Testing Scenarios

### Scenario 1: Edge Case - All Players Choose Same Option

Modify `multi-player-test.js`:

```javascript
// In commit phase loop
const choice = 0; // Everyone chooses option 0
```

**Expected:** No winner, all players lose bets.

### Scenario 2: Edge Case - Perfect Distribution

```javascript
// Equal distribution
const choice = i % 3; // Distributes evenly across 3 options
```

**Expected:** One option wins (depends on reveal order).

### Scenario 3: Late Reveals

```javascript
// Simulate some players not revealing
const revealingPlayers = commits.slice(0, Math.floor(commits.length * 0.5));
```

**Expected:** Non-revealing players forfeit rewards.

### Scenario 4: Large Bet Variation

```javascript
const betAmounts = ["0.01", "0.01", "0.01", "5.0", "0.01"];
```

**Expected:** Rewards distributed proportionally to bets.

---

## 8. Continuous Integration

### Automated Testing Pipeline

Create `.github/workflows/test.yml`:

```yaml
name: Test Minority Game

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: actions/setup-node@v2
        with:
          node-version: '16'
      - run: npm install
      - run: npx hardhat compile
      - run: npx hardhat test
      - run: npx hardhat run scripts/multi-player-test.js --network hardhat
```

---

## 9. Troubleshooting

### Common Issues

**Issue:** "Nonce too high"
**Solution:** Clear MetaMask activity data (Settings → Advanced → Clear activity tab data)

**Issue:** "Transaction reverted"
**Solution:** Check commit/reveal hash calculation, ensure secret matches

**Issue:** "Insufficient funds"
**Solution:** Ensure Hardhat node is running and accounts have test ETH

**Issue:** Test times out
**Solution:** Reduce commit/reveal duration in test config

---

## 10. Best Practices

1. **Always start fresh:** Restart Hardhat node between test runs
2. **Use descriptive test names:** Easy to identify failures
3. **Save results:** Keep JSON files for comparison
4. **Vary parameters:** Test different player counts, bet amounts
5. **Monitor gas:** Track gas usage across commits
6. **Automate:** Use scripts for repetitive tests

---

## 11. Test Checklist

Before deploying to testnet/mainnet:

- [ ] All unit tests pass
- [ ] Multi-player test completes successfully
- [ ] Empirical analysis shows ≥80% minority win rate
- [ ] Edge cases handled correctly
- [ ] Gas usage is acceptable
- [ ] No security vulnerabilities
- [ ] Frontend works with multi-player scenarios
- [ ] Auto-reveal mechanism tested
- [ ] Reward distribution verified

---

## 12. Next Steps

After testing locally:

1. **Deploy to BSC Testnet:**
   ```bash
   npx hardhat run scripts/deploy.js --network bscTestnet
   ```

2. **Test on Testnet:**
   - Use real MetaMask accounts
   - Get test BNB from faucet
   - Repeat multi-player scenarios

3. **Security Audit:**
   - Consider professional audit
   - Review with team

4. **Mainnet Deployment:**
   - Only after thorough testing
   - Start with limited funds

---

## Resources

- [Hardhat Documentation](https://hardhat.org/getting-started/)
- [Ethers.js Documentation](https://docs.ethers.org/)
- [Game Theory Principles](https://en.wikipedia.org/wiki/Minority_game)

---

**Happy Testing! 🚀**
