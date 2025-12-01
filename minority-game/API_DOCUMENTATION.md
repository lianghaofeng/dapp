# API Documentation - Minority Game Voting System

## Table of Contents

1. [Smart Contract API](#smart-contract-api)
2. [Frontend JavaScript API](#frontend-javascript-api)
3. [LocalStorage API](#localstorage-api)
4. [Event API](#event-api)
5. [Query API](#query-api)
6. [Usage Examples](#usage-examples)

---

## Smart Contract API

### Core Functions

#### `createVote`

Create a new minority game vote.

```solidity
function createVote(
    string memory question,
    string[] memory options,
    uint256 commitDuration,
    uint256 revealDuration
) external returns (uint256 voteId)
```

**Parameters**:
- `question`: The voting question
- `options`: Array of option strings (2-10 options)
- `commitDuration`: Duration of commit phase in seconds (5s - 7 days, 0 for default 1h)
- `revealDuration`: Duration of reveal phase in seconds (5s - 1 day, 0 for default 30m)

**Returns**: `voteId` - Unique identifier for this vote

**Requirements**:
- Question must not be empty
- 2-10 options required
- All options must be non-empty
- Durations within valid ranges

**Example**:
```javascript
const tx = await contract.createVote(
    "Which feature should we build next?",
    ["Dark Mode", "Mobile App", "API Access"],
    3600,    // 1 hour commit
    1800     // 30 min reveal
);
const receipt = await tx.wait();
const voteId = await contract.voteCounter();
```

---

#### `commit`

Submit encrypted commitment to vote.

```solidity
function commit(
    uint256 voteId,
    bytes32 commitHash
) external payable
```

**Parameters**:
- `voteId`: The vote to participate in
- `commitHash`: keccak256 hash of (voteId, choice, secret, msg.sender)

**Requirements**:
- Vote must exist
- Must be in commit phase
- Before commit deadline
- Has not already committed
- Must send ETH as bet (msg.value > 0)

**Commit Hash Generation**:
```javascript
const secret = ethers.hexlify(ethers.randomBytes(32));
const commitHash = ethers.keccak256(
    ethers.solidityPacked(
        ["uint256", "uint256", "bytes32", "address"],
        [voteId, choice, secret, userAddress]
    )
);
```

**Example**:
```javascript
const choice = 1;  // Option index
const secret = ethers.hexlify(ethers.randomBytes(32));
const commitHash = ethers.keccak256(
    ethers.solidityPacked(
        ["uint256", "uint256", "bytes32", "address"],
        [voteId, choice, secret, await signer.getAddress()]
    )
);

const tx = await contract.commit(voteId, commitHash, {
    value: ethers.parseEther("0.1")  // 0.1 ETH bet
});
await tx.wait();

// IMPORTANT: Store secret locally for reveal phase
localStorage.setItem(`secret_${voteId}`, secret);
```

---

#### `startRevealPhase`

Transition from commit to reveal phase.

```solidity
function startRevealPhase(uint256 voteId) external
```

**Parameters**:
- `voteId`: The vote to transition

**Requirements**:
- Vote must exist
- Must be in commit phase
- Commit deadline must have passed

**Example**:
```javascript
const tx = await contract.startRevealPhase(voteId);
await tx.wait();
console.log("Reveal phase started");
```

---

#### `reveal`

Reveal your committed vote.

```solidity
function reveal(
    uint256 voteId,
    uint256 choice,
    bytes32 secret
) external
```

**Parameters**:
- `voteId`: The vote you're revealing for
- `choice`: Your actual choice (must match commitment)
- `secret`: The secret you used in commit hash

**Requirements**:
- Vote must exist
- Must be in reveal phase
- Before reveal deadline
- Valid choice index
- Must have committed
- Not already revealed
- Hash must match commitment

**Example**:
```javascript
const choice = 1;
const secret = localStorage.getItem(`secret_${voteId}`);

const tx = await contract.reveal(voteId, choice, secret);
await tx.wait();
console.log("Vote revealed successfully");
```

---

#### `finalizeVote`

Calculate winner and transition to claiming phase.

```solidity
function finalizeVote(uint256 voteId) external
```

**Parameters**:
- `voteId`: The vote to finalize

**Requirements**:
- Vote must exist
- Must be in reveal phase
- Reveal deadline must have passed
- Not already finalized

**Logic**:
1. Finds option with minimum total bets (minority)
2. If tie, sets `winningOption = type(uint256).max` (refund all)
3. Otherwise, sets winning option
4. Transitions to claiming phase

**Example**:
```javascript
const tx = await contract.finalizeVote(voteId);
await tx.wait();

const voteInfo = await contract.getVoteInfo(voteId);
if (voteInfo.winningOption === 2n**256n - 1n) {
    console.log("Tie! Everyone gets refunded");
} else {
    console.log(`Winner: Option ${voteInfo.winningOption}`);
}
```

---

#### `claimReward`

Claim your reward if you won.

```solidity
function claimReward(uint256 voteId) external
```

**Parameters**:
- `voteId`: The vote to claim from

**Requirements**:
- Vote must be in claiming phase
- Must have committed
- Must have revealed (non-revealers get nothing)
- Must have reward > 0 (i.e., won)

**Reward Calculation**:
```
If tie:
    reward = your bet (refund)

If you chose minority:
    reward = your bet + (total losing bets × your bet / total winning bets)

If you lost:
    reward = 0 (your bet goes to winners)
```

**Example**:
```javascript
// Check if you won
const reward = await contract.calculateReward(voteId, userAddress);
if (reward > 0) {
    const tx = await contract.claimReward(voteId);
    await tx.wait();
    console.log(`Claimed ${ethers.formatEther(reward)} ETH`);
} else {
    console.log("You didn't win this vote");
}
```

---

### Query Functions

#### `getVoteInfo`

Get comprehensive vote information.

```solidity
function getVoteInfo(uint256 voteId) external view returns (VoteInfo memory)
```

**Returns**:
```solidity
struct VoteInfo {
    uint256 voteId;
    address creator;
    string question;
    string[] options;
    VoteStage stage;        // 0=Active, 1=Committing, 2=Revealing, 3=Finalized, 4=Claiming
    uint256 commitEndTime;
    uint256 revealEndTime;
    uint256 totalBets;
    bool finalized;
    uint256 winningOption;
    uint256 createdAt;
}
```

**Example**:
```javascript
const voteInfo = await contract.getVoteInfo(voteId);
console.log(`Question: ${voteInfo.question}`);
console.log(`Stage: ${voteInfo.stage}`);
console.log(`Total Pool: ${ethers.formatEther(voteInfo.totalBets)} ETH`);
```

---

#### `getCommit`

Get commit information for a specific player.

```solidity
function getCommit(uint256 voteId, address player) external view returns (Commit memory)
```

**Returns**:
```solidity
struct Commit {
    bytes32 commitHash;
    bool revealed;
    uint256 choice;
    uint256 betAmount;
}
```

**Example**:
```javascript
const commit = await contract.getCommit(voteId, userAddress);
if (commit.commitHash !== "0x" + "0".repeat(64)) {
    console.log("You have committed");
    if (commit.revealed) {
        console.log(`Your choice: ${commit.choice}`);
        console.log(`Your bet: ${ethers.formatEther(commit.betAmount)} ETH`);
    }
}
```

---

#### `getParticipants`

Get list of all participants in a vote.

```solidity
function getParticipants(uint256 voteId) external view returns (address[] memory)
```

**Example**:
```javascript
const participants = await contract.getParticipants(voteId);
console.log(`${participants.length} participants:`);
for (const addr of participants) {
    console.log(`  - ${addr}`);
}
```

---

#### `getOptionTotal`

Get total bets for a specific option (only visible after reveal).

```solidity
function getOptionTotal(uint256 voteId, uint256 optionIndex) external view returns (uint256)
```

**Example**:
```javascript
const voteInfo = await contract.getVoteInfo(voteId);
for (let i = 0; i < voteInfo.options.length; i++) {
    const total = await contract.getOptionTotal(voteId, i);
    console.log(`${voteInfo.options[i]}: ${ethers.formatEther(total)} ETH`);
}
```

---

#### `calculateReward`

Calculate reward for a player (view function).

```solidity
function calculateReward(uint256 voteId, address player) public view returns (uint256)
```

**Returns**: Reward amount in wei (0 if lost or not finalized)

**Example**:
```javascript
const reward = await contract.calculateReward(voteId, userAddress);
if (reward > 0n) {
    console.log(`You will receive ${ethers.formatEther(reward)} ETH`);
}
```

---

## Frontend JavaScript API

### Wallet Management

#### `connectWallet()`

Connect MetaMask wallet.

```javascript
async function connectWallet() {
    if (typeof window.ethereum !== 'undefined') {
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const provider = new ethers.BrowserProvider(window.ethereum);
        const signer = await provider.getSigner();
        const address = await signer.getAddress();
        return { provider, signer, address };
    } else {
        throw new Error("MetaMask not installed");
    }
}
```

**Usage**:
```javascript
try {
    const { signer, address } = await connectWallet();
    console.log(`Connected: ${address}`);
} catch (error) {
    alert("Please install MetaMask");
}
```

---

### Vote Creation

#### `createVote(question, options, commitDuration, revealDuration)`

Create new vote from frontend.

```javascript
async function createVote(question, options, commitDuration, revealDuration) {
    const tx = await contract.connect(signer).createVote(
        question,
        options,
        commitDuration,
        revealDuration
    );
    await tx.wait();
    const voteId = await contract.voteCounter();
    return voteId;
}
```

**Usage**:
```javascript
const voteId = await createVote(
    "Best programming language?",
    ["JavaScript", "Python", "Rust", "Go"],
    3600,  // 1 hour
    1800   // 30 min
);
console.log(`Created vote #${voteId}`);
```

---

### Vote Participation

#### `commitVote(voteId, choice, betAmount)`

Commit vote with bet.

```javascript
async function commitVote(voteId, choice, betAmount) {
    const secret = ethers.hexlify(ethers.randomBytes(32));
    const address = await signer.getAddress();

    const commitHash = ethers.keccak256(
        ethers.solidityPacked(
            ["uint256", "uint256", "bytes32", "address"],
            [voteId, choice, secret, address]
        )
    );

    const tx = await contract.connect(signer).commit(voteId, commitHash, {
        value: ethers.parseEther(betAmount)
    });
    await tx.wait();

    // Store secret locally
    saveCommitData(voteId, { choice, secret, betAmount });

    return { commitHash, secret };
}
```

**Usage**:
```javascript
const betAmount = "0.1";  // ETH
const choice = 2;         // Option index

const { commitHash } = await commitVote(voteId, choice, betAmount);
console.log("Committed successfully");
```

---

#### `revealVote(voteId)`

Reveal previously committed vote.

```javascript
async function revealVote(voteId) {
    const commitData = loadCommitData(voteId);
    if (!commitData) {
        throw new Error("No commit found for this vote");
    }

    const { choice, secret } = commitData;

    const tx = await contract.connect(signer).reveal(voteId, choice, secret);
    await tx.wait();

    // Mark as revealed
    markAsRevealed(voteId);
}
```

**Usage**:
```javascript
try {
    await revealVote(voteId);
    console.log("Revealed successfully");
} catch (error) {
    console.error("Reveal failed:", error.message);
}
```

---

### Vote Queries

#### `loadActiveVotes()`

Load all active votes.

```javascript
async function loadActiveVotes() {
    const voteCount = await contract.voteCounter();
    const activeVotes = [];

    for (let i = 1; i <= voteCount; i++) {
        try {
            const voteInfo = await contract.getVoteInfo(i);
            if (voteInfo.stage <= 2) {  // Committing or Revealing
                const participants = await contract.getParticipants(i);
                activeVotes.push({
                    ...voteInfo,
                    participants,
                });
            }
        } catch (error) {
            // Vote doesn't exist or error
        }
    }

    return activeVotes;
}
```

---

#### `loadHistoryVotes()`

Load finalized votes.

```javascript
async function loadHistoryVotes() {
    const voteCount = await contract.voteCounter();
    const historyVotes = [];

    for (let i = 1; i <= voteCount; i++) {
        try {
            const voteInfo = await contract.getVoteInfo(i);
            if (voteInfo.stage >= 3) {  // Finalized or Claiming
                const participants = await contract.getParticipants(i);

                // Get detailed results
                const results = [];
                for (const addr of participants) {
                    const commit = await contract.getCommit(i, addr);
                    if (commit.revealed) {
                        results.push({
                            address: addr,
                            choice: commit.choice,
                            betAmount: commit.betAmount,
                        });
                    }
                }

                historyVotes.push({
                    ...voteInfo,
                    participants,
                    results,
                });
            }
        } catch (error) {
            // Vote doesn't exist
        }
    }

    return historyVotes;
}
```

---

## LocalStorage API

### Data Structure

```javascript
{
  "allUserCommits": {
    "0x123...abc": {           // User address (lowercase)
      "1": {                   // Vote ID
        "choice": 0,
        "secret": "0xabc...",
        "revealed": false,
        "betAmount": "0.1"
      },
      "2": {
        "choice": 1,
        "secret": "0xdef...",
        "revealed": true,
        "betAmount": "0.5"
      }
    }
  }
}
```

### Functions

#### `saveCommitData(voteId, data)`

```javascript
function saveCommitData(voteId, data) {
    if (!userAddress) return;

    const allCommits = JSON.parse(localStorage.getItem('allUserCommits') || '{}');
    const walletKey = userAddress.toLowerCase();

    if (!allCommits[walletKey]) {
        allCommits[walletKey] = {};
    }

    allCommits[walletKey][voteId] = {
        ...data,
        revealed: false,
    };

    localStorage.setItem('allUserCommits', JSON.stringify(allCommits));
}
```

#### `loadCommitData(voteId)`

```javascript
function loadCommitData(voteId) {
    if (!userAddress) return null;

    const allCommits = JSON.parse(localStorage.getItem('allUserCommits') || '{}');
    const walletKey = userAddress.toLowerCase();

    return allCommits[walletKey]?.[voteId] || null;
}
```

#### `markAsRevealed(voteId)`

```javascript
function markAsRevealed(voteId) {
    if (!userAddress) return;

    const allCommits = JSON.parse(localStorage.getItem('allUserCommits') || '{}');
    const walletKey = userAddress.toLowerCase();

    if (allCommits[walletKey]?.[voteId]) {
        allCommits[walletKey][voteId].revealed = true;
        localStorage.setItem('allUserCommits', JSON.stringify(allCommits));
    }
}
```

---

## Event API

### Event Definitions

```solidity
event VoteCreated(uint256 indexed voteId, address indexed creator, string question, uint256 optionsCount, uint256 commitEndTime);
event CommitSubmitted(uint256 indexed voteId, address indexed player, uint256 betAmount);
event RevealSubmitted(uint256 indexed voteId, address indexed player, uint256 choice, uint256 amount);
event VoteFinalized(uint256 indexed voteId, uint256 winningOption, uint256 winningTotal);
event RewardClaimed(uint256 indexed voteId, address indexed player, uint256 reward);
event BetConfiscated(uint256 indexed voteId, address indexed player, uint256 amount);
```

### Listening to Events

```javascript
// Listen for new votes
contract.on("VoteCreated", (voteId, creator, question, optionsCount, commitEndTime) => {
    console.log(`New vote #${voteId}: ${question}`);
    // Refresh UI
    loadActiveVotes();
});

// Listen for commits
contract.on("CommitSubmitted", (voteId, player, betAmount) => {
    console.log(`Player ${player} committed ${ethers.formatEther(betAmount)} ETH to vote #${voteId}`);
});

// Listen for reveals
contract.on("RevealSubmitted", (voteId, player, choice, amount) => {
    console.log(`Player ${player} revealed choice ${choice}`);
});

// Listen for finalization
contract.on("VoteFinalized", (voteId, winningOption, winningTotal) => {
    console.log(`Vote #${voteId} finalized. Winner: Option ${winningOption}`);
    // Refresh UI to show results
    loadHistoryVotes();
});

// Listen for claims
contract.on("RewardClaimed", (voteId, player, reward) => {
    console.log(`Player ${player} claimed ${ethers.formatEther(reward)} ETH`);
});
```

---

## Usage Examples

### Complete Vote Lifecycle

```javascript
// 1. Connect wallet
const { signer, address } = await connectWallet();
const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, signer);

// 2. Create vote
const voteId = await createVote(
    "Where should we meet?",
    ["Coffee Shop", "Park", "Library"],
    3600,  // 1 hour commit
    1800   // 30 min reveal
);

// 3. Commit vote
const choice = 1;  // Park
const betAmount = "0.1";  // 0.1 ETH
await commitVote(voteId, choice, betAmount);

// 4. Wait for commit phase to end
// (Poll or use events)

// 5. Start reveal phase (anyone can call)
await contract.startRevealPhase(voteId);

// 6. Reveal vote
await revealVote(voteId);

// 7. Wait for reveal phase to end

// 8. Finalize (anyone can call)
await contract.finalizeVote(voteId);

// 9. Check if you won
const reward = await contract.calculateReward(voteId, address);
if (reward > 0n) {
    // 10. Claim reward
    await contract.claimReward(voteId);
    console.log(`Won ${ethers.formatEther(reward)} ETH!`);
}
```

### Multi-Wallet Testing

```javascript
// Test with multiple wallets
const signers = await ethers.getSigners();

// Create vote with wallet 1
const contract1 = contract.connect(signers[0]);
const voteId = await contract1.createVote(...);

// All wallets commit
for (let i = 0; i < 10; i++) {
    const contractI = contract.connect(signers[i]);
    const choice = Math.floor(Math.random() * 3);

    const secret = ethers.hexlify(ethers.randomBytes(32));
    const commitHash = ethers.keccak256(
        ethers.solidityPacked(
            ["uint256", "uint256", "bytes32", "address"],
            [voteId, choice, secret, signers[i].address]
        )
    );

    await contractI.commit(voteId, commitHash, {
        value: ethers.parseEther("0.1")
    });

    // Store for reveal
    secrets[i] = { choice, secret };
}

// ... continue with reveal, finalize, claim
```

---

## Error Handling

### Common Errors

```javascript
try {
    await contract.commit(voteId, commitHash, { value: betAmount });
} catch (error) {
    if (error.message.includes("Commit phase ended")) {
        alert("⏰ Too late! Commit phase has ended.");
    } else if (error.message.includes("Already committed")) {
        alert("✋ You've already committed to this vote.");
    } else if (error.message.includes("Bet amount required")) {
        alert("💰 Please enter a bet amount.");
    } else {
        alert(`Error: ${error.message}`);
    }
}
```

---

## Gas Cost Reference

| Operation | Typical Gas Cost | ETH (50 Gwei) |
|-----------|------------------|---------------|
| Create Vote | ~187,000 | $0.019 |
| Commit | ~51,000 | $0.005 |
| Reveal | ~68,000 | $0.007 |
| Finalize | ~44,000 | $0.004 |
| Claim | ~33,000 | $0.003 |

*Assuming ETH = $2000 and gas price = 50 Gwei*

---

## Contract Addresses

### Localhost (Hardhat)
```
VotingGame: 0x9fE46736679d2d9a73f5829FC5fb3A7663Ef3fc1
```

### Testnets
```
Goerli:   TBD
Sepolia:  TBD
Mumbai:   TBD
```

---

## ABI

See `artifacts/contracts/VotingGame.sol/VotingGame.json` for full ABI.

Quick reference:
```json
[
  "function createVote(string,string[],uint256,uint256) returns (uint256)",
  "function commit(uint256,bytes32) payable",
  "function reveal(uint256,uint256,bytes32)",
  "function finalizeVote(uint256)",
  "function claimReward(uint256)",
  "function getVoteInfo(uint256) view returns (tuple)",
  "function getCommit(uint256,address) view returns (tuple)",
  "function getParticipants(uint256) view returns (address[])",
  "event VoteCreated(uint256 indexed,address indexed,string,uint256,uint256)",
  "event CommitSubmitted(uint256 indexed,address indexed,uint256)",
  "event RevealSubmitted(uint256 indexed,address indexed,uint256,uint256)",
  "event VoteFinalized(uint256 indexed,uint256,uint256)"
]
```
