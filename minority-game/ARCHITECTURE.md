# Minority Game - System Architecture & Flow Charts

## Table of Contents
1. [System Architecture](#system-architecture)
2. [Smart Contract State Machine](#smart-contract-state-machine)
3. [Commit-Reveal Flow](#commit-reveal-flow)
4. [Component Interaction](#component-interaction)
5. [Data Flow](#data-flow)
6. [Security Architecture](#security-architecture)

---

## System Architecture

```mermaid
graph TB
    subgraph "Frontend Layer"
        UI[Web UI - voting-improved.html]
        JS[JavaScript Logic - voting-improved.js]
        LS[LocalStorage<br/>Per-Wallet Commits]
    end

    subgraph "Blockchain Layer"
        MM[MetaMask Wallet]
        HL[Hardhat Localhost<br/>Port 8545]
        SC[VotingGame.sol<br/>Smart Contract]
    end

    subgraph "Development Tools"
        HH[Hardhat Framework]
        DS[Deployment Scripts]
        TS[Test Scripts]
    end

    UI -->|User Actions| JS
    JS -->|Store Secrets| LS
    JS -->|Read Commits| LS
    JS -->|Web3 Calls| MM
    MM -->|JSON-RPC| HL
    HL -->|Execute| SC
    SC -->|Events & State| HL
    HL -->|Responses| MM
    MM -->|Results| JS
    JS -->|Update UI| UI

    HH -->|Deploy| DS
    DS -->|Create Contract| SC
    HH -->|Run Tests| TS
    TS -->|Simulate Games| SC

    style SC fill:#4a9eff,stroke:#2d5f9f,stroke-width:3px
    style MM fill:#f6851b,stroke:#c66400,stroke-width:2px
    style LS fill:#90ee90,stroke:#228b22,stroke-width:2px
```

### Architecture Components

**Frontend Layer:**
- **Web UI**: Cyberpunk-themed interface with tabs for Active/History votes
- **JavaScript Logic**: Handles wallet connection, transaction signing, UI updates
- **LocalStorage**: Stores per-wallet commit secrets (choice + random secret)

**Blockchain Layer:**
- **MetaMask**: Browser wallet for signing transactions and managing accounts
- **Hardhat Localhost**: Local Ethereum node running on port 8545
- **Smart Contract**: Solidity contract implementing commit-reveal voting logic

**Development Tools:**
- **Hardhat Framework**: Development environment for compiling, deploying, testing
- **Deployment Scripts**: Scripts to deploy contracts with alternative addresses
- **Test Scripts**: Multi-player simulation scripts for testing game mechanics

---

## Smart Contract State Machine

```mermaid
stateDiagram-v2
    [*] --> Committing: createVote()

    Committing --> Revealing: startRevealPhase()<br/>(after commitEndTime)

    Revealing --> Finalized: finalizeVote()<br/>(after revealEndTime)

    Finalized --> Claiming: Auto-transition<br/>(in finalizeVote)

    Claiming --> [*]: All rewards claimed

    note right of Committing
        Players submit:
        - Hashed commitment
        - ETH bet amount

        Hash = keccak256(
            voteId,
            choice,
            secret,
            playerAddress
        )
    end note

    note right of Revealing
        Players reveal:
        - Actual choice
        - Secret used in hash

        Contract verifies hash
        and records choice
    end note

    note right of Finalized
        Contract calculates:
        - Minority option
        - Winner distribution

        If tie: refund all
    end note

    note right of Claiming
        Winners claim:
        - Original bet +
        - Share of losing bets

        Non-revealers forfeit
    end note
```

### State Descriptions

| State | Duration | Actions Allowed | Purpose |
|-------|----------|----------------|---------|
| **Committing** | commitDuration (default 1h) | `commit()` | Players submit hashed commitments with ETH bets |
| **Revealing** | revealDuration (default 30m) | `reveal()` | Players reveal their choices with secrets |
| **Finalized** | Instant | None | Contract calculates minority option |
| **Claiming** | Unlimited | `claimReward()` | Winners withdraw rewards |

---

## Commit-Reveal Flow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant LocalStorage
    participant MetaMask
    participant Contract

    rect rgb(40, 40, 80)
        note right of User: COMMIT PHASE
        User->>Frontend: Select choice & bet amount
        Frontend->>Frontend: Generate random secret
        Frontend->>Frontend: Hash = keccak256(voteId, choice, secret, address)
        Frontend->>LocalStorage: Store {choice, secret, betAmount}
        Frontend->>MetaMask: Call commit(voteId, hash) + ETH
        MetaMask->>User: Confirm transaction
        User->>MetaMask: Approve
        MetaMask->>Contract: commit(voteId, hash) {value: bet}
        Contract->>Contract: Store commitHash & betAmount
        Contract->>Contract: Add to participants[]
        Contract-->>MetaMask: CommitSubmitted event
        MetaMask-->>Frontend: Transaction receipt
        Frontend-->>User: ✓ Commit successful
    end

    rect rgb(40, 60, 40)
        note right of User: REVEAL PHASE
        User->>Frontend: Click "Reveal Vote"
        Frontend->>LocalStorage: Retrieve {choice, secret}
        Frontend->>MetaMask: Call reveal(voteId, choice, secret)
        MetaMask->>User: Confirm transaction
        User->>MetaMask: Approve
        MetaMask->>Contract: reveal(voteId, choice, secret)
        Contract->>Contract: Verify hash matches commit
        Contract->>Contract: Record choice in optionTotals
        Contract-->>MetaMask: RevealSubmitted event
        MetaMask-->>Frontend: Transaction receipt
        Frontend->>LocalStorage: Mark as revealed
        Frontend-->>User: ✓ Reveal successful
    end

    rect rgb(60, 40, 40)
        note right of User: FINALIZE PHASE
        User->>Frontend: Click "Finalize Vote"
        Frontend->>MetaMask: Call finalizeVote(voteId)
        MetaMask->>Contract: finalizeVote(voteId)
        Contract->>Contract: Find minimum optionTotal
        Contract->>Contract: Set winningOption
        Contract->>Contract: Change stage to Claiming
        Contract-->>MetaMask: VoteFinalized event
        Frontend-->>User: ✓ Vote finalized
    end

    rect rgb(40, 40, 60)
        note right of User: CLAIM PHASE
        User->>Frontend: Click "Claim Reward"
        Frontend->>MetaMask: Call claimReward(voteId)
        MetaMask->>Contract: claimReward(voteId)
        Contract->>Contract: Calculate reward
        Contract->>Contract: reward = bet + (losingTotal × bet / winningTotal)
        Contract->>User: Transfer ETH reward
        Contract-->>MetaMask: RewardClaimed event
        Frontend-->>User: ✓ Reward claimed: X ETH
    end
```

---

## Component Interaction

```mermaid
graph LR
    subgraph "User Wallet Management"
        W1[Wallet 1<br/>0x123...abc]
        W2[Wallet 2<br/>0x456...def]
        W3[Wallet 3<br/>0x789...ghi]
    end

    subgraph "LocalStorage Structure"
        LS{"{<br/>0x123...abc: {...},<br/>0x456...def: {...},<br/>0x789...ghi: {...}<br/>}"}
        LS1["Wallet 1 Commits:<br/>{<br/>  voteId1: {choice: 0, secret: 'abc', revealed: false},<br/>  voteId2: {choice: 1, secret: 'xyz', revealed: true}<br/>}"]
        LS2["Wallet 2 Commits:<br/>{<br/>  voteId1: {choice: 1, secret: 'def', revealed: false}<br/>}"]
        LS3["Wallet 3 Commits:<br/>{<br/>  voteId1: {choice: 0, secret: 'ghi', revealed: true}<br/>}"]
    end

    subgraph "Smart Contract Storage"
        SC[VotingGame Contract]
        V1[Vote 1 Data]
        V2[Vote 2 Data]
        C1["commits[voteId][address]<br/>{<br/>  commitHash,<br/>  revealed,<br/>  choice,<br/>  betAmount<br/>}"]
        P1["participants[voteId]<br/>[<br/>  0x123...abc,<br/>  0x456...def,<br/>  0x789...ghi<br/>]"]
    end

    W1 -.->|Connected| LS1
    W2 -.->|Connected| LS2
    W3 -.->|Connected| LS3
    LS1 --> LS
    LS2 --> LS
    LS3 --> LS

    W1 -->|Transactions| SC
    W2 -->|Transactions| SC
    W3 -->|Transactions| SC

    SC --> V1
    SC --> V2
    V1 --> C1
    V1 --> P1

    style LS fill:#90ee90,stroke:#228b22
    style SC fill:#4a9eff,stroke:#2d5f9f,stroke-width:3px
    style C1 fill:#ffb6c1,stroke:#ff69b4
    style P1 fill:#ffb6c1,stroke:#ff69b4
```

### Multi-Wallet Support

**Problem Solved:** Each MetaMask wallet needs separate commit storage to prevent cross-contamination.

**Solution:** LocalStorage structure:
```javascript
{
  "0x123...abc": {
    "1": { choice: 0, secret: "random1", revealed: false, betAmount: "0.1" },
    "2": { choice: 1, secret: "random2", revealed: true, betAmount: "0.5" }
  },
  "0x456...def": {
    "1": { choice: 1, secret: "random3", revealed: false, betAmount: "0.2" }
  }
}
```

---

## Data Flow

```mermaid
flowchart TD
    Start([User Opens App]) --> CheckWallet{Wallet<br/>Connected?}

    CheckWallet -->|No| ConnectWallet[Click Connect Wallet]
    ConnectWallet --> MetaMask[MetaMask Popup]
    MetaMask --> CheckNetwork{Network<br/>Localhost?}
    CheckNetwork -->|No| SwitchNetwork[Switch to Localhost:8545]
    CheckNetwork -->|Yes| LoadData
    SwitchNetwork --> LoadData

    CheckWallet -->|Yes| LoadData[Load User Address]

    LoadData --> LoadLS[Load LocalStorage for Wallet]
    LoadLS --> LoadVotes[Fetch Active & History Votes]

    LoadVotes --> RenderUI[Render Vote Cards]

    RenderUI --> UserAction{User Action?}

    UserAction -->|Create Vote| CreateFlow[Create Vote Flow]
    UserAction -->|Commit| CommitFlow[Commit Flow]
    UserAction -->|Reveal| RevealFlow[Reveal Flow]
    UserAction -->|Finalize| FinalizeFlow[Finalize Flow]
    UserAction -->|Claim| ClaimFlow[Claim Flow]

    CreateFlow --> ContractCall1[Contract: createVote()]
    CommitFlow --> StoreSecret[Store choice+secret in LS]
    StoreSecret --> ContractCall2[Contract: commit()]
    RevealFlow --> ReadSecret[Read choice+secret from LS]
    ReadSecret --> ContractCall3[Contract: reveal()]
    FinalizeFlow --> ContractCall4[Contract: finalizeVote()]
    ClaimFlow --> ContractCall5[Contract: claimReward()]

    ContractCall1 --> WaitTx[Wait for Transaction]
    ContractCall2 --> WaitTx
    ContractCall3 --> WaitTx
    ContractCall4 --> WaitTx
    ContractCall5 --> WaitTx

    WaitTx --> TxSuccess{Success?}
    TxSuccess -->|Yes| RefreshUI[Refresh UI]
    TxSuccess -->|No| ShowError[Show Error]

    RefreshUI --> UserAction
    ShowError --> UserAction

    style Start fill:#00ff88,stroke:#00cc66,stroke-width:3px
    style LoadData fill:#4a9eff,stroke:#2d5f9f
    style LoadLS fill:#90ee90,stroke:#228b22
    style ContractCall1 fill:#ffaa00,stroke:#cc8800
    style ContractCall2 fill:#ffaa00,stroke:#cc8800
    style ContractCall3 fill:#ffaa00,stroke:#cc8800
    style ContractCall4 fill:#ffaa00,stroke:#cc8800
    style ContractCall5 fill:#ffaa00,stroke:#cc8800
```

---

## Security Architecture

```mermaid
graph TB
    subgraph "Security Measures"
        direction TB

        subgraph "Frontend Security"
            F1[Random Secret Generation<br/>crypto.getRandomValues]
            F2[Per-Wallet Storage<br/>Prevents Cross-Wallet Access]
            F3[On-Chain Verification<br/>hasUserCommitted checks blockchain]
            F4[Input Validation<br/>Sanitize user inputs]
        end

        subgraph "Smart Contract Security"
            S1[ReentrancyGuard<br/>Prevents reentrancy attacks]
            S2[Commit-Reveal Scheme<br/>Prevents strategic voting]
            S3[Hash Verification<br/>keccak256 validation]
            S4[Time-Based Phases<br/>block.timestamp checks]
            S5[Access Control<br/>require checks]
        end

        subgraph "MetaMask Security"
            M1[Transaction Signing<br/>User approval required]
            M2[Address Verification<br/>Phishing detection]
            M3[Gas Estimation<br/>Prevent excessive fees]
        end

        subgraph "Potential Vulnerabilities"
            V1[⚠️ Unclaimed Funds Lock<br/>No withdraw function]
            V2[⚠️ Front-Running Risk<br/>Public mempool visibility]
            V3[⚠️ Timestamp Manipulation<br/>Miner can adjust ±15s]
            V4[⚠️ No Refund for Non-Revealers<br/>Funds locked forever]
        end
    end

    F1 --> S3
    F2 --> S5
    F3 --> S2

    S1 -.->|Protects| S5
    S2 -.->|Requires| S3
    S4 -.->|Vulnerable to| V3

    M1 -.->|Prevents| V2

    V1 -.->|Needs| Fix1[Add owner withdraw<br/>or distribute to winners]
    V4 -.->|Needs| Fix1

    style V1 fill:#ff6666,stroke:#cc0000
    style V2 fill:#ff6666,stroke:#cc0000
    style V3 fill:#ff6666,stroke:#cc0000
    style V4 fill:#ff6666,stroke:#cc0000
    style Fix1 fill:#ffaa00,stroke:#cc8800
```

### Security Analysis

**✅ Implemented Protections:**

1. **Commit-Reveal Scheme**: Prevents players from seeing others' choices before committing
2. **ReentrancyGuard**: Protects against reentrancy attacks in `commit()`, `reveal()`, `claimReward()`
3. **Hash Verification**: Ensures revealed choice matches committed hash
4. **Per-Wallet Storage**: Frontend prevents localStorage contamination between wallets
5. **On-Chain Verification**: Frontend checks blockchain state, not just localStorage

**⚠️ Known Vulnerabilities:**

1. **Unclaimed Funds Lock**:
   - Issue: No mechanism to recover funds from non-revealers
   - Impact: ETH accumulates in contract forever
   - Solution: Add owner withdrawal or distribute to winners

2. **Front-Running Risk**:
   - Issue: Commit transactions visible in mempool
   - Impact: Miners/bots could potentially exploit
   - Mitigation: Commit-reveal scheme limits this to timing attacks

3. **Timestamp Manipulation**:
   - Issue: Miners can adjust `block.timestamp` by ±15 seconds
   - Impact: Could slightly extend/shorten phases
   - Mitigation: Use longer phase durations (hours, not seconds)

4. **No Emergency Stop**:
   - Issue: No pause/emergency withdrawal mechanism
   - Impact: If bug found, funds are locked
   - Solution: Add pausable functionality or time-locked admin controls

---

## Testing Architecture

```mermaid
flowchart LR
    subgraph "Test Scripts"
        MP[multi-player-test.js<br/>10 Players Simulation]
        EA[empirical-analysis.js<br/>5 Rounds Statistics]
        SH[run-tests.sh<br/>Interactive Runner]
    end

    subgraph "Test Flow"
        T1[1. Deploy Contract]
        T2[2. Create Vote<br/>60s commit, 30s reveal]
        T3[3. All Players Commit<br/>Random choices & bets]
        T4[4. Wait for Commit End]
        T5[5. Start Reveal Phase]
        T6[6. All Players Reveal]
        T7[7. Wait for Reveal End]
        T8[8. Finalize Vote]
        T9[9. Winners Claim Rewards]
        T10[10. Verify Balances]
    end

    subgraph "Verification Points"
        V1[✓ All commits accepted]
        V2[✓ All reveals valid]
        V3[✓ Minority calculated correctly]
        V4[✓ Rewards distributed fairly]
        V5[✓ No funds left unclaimed<br/>by winners]
    end

    MP --> T1
    T1 --> T2
    T2 --> T3
    T3 --> V1
    T3 --> T4
    T4 --> T5
    T5 --> T6
    T6 --> V2
    T6 --> T7
    T7 --> T8
    T8 --> V3
    T8 --> T9
    T9 --> V4
    T9 --> T10
    T10 --> V5

    EA -.->|Runs 5x| MP
    SH -.->|Interactive Menu| MP
    SH -.->|Interactive Menu| EA

    style V1 fill:#00ff88,stroke:#00cc66
    style V2 fill:#00ff88,stroke:#00cc66
    style V3 fill:#00ff88,stroke:#00cc66
    style V4 fill:#00ff88,stroke:#00cc66
    style V5 fill:#00ff88,stroke:#00cc66
```

---

## Real-Time Updates Architecture

```mermaid
sequenceDiagram
    participant Browser
    participant Timer1s
    participant Timer30s
    participant Contract
    participant UI

    Browser->>Timer1s: Start 1-second interval
    Browser->>Timer30s: Start 30-second interval

    loop Every 1 Second
        Timer1s->>UI: Update all countdowns
        UI->>UI: Calculate timeLeft = endTime - now
        UI->>UI: Display "Time Left: Xh Ym Zs"
        UI->>UI: Change color if ended
    end

    loop Every 30 Seconds
        Timer30s->>Contract: Fetch latest vote data
        Contract-->>Timer30s: Vote info + participants
        Timer30s->>UI: Re-render vote cards
        UI->>UI: Update participant counts
        UI->>UI: Update bet totals
        UI->>UI: Update stage information
    end

    Note over Timer1s,Timer30s: Countdowns update smoothly (1s)<br/>Data refreshes periodically (30s)
```

### Countdown System

**Implementation:**
- **1-second timer**: Updates countdown displays using client-side calculation
- **30-second timer**: Fetches fresh data from blockchain to detect phase changes
- **Data attributes**: `data-end-time` stores Unix timestamp for each countdown

**Benefits:**
- Smooth countdown without constant blockchain queries
- Detects when other players trigger phase transitions
- Low RPC call overhead (120 calls/hour vs 3600 calls/hour)

---

## Deployment Architecture

```mermaid
graph TD
    subgraph "Development Setup"
        HH[Hardhat Config<br/>hardhat.config.js]
        SC[Smart Contract<br/>VotingGame.sol]
        DS1[deploy.js<br/>Default deployer account #0]
        DS2[deploy-alt-address.js<br/>Alternative deployer account #1]
    end

    subgraph "Deployment Options"
        D1{Which Deploy<br/>Script?}
        D1 -->|Standard| Addr1[Address: 0x5FbDB2315678...<br/>⚠️ MetaMask Warning]
        D1 -->|Alternative| Addr2[Address: 0x9fE46736679d...<br/>✓ No Warning]
    end

    subgraph "Local Network"
        HHL[Hardhat Node<br/>localhost:8545]
        Acc[20 Test Accounts<br/>Each 10000 ETH]
    end

    subgraph "Frontend Access"
        HTTP[Python HTTP Server<br/>localhost:8000]
        HTML[voting-improved.html]
        MM[MetaMask<br/>Connected to localhost:8545]
    end

    HH --> SC
    HH --> DS1
    HH --> DS2

    DS1 --> D1
    DS2 --> D1

    Addr1 --> HHL
    Addr2 --> HHL

    HHL --> Acc
    HHL <-->|JSON-RPC| MM

    HTTP --> HTML
    HTML <-->|Web3 API| MM

    style Addr1 fill:#ff6666,stroke:#cc0000
    style Addr2 fill:#00ff88,stroke:#00cc66
    style MM fill:#f6851b,stroke:#c66400,stroke-width:2px
```

### Deployment Guide

**Problem:** MetaMask flags default Hardhat address `0x5FbDB2315678afecb367f032d93F642f64180aa3` as malicious.

**Solution:** Deploy using alternative account to generate different contract address.

```bash
# Option 1: Standard deployment (triggers warning)
npx hardhat run scripts/deploy.js --network localhost

# Option 2: Alternative deployment (no warning)
npx hardhat run scripts/deploy-alt-address.js --network localhost
```

**Result:** Contract deployed at safe address `0x9fE46736679d2d9a73f5829FC5fb3A7663Ef3fc1`

---

## Summary

This Minority Game voting system implements a decentralized commit-reveal voting mechanism with the following key features:

**Core Features:**
- ✅ Commit-reveal scheme prevents strategic voting
- ✅ Minority option wins and splits the losing bets
- ✅ Multi-wallet support with per-wallet localStorage
- ✅ Real-time countdown updates (1-second precision)
- ✅ Detailed voting history with all participants
- ✅ Participant list display during active voting

**Architecture Highlights:**
- Smart contract: Solidity with ReentrancyGuard protection
- Frontend: Vanilla JavaScript with Web3/Ethers.js integration
- Local blockchain: Hardhat localhost for development
- Wallet: MetaMask for transaction signing

**Security Considerations:**
- Protected against reentrancy attacks
- Commit-reveal prevents information leakage
- Hash verification ensures vote integrity
- Known issue: Unclaimed funds lock (requires contract upgrade)

**Testing:**
- Automated 10-player simulation script
- Statistical analysis over 5 rounds
- Interactive test runner for easy debugging
