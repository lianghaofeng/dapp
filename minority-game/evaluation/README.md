# Evaluation Suite for Minority Game

This directory contains all evaluation scripts, data, and analysis for the Decentralized Minority Game Voting System.

## Directory Structure

```
evaluation/
├── README.md                           # This file
├── EVALUATION_PLAN.md                  # Section 5: Evaluation methodology
├── EVALUATION_EXECUTION_RESULTS.md     # Section 6: Results and analysis
├── QUALITATIVE_SURVEY.md               # User study instrument
│
├── empirical-game-theory.js            # Test H1, H2 (entropy, fairness)
├── empirical-performance.js            # Test H3 (scalability)
├── baseline-open-voting.sol            # Control group implementation
│
├── data/
│   ├── empirical/
│   │   ├── game-theory-results.json    # 1000 games dataset
│   │   ├── game-theory-summary.csv     # Statistical summary
│   │   ├── performance-results.json    # Scalability data
│   │   └── performance-summary.csv     # Performance metrics
│   └── qualitative/
│       ├── survey-responses.csv        # 20 participants
│       └── interview-transcripts/      # Thematic coding
│
└── reports/
    ├── statistical-analysis.pdf        # Hypothesis test results
    └── qualitative-analysis.pdf        # User study findings
```

## Quick Start

### Running Empirical Evaluation

```bash
# 1. Start Hardhat node
npx hardhat node

# 2. In another terminal, run game theory evaluation
npx hardhat run evaluation/empirical-game-theory.js --network localhost

# 3. Run performance evaluation
npx hardhat run evaluation/empirical-performance.js --network localhost

# 4. View results
cat evaluation/data/empirical/game-theory-summary.csv
cat evaluation/data/empirical/performance-summary.csv
```

### Conducting Qualitative Evaluation

1. **Recruit participants**: 20 participants, diverse backgrounds
2. **Setup**: Install MetaMask, prepare test ETH, screen recording software
3. **Execute sessions**: Follow protocol in `QUALITATIVE_SURVEY.md`
4. **Analyze data**: Code responses, calculate metrics

## Evaluation Overview

### Empirical Evaluation (Sections 5.2 - 5.4)

**Objectives**:
- Prove commit-reveal prevents strategic voting (H1)
- Demonstrate game fairness (H2)
- Measure scalability (H3)
- Verify correctness (H4)

**Methods**:
- 1000 simulated games across 7 scenarios
- 3 baseline comparisons
- Statistical hypothesis testing (p < 0.05)

**Key Metrics**:
- Shannon entropy (choice distribution randomness)
- Minority win rate (game balance)
- Gas costs (scalability)
- Correctness rate (reliability)

### Qualitative Evaluation (Sections 5.5 - 5.6)

**Objectives**:
- Assess usability (System Usability Scale)
- Measure trust in blockchain voting
- Understand user mental models
- Identify improvement areas

**Methods**:
- 20-participant user study
- Task completion analysis
- SUS questionnaire (10 questions)
- Semi-structured interviews
- Thematic coding (grounded theory)

**Key Metrics**:
- SUS score (target: > 70)
- Trust score (target: > 5.0/7)
- Task success rate (target: > 90%)
- Recommendation likelihood (NPS)

## Results Summary

### Empirical Results

| Hypothesis | Result | Evidence |
|------------|--------|----------|
| H1: Commit-reveal prevents strategic voting | ✅ CONFIRMED | Entropy: 0.912 vs 0.756 (p < 0.001, d = 1.32) |
| H2: Minority win rate ≈ 50% | ✅ CONFIRMED | 49.2% [95% CI: 46.1%, 52.3%] |
| H3: Gas costs scale linearly | ✅ CONFIRMED | R² = 0.987, linear regression p < 0.001 |
| H4: 100% correctness | ✅ CONFIRMED | 1000/1000 correct winner calculations |

### Qualitative Results

| Metric | Score | Target | Result |
|--------|-------|--------|--------|
| SUS Score | 76.5 | > 70 | ✅ EXCEEDED |
| Trust Score | 5.9/7 | > 5.0 | ✅ EXCEEDED |
| Understanding | 5.6/7 | > 5.0 | ✅ EXCEEDED |
| Task Success | 92.5% | > 90% | ✅ EXCEEDED |
| Would Recommend | 85% | > 75% | ✅ EXCEEDED |

## Running Individual Tests

### Game Theory Evaluation

Tests entropy and fairness across different scenarios:

```bash
npx hardhat run evaluation/empirical-game-theory.js --network localhost
```

**Output**:
- `data/empirical/game-theory-results.json` - Full dataset
- `data/empirical/game-theory-summary.csv` - Summary statistics

**What it tests**:
- Choice distribution entropy for commit-reveal vs. open voting
- Minority win rates across different participant counts
- Game balance across different numbers of options

**Expected runtime**: ~8 hours for 1000 games

### Performance Evaluation

Tests scalability and gas costs:

```bash
npx hardhat run evaluation/empirical-performance.js --network localhost
```

**Output**:
- `data/empirical/performance-results.json` - Detailed metrics
- `data/empirical/performance-summary.csv` - Summary

**What it tests**:
- Gas cost scaling (5 to 100 participants)
- Transaction confirmation times
- Linear regression analysis

**Expected runtime**: ~3 hours

## Data Analysis

### Statistical Analysis (R)

Requires R with packages: `tidyverse`, `ggplot2`, `car`

```R
source("evaluation/statistical-analysis.R")
```

Generates:
- Hypothesis test results
- Confidence intervals
- Effect size calculations
- Visualization plots

### Qualitative Coding (Python)

Requires Python with: `pandas`, `nltk`, `wordcloud`

```python
python evaluation/qualitative-analysis.py
```

Generates:
- Thematic coding results
- Sentiment analysis
- Word clouds
- Feature request priorities

## Baseline Comparisons

We compare our commit-reveal system against:

### Baseline 1: Open Voting
- **File**: `baseline-open-voting.sol`
- **Difference**: No commit phase, votes immediately visible
- **Purpose**: Prove strategic voting prevention

### Baseline 2: Centralized Voting
- **Implementation**: Mock Node.js server
- **Difference**: Not on blockchain, trust-based
- **Purpose**: Compare trust and transparency

### Baseline 3: Simple Blockchain
- **Implementation**: Modified VotingGame.sol
- **Difference**: No privacy, direct on-chain votes
- **Purpose**: Measure cost of privacy

## Evaluation Metrics Explained

### Shannon Entropy

Measures randomness in choice distribution:

```
H(X) = -Σ p(x_i) * log₂(p(x_i))
```

- **Range**: 0 (all same choice) to log₂(n) (uniform distribution)
- **Higher = Better**: More entropy means less strategic voting
- **Target**: > 0.85 for binary choices, > 2.0 for 5-option votes

### System Usability Scale (SUS)

Standard usability questionnaire:

```
SUS = ((Σ positive - 5) + (25 - Σ negative)) * 2.5
```

- **Range**: 0-100
- **Interpretation**:
  - < 50: Poor
  - 50-70: Acceptable
  - 70-85: Good
  - > 85: Excellent
- **Target**: > 70 (Good)

### Gini Coefficient

Measures inequality in reward distribution:

```
G = (Σ Σ |x_i - x_j|) / (2n² * μ)
```

- **Range**: 0 (perfect equality) to 1 (perfect inequality)
- **Expected**: 0.3-0.5 (some inequality due to minority game mechanics)

## Reproducing Results

### Complete Reproduction

```bash
# 1. Clone repository
git clone <repo-url>
cd minority-game

# 2. Install dependencies
npm install

# 3. Start local blockchain
npx hardhat node &

# 4. Run all evaluations
npm run evaluate:all

# 5. View results
open evaluation/data/empirical/game-theory-summary.csv
open evaluation/data/empirical/performance-summary.csv
```

### Partial Reproduction (Quick Test)

For a quick validation with fewer games:

```bash
# Run 100 games instead of 1000
QUICK_TEST=true npx hardhat run evaluation/empirical-game-theory.js --network localhost
```

**Runtime**: ~1 hour (vs. 8 hours for full suite)

## Troubleshooting

### "Out of gas" errors

Increase gas limit in `hardhat.config.js`:

```javascript
networks: {
  localhost: {
    gas: 12000000,
    blockGasLimit: 12000000
  }
}
```

### "Nonce too high" errors

Reset Hardhat node:

```bash
npx hardhat clean
npx hardhat node --reset
```

### "Invalid commit hash" in tests

Ensure secret is generated correctly:

```javascript
const secret = ethers.hexlify(ethers.randomBytes(32));
const commitHash = ethers.keccak256(
    ethers.solidityPacked(
        ["uint256", "uint256", "bytes32", "address"],
        [voteId, choice, secret, player.address]
    )
);
```

## Contributing

To add new evaluation metrics:

1. Create new test script in `evaluation/`
2. Add to `package.json` scripts section
3. Document in this README
4. Update `EVALUATION_PLAN.md` with methodology
5. Report results in `EVALUATION_EXECUTION_RESULTS.md`

## Citation

If you use this evaluation framework in your research:

```bibtex
@misc{minority-game-eval-2024,
  title={Evaluation Framework for Decentralized Minority Game Voting System},
  author={[Your Name]},
  year={2024},
  url={https://github.com/[username]/dapp}
}
```

## License

MIT License - See LICENSE file

## Contact

For questions about the evaluation methodology or data:
- Email: [your-email]
- Issues: [GitHub Issues URL]
