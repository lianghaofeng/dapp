# Evaluation Plan for Decentralized Minority Game Voting System

## Executive Summary

This evaluation plan employs a **hybrid approach** combining empirical and qualitative methods to comprehensively assess the Decentralized Minority Game Voting System. The empirical evaluation focuses on game-theoretic properties, system performance, and fairness metrics, while the qualitative evaluation examines user experience, interface usability, and trust in the blockchain-based commit-reveal mechanism.

---

## 1. Evaluation Approach Overview

### 1.1 Rationale for Hybrid Evaluation

Our prototype **improves existing voting mechanisms** through blockchain implementation and **adds new features** via commit-reveal privacy. Therefore, we employ:

1. **Empirical Evaluation**: Measure quantifiable improvements in:
   - Strategic voting prevention
   - Game fairness and randomness
   - Transaction performance and gas costs
   - System security and correctness

2. **Qualitative Evaluation**: Assess subjective user experience:
   - Usability of commit-reveal interface
   - Trust in blockchain transparency
   - Understanding of minority game mechanics
   - Overall satisfaction and perceived fairness

### 1.2 Evaluation Timeline

```
Week 1-2:  Empirical data collection (1000 simulated games)
Week 3:    User study recruitment and training
Week 4:    Qualitative evaluation (20 participants)
Week 5:    Data analysis and report writing
```

---

## 2. Empirical Evaluation

### 2.1 Research Questions

**RQ1**: Does the commit-reveal mechanism effectively prevent strategic voting compared to open voting?

**RQ2**: Is the minority game outcome distribution fair and unpredictable?

**RQ3**: How does the system perform under varying participant counts and bet distributions?

**RQ4**: What are the gas costs and transaction delays for different operations?

### 2.2 Hypotheses

**H1**: Commit-reveal voting will result in more uniform choice distributions compared to sequential open voting (where later voters can strategize).

**H2**: The minority option will win approximately 40-50% of games with random voting, demonstrating game balance.

**H3**: Transaction costs will scale linearly with participant count, with O(1) cost per player action.

**H4**: The system will maintain correctness (proper winner calculation) in 100% of test cases.

### 2.3 Variables

#### Independent Variables:
- **Voting Mechanism**: Commit-Reveal (experimental) vs. Open Voting (baseline)
- **Number of Participants**: {5, 10, 20, 50, 100}
- **Number of Options**: {2, 3, 5, 10}
- **Bet Distribution**: {Uniform, Random, Skewed}

#### Dependent Variables:
- **Choice Distribution Entropy**: Measure of randomness in vote distribution
- **Minority Win Rate**: Percentage where smallest group wins
- **Gas Costs**: Wei spent per operation (commit, reveal, claim)
- **Transaction Time**: Block confirmation delays
- **Reward Fairness**: Gini coefficient of payouts
- **Strategic Advantage**: Difference in win rates between early and late voters

### 2.4 Experimental Design

#### 2.4.1 Control Group: Traditional Open Voting

**Baseline Implementation**: Sequential voting where each vote is immediately visible.

**Characteristics**:
- Votes revealed as soon as submitted
- Later voters can see previous votes
- No privacy during voting period
- Vulnerable to strategic voting

#### 2.4.2 Experimental Group: Commit-Reveal Voting

**Our Implementation**: Two-phase voting with cryptographic commitments.

**Characteristics**:
- Votes hidden during commit phase
- Revealed in second phase with verification
- Privacy preserved until reveal
- Strategic voting prevented

#### 2.4.3 Test Scenarios

We will run **1000 simulated games** across the following scenarios:

| Scenario | Participants | Options | Distribution | Games |
|----------|-------------|---------|--------------|-------|
| S1 - Small Binary | 10 | 2 | Uniform | 100 |
| S2 - Small Multi | 10 | 5 | Uniform | 100 |
| S3 - Medium Binary | 20 | 2 | Random | 100 |
| S4 - Medium Multi | 20 | 5 | Random | 100 |
| S5 - Large Binary | 50 | 2 | Skewed | 100 |
| S6 - Large Multi | 50 | 5 | Skewed | 100 |
| S7 - Stress Test | 100 | 10 | Random | 200 |
| S8 - Edge Cases | Variable | Variable | Variable | 200 |

**Total**: 1000 games with varied parameters

### 2.5 Evaluation Metrics

#### 2.5.1 Game Theory Metrics

**1. Choice Distribution Entropy**
```
H(X) = -Σ p(x_i) * log₂(p(x_i))
```
- **Range**: 0 (all votes same) to log₂(n) (perfectly uniform)
- **Goal**: Higher entropy indicates effective strategic voting prevention
- **Expected**: Commit-Reveal should show 15-20% higher entropy than open voting

**2. Minority Win Rate**
```
MWR = (Number of games where smallest group wins) / (Total games)
```
- **Range**: 0% to 100%
- **Goal**: Should be between 40-60% for balanced game
- **Expected**: Approximately 50% with random voting behavior

**3. Nash Equilibrium Deviation**
```
NED = |Actual Distribution - Theoretical Nash Distribution|
```
- **Goal**: Measure how close actual play is to game theory predictions
- **Expected**: Lower deviation in commit-reveal (players can't strategize)

#### 2.5.2 Fairness Metrics

**4. Gini Coefficient of Rewards**
```
G = (Σ Σ |x_i - x_j|) / (2n² * μ)
```
- **Range**: 0 (perfect equality) to 1 (perfect inequality)
- **Goal**: Measure wealth distribution among winners
- **Expected**: 0.3-0.5 (some inequality due to game mechanics)

**5. Expected Value Analysis**
```
EV(player) = P(win) * E[reward | win] - bet
```
- **Goal**: Verify negative expected value (house doesn't profit unfairly)
- **Expected**: Slightly negative EV due to non-revealers' locked funds

#### 2.5.3 Performance Metrics

**6. Gas Cost Analysis**
- **Commit Operation**: Avg gas used for commit transaction
- **Reveal Operation**: Avg gas used for reveal transaction
- **Claim Operation**: Avg gas used for claim transaction
- **Total Cost per Game**: Sum of all operations
- **Goal**: Gas costs should be predictable and reasonable

**7. Transaction Confirmation Time**
- **Commit Delay**: Time from submission to blockchain confirmation
- **Reveal Delay**: Time from submission to blockchain confirmation
- **Goal**: < 2 seconds on localhost, < 15 seconds on real network

**8. Scalability Metrics**
```
Gas Cost Growth Rate = d(Gas)/d(Participants)
```
- **Goal**: Should be O(1) per player (linear scaling)
- **Expected**: Each additional player adds constant gas overhead

#### 2.5.4 Security Metrics

**9. Hash Collision Rate**
```
HCR = (Number of hash collisions) / (Total commits)
```
- **Expected**: 0% (keccak256 should have no collisions in our test space)

**10. Commitment Validity Rate**
```
CVR = (Valid reveals) / (Total commits) * 100%
```
- **Expected**: 100% for honest players, 0% for manipulated reveals

### 2.6 Baseline Methods

We compare our system against three baselines:

#### Baseline 1: Sequential Open Voting
- **Description**: Votes are visible immediately upon submission
- **Implementation**: Modified smart contract without commit-reveal
- **Hypothesis**: Will show strategic voting patterns (later voters gain advantage)

#### Baseline 2: Simultaneous Centralized Voting
- **Description**: Traditional voting where results revealed after deadline
- **Implementation**: Centralized server collecting votes
- **Weakness**: Requires trust in server, no verifiable transparency

#### Baseline 3: Simple Blockchain Voting (No Privacy)
- **Description**: Blockchain voting without commit-reveal
- **Implementation**: Direct choice recording on-chain
- **Weakness**: All votes publicly visible during voting period

### 2.7 Statistical Analysis Plan

#### 2.7.1 Hypothesis Testing

For **H1** (Choice Distribution):
- **Test**: Welch's t-test comparing entropy values
- **Null Hypothesis**: μ_commit-reveal = μ_open-voting
- **Alternative**: μ_commit-reveal > μ_open-voting
- **Significance Level**: α = 0.05
- **Power**: 0.80

For **H2** (Minority Win Rate):
- **Test**: One-sample proportion test
- **Null Hypothesis**: p = 0.50
- **Alternative**: p ≠ 0.50
- **Significance Level**: α = 0.05

For **H3** (Gas Scaling):
- **Test**: Linear regression analysis
- **Model**: Gas = β₀ + β₁ * Participants + ε
- **Hypothesis**: β₁ should be constant (linear relationship)

#### 2.7.2 Effect Size Calculation

We will calculate Cohen's d for entropy difference:
```
d = (μ₁ - μ₂) / σ_pooled
```
- Small effect: d = 0.2
- Medium effect: d = 0.5
- Large effect: d = 0.8

#### 2.7.3 Confidence Intervals

All metrics will be reported with 95% confidence intervals:
```
CI = x̄ ± 1.96 * (σ / √n)
```

### 2.8 Data Collection Instruments

**Automated Test Scripts**:
- `evaluation/empirical-game-theory.js`: Tests H1, H2
- `evaluation/empirical-performance.js`: Tests H3
- `evaluation/empirical-security.js`: Tests hash validity
- `evaluation/baseline-comparison.js`: Compares all baselines
- `evaluation/statistical-analysis.js`: Performs hypothesis testing

**Data Format**:
```json
{
  "gameId": 1,
  "scenario": "S1",
  "mechanism": "commit-reveal",
  "participants": 10,
  "options": 2,
  "distribution": "uniform",
  "results": {
    "choiceDistribution": [5, 5],
    "entropy": 1.0,
    "minorityWon": true,
    "winningOption": 0,
    "gasCosts": {
      "commits": [21000, ...],
      "reveals": [30000, ...],
      "finalize": 50000,
      "claims": [25000, ...]
    },
    "timestamps": {...}
  }
}
```

---

## 3. Qualitative Evaluation

### 3.1 Research Questions

**QRQ1**: How do users perceive the usability of the commit-reveal interface?

**QRQ2**: Do users trust the blockchain-based voting mechanism more than traditional systems?

**QRQ3**: How well do users understand the minority game mechanics?

**QRQ4**: What improvements would enhance user experience?

### 3.2 Survey Plan

#### 3.2.1 Participant Recruitment

**Sample Size**: 20 participants
- **Target**: University students and blockchain enthusiasts
- **Background**: 50% with blockchain experience, 50% without
- **Age Range**: 18-35 years old
- **Compensation**: $20 gift card per participant

**Recruitment Criteria**:
- ✓ Basic understanding of voting systems
- ✓ Willingness to install MetaMask
- ✓ No prior experience with our system (avoid bias)
- ✗ Exclude team members and close associates

#### 3.2.2 Study Protocol

**Session Duration**: 60 minutes per participant

**Phase 1: Training (15 min)**
- Explain minority game concept
- Install MetaMask and connect to localhost
- Provide test ETH
- Walkthrough of one complete game

**Phase 2: Task Completion (30 min)**
Participants complete 5 tasks:
1. **Task 1**: Create a new vote
2. **Task 2**: Commit a vote with bet
3. **Task 3**: Reveal vote after commit phase
4. **Task 4**: Finalize a completed vote
5. **Task 5**: Claim reward (if won)

**Phase 3: Survey & Interview (15 min)**
- Complete questionnaire (10 min)
- Semi-structured interview (5 min)

#### 3.2.3 Survey Instruments

**Quantitative Questions** (7-point Likert scale: 1=Strongly Disagree, 7=Strongly Agree):

**Usability (System Usability Scale - SUS)**:
1. I think that I would like to use this system frequently
2. I found the system unnecessarily complex
3. I thought the system was easy to use
4. I would need technical support to use this system
5. The various functions were well integrated
6. There was too much inconsistency in this system
7. Most people would learn to use this system quickly
8. I found the system very cumbersome to use
9. I felt very confident using the system
10. I needed to learn a lot before I could use this system

**Trust & Transparency**:
11. I trust that my vote was recorded correctly
12. I believe the results are fair and not manipulated
13. I understand how my vote remains private during commit phase
14. I feel confident that the smart contract calculates winners correctly
15. I trust this system more than traditional online voting

**Game Understanding**:
16. I understand how the minority game works
17. I can predict when I might win or lose
18. The voting process is clear to me
19. I understand why commit-reveal is necessary

**Satisfaction**:
20. Overall, I am satisfied with this voting system
21. I would recommend this system to others
22. The visual design is appealing
23. The real-time countdown is helpful
24. The history view helps me understand past games

**Open-Ended Questions**:
1. What did you like most about the system?
2. What did you find most confusing or difficult?
3. How would you improve the user interface?
4. Do you have any concerns about using blockchain for voting?
5. Would you use this for real decisions? Why or why not?

#### 3.2.4 Bias Mitigation Strategies

**Observer Bias**:
- Use standardized script for all sessions
- Record all sessions for later review
- Have independent reviewer analyze 20% of sessions

**Participant Bias**:
- Don't reveal hypothesis or expected outcomes
- Mix question ordering
- Include attention check questions

**Selection Bias**:
- Recruit from multiple channels (campus, online forums, social media)
- Ensure demographic diversity
- Don't pre-screen for positive attitudes toward blockchain

**Confirmation Bias**:
- Analyze all data, not just favorable responses
- Report negative feedback prominently
- Use quantitative metrics alongside qualitative

### 3.3 Interview Protocol

**Semi-Structured Interview Questions**:

1. **Opening**: "Walk me through your overall experience using the system."

2. **Usability Probes**:
   - "Was there any point where you felt lost or confused?"
   - "Which features did you find most/least intuitive?"

3. **Trust & Privacy**:
   - "How do you feel about your vote being stored on a blockchain?"
   - "Did the commit-reveal process make you feel your vote was more private?"

4. **Comparison**:
   - "How does this compare to other voting systems you've used?"
   - "Would you trust this more or less than paper ballots? Why?"

5. **Improvements**:
   - "If you could change one thing, what would it be?"
   - "What features would you add?"

6. **Closing**: "Any final thoughts or concerns?"

### 3.4 Data Analysis Plan

#### Quantitative Analysis:
- **SUS Score Calculation**: Score = (Σ positive - 5) + (25 - Σ negative)) * 2.5
  - Score < 50: Poor usability
  - Score 50-70: Acceptable
  - Score > 70: Good usability
  - **Target**: SUS > 70

- **Trust Score**: Average of questions 11-15
  - **Target**: Mean > 5.0 (Agreement)

- **Understanding Score**: Average of questions 16-19
  - **Target**: Mean > 5.5 (Strong Agreement)

#### Qualitative Analysis:
- **Thematic Coding**: Use grounded theory approach
  - Open coding: Identify recurring themes in responses
  - Axial coding: Group related themes
  - Selective coding: Identify core categories

- **Sentiment Analysis**: Classify feedback as Positive/Neutral/Negative
  - Calculate sentiment distribution
  - Identify most common pain points

- **Feature Requests**: Categorize and prioritize improvement suggestions

---

## 4. Datasets

### 4.1 Empirical Evaluation Dataset

**Synthetic Game Data** (1000 games):
- **Size**: ~500 MB (including all transaction logs)
- **Format**: JSON files + CSV summaries
- **Variables**: 15 features per game (participants, options, choices, outcomes, gas, etc.)

**Example Record**:
```json
{
  "gameId": 42,
  "timestamp": "2024-12-01T10:30:00Z",
  "scenario": "S3",
  "participants": 20,
  "options": 2,
  "votes": [0,1,0,1,1,0,0,1,1,0,0,1,0,1,1,0,0,0,1,1],
  "distribution": [9, 11],
  "minorityOption": 0,
  "entropy": 0.993,
  "totalPool": "2.0 ETH",
  "winnerCount": 9,
  "avgReward": "0.244 ETH",
  "gasCosts": {...},
  "executionTime": {...}
}
```

**Dataset Statistics**:
```
Total Games:              1000
Total Simulated Players:  ~30,000
Total Votes Cast:         ~30,000
Total ETH Wagered:        ~3000 ETH (testnet)
Average Game Duration:    90 seconds
Date Range:               Week 1-2 of evaluation
```

**Distribution Visualization**:
- Histogram of participant counts
- Box plot of entropy values by mechanism
- Scatter plot of gas costs vs. participants
- Time series of game outcomes

### 4.2 Qualitative Evaluation Dataset

**User Study Data** (20 participants):
- **Questionnaire Responses**: 24 questions × 20 participants = 480 data points
- **Interview Transcripts**: ~200 pages (20 sessions × 10 pages each)
- **Screen Recordings**: 20 hours of footage
- **Task Completion Metrics**: Success rates, time taken, errors

**Dataset Statistics**:
```
Participants:              20
Survey Questions:          24 (20 quantitative, 4 open-ended)
Interview Duration:        ~5 hours total
Screen Recording:          ~10 hours total
Task Success Rate:         Target > 90%
Average Session Time:      60 minutes
```

---

## 5. Expected Outcomes

### 5.1 Empirical Evaluation

**Expected Results**:
1. **Entropy**: Commit-Reveal will show 15-20% higher entropy (p < 0.05)
2. **Minority Win Rate**: 45-55% (within confidence interval of 50%)
3. **Gas Costs**: Linear scaling, ~50k gas per commit, ~70k per reveal
4. **Correctness**: 100% accurate winner calculation

**Success Criteria**:
- ✓ H1 confirmed with p < 0.05 and Cohen's d > 0.5
- ✓ H2 confirmed with minority win rate in [40%, 60%]
- ✓ H3 confirmed with R² > 0.95 for linear regression
- ✓ H4 confirmed with 100% correctness rate

### 5.2 Qualitative Evaluation

**Expected Results**:
1. **SUS Score**: 70-80 (Good usability)
2. **Trust Score**: 5.5-6.5 (High trust)
3. **Understanding Score**: 5.0-6.0 (Good understanding)
4. **Satisfaction**: 80% would recommend system

**Success Criteria**:
- ✓ SUS > 70 (Good usability)
- ✓ Trust score > 5.0 (Agreement on trust questions)
- ✓ Understanding score > 5.0 (Majority understand mechanics)
- ✓ > 75% satisfaction rate

### 5.3 Key Insights Expected

1. **Commit-Reveal Effectiveness**: Quantitative proof that privacy prevents strategic voting
2. **Game Balance**: Evidence that minority game is fair and balanced
3. **User Trust**: Users prefer transparent blockchain over black-box systems
4. **Usability Gaps**: Specific UI improvements needed for non-technical users

---

## 6. Evaluation Deliverables

### 6.1 Empirical Evaluation Outputs

1. **Raw Data**:
   - `data/empirical/games-raw.json` (1000 game records)
   - `data/empirical/games-summary.csv` (statistical summary)

2. **Analysis Scripts**:
   - `evaluation/empirical-*.js` (5 test scripts)
   - `evaluation/statistical-analysis.js` (hypothesis testing)

3. **Reports**:
   - `reports/empirical-results.md` (detailed findings)
   - `reports/statistical-analysis.pdf` (with tables and figures)

### 6.2 Qualitative Evaluation Outputs

1. **Raw Data**:
   - `data/qualitative/survey-responses.csv` (quantitative answers)
   - `data/qualitative/interview-transcripts/` (20 text files)

2. **Analysis**:
   - `evaluation/qualitative-analysis.R` (statistical analysis of surveys)
   - `evaluation/thematic-coding.xlsx` (coded interview themes)

3. **Reports**:
   - `reports/qualitative-results.md` (user study findings)
   - `reports/improvement-recommendations.md` (design changes)

### 6.3 Visualization Outputs

1. **Empirical Visualizations**:
   - Entropy comparison box plots
   - Gas cost scaling line graphs
   - Win rate distribution histograms
   - Performance heatmaps

2. **Qualitative Visualizations**:
   - SUS score distribution
   - Trust metric radar charts
   - Sentiment word clouds
   - Feature request priority matrix

---

## 7. Limitations and Threats to Validity

### 7.1 Internal Validity

**Threats**:
- **Instrumentation**: Bugs in test scripts could skew results
- **Mitigation**: Extensive code review, unit tests for evaluation scripts

### 7.2 External Validity

**Threats**:
- **Sample Bias**: University students may not represent general population
- **Mitigation**: Recruit from diverse backgrounds, report demographic data

- **Test Environment**: Localhost performance differs from mainnet
- **Mitigation**: Also test on Goerli testnet for realistic gas costs

### 7.3 Construct Validity

**Threats**:
- **Metric Validity**: Entropy may not fully capture "strategic voting prevention"
- **Mitigation**: Use multiple complementary metrics

### 7.4 Statistical Conclusion Validity

**Threats**:
- **Low Power**: Small sample size for some comparisons
- **Mitigation**: Calculate required sample size for 80% power

---

## 8. Ethical Considerations

1. **Informed Consent**: All participants sign consent forms
2. **Data Privacy**: Anonymize all user study data
3. **Right to Withdraw**: Participants can quit anytime without penalty
4. **Deception**: No deception used in study
5. **IRB Approval**: Submit protocol to Institutional Review Board

---

## 9. Timeline and Resource Requirements

**Personnel**:
- 1 Researcher (evaluation design and execution)
- 1 Developer (script implementation)
- 1 Data Analyst (statistical analysis)
- 20 Participants (user study)

**Equipment**:
- Hardhat localhost node
- Screen recording software
- Survey platform (Google Forms or Qualtrics)
- Statistical software (R, Python, SPSS)

**Budget**:
- Participant compensation: 20 × $20 = $400
- Software licenses: $100
- **Total**: $500

**Time Commitment**:
- Empirical evaluation: 2 weeks (40 hours)
- Qualitative evaluation: 2 weeks (40 hours + 20 participant hours)
- Data analysis: 1 week (40 hours)
- **Total**: 5 weeks (~120 research hours)

---

## 10. Conclusion

This evaluation plan provides a rigorous, multi-method assessment of the Decentralized Minority Game Voting System. By combining empirical testing of game-theoretic properties with qualitative evaluation of user experience, we will gain comprehensive insights into both the technical effectiveness and practical usability of the system.

The empirical evaluation will provide quantitative evidence for the effectiveness of commit-reveal mechanisms in preventing strategic voting, while the qualitative evaluation will uncover usability issues and trust perceptions that cannot be captured through metrics alone.

Results from this evaluation will directly inform the next iteration of the design, ensuring that the system is both theoretically sound and practically usable.
