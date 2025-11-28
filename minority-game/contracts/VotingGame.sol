// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract VotingGame is ReentrancyGuard {
    enum VoteStage { Active, Committing, Revealing, Finalized, Claiming }

    struct Vote {
        uint256 voteId;
        address creator;
        string question;
        string[] options;
        VoteStage stage;
        uint256 commitEndTime;
        uint256 revealEndTime;
        mapping(uint256 => uint256) optionTotals; // optionIndex => total bet amount
        uint256 totalDeposits;
        bool finalized;
        uint256 winningOption;
        uint256 createdAt;
    }

    struct Commit {
        bytes32 commitHash;
        uint256 depositAmount;
        bool revealed;
        uint256 choice;
        uint256 betAmount;
    }

    uint256 public voteCounter;
    mapping(uint256 => Vote) private votes;
    mapping(uint256 => string[]) public voteOptions; // Separate mapping for options array
    mapping(uint256 => mapping(address => Commit)) public commits;
    mapping(uint256 => address[]) public participants;

    uint256 public constant COMMIT_DURATION = 1 hours;
    uint256 public constant REVEAL_DURATION = 30 minutes;
    uint256 public constant MIN_DEPOSIT_RATE = 30;
    uint256 public constant MAX_DEPOSIT_RATE = 70;
    uint256 public constant MIN_OPTIONS = 2;
    uint256 public constant MAX_OPTIONS = 10;

    event VoteCreated(
        uint256 indexed voteId,
        address indexed creator,
        string question,
        uint256 optionsCount,
        uint256 commitEndTime
    );
    event CommitSubmitted(uint256 indexed voteId, address indexed player, uint256 depositAmount);
    event RevealSubmitted(uint256 indexed voteId, address indexed player, uint256 choice, uint256 amount);
    event VoteFinalized(uint256 indexed voteId, uint256 winningOption, uint256 winningTotal);
    event RewardClaimed(uint256 indexed voteId, address indexed player, uint256 reward);
    event DepositConfiscated(uint256 indexed voteId, address indexed player, uint256 amount);

    // Create a new vote
    function createVote(
        string memory question,
        string[] memory options
    ) external returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= MIN_OPTIONS, "At least 2 options required");
        require(options.length <= MAX_OPTIONS, "Too many options");

        for (uint256 i = 0; i < options.length; i++) {
            require(bytes(options[i]).length > 0, "Option cannot be empty");
        }

        voteCounter++;
        uint256 voteId = voteCounter;

        Vote storage newVote = votes[voteId];
        newVote.voteId = voteId;
        newVote.creator = msg.sender;
        newVote.question = question;
        newVote.stage = VoteStage.Committing;
        newVote.commitEndTime = block.timestamp + COMMIT_DURATION;
        newVote.revealEndTime = block.timestamp + COMMIT_DURATION + REVEAL_DURATION;
        newVote.createdAt = block.timestamp;

        // Store options separately
        voteOptions[voteId] = options;

        emit VoteCreated(voteId, msg.sender, question, options.length, newVote.commitEndTime);

        return voteId;
    }

    // Commit a vote
    function commit(uint256 voteId, bytes32 commitHash) external payable nonReentrant {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Committing, "Not in commit phase");
        require(block.timestamp < vote.commitEndTime, "Commit phase ended");
        require(commits[voteId][msg.sender].commitHash == bytes32(0), "Already committed");
        require(msg.value > 0, "Deposit required");

        commits[voteId][msg.sender] = Commit({
            commitHash: commitHash,
            depositAmount: msg.value,
            revealed: false,
            choice: 0,
            betAmount: 0
        });

        participants[voteId].push(msg.sender);
        vote.totalDeposits += msg.value;

        emit CommitSubmitted(voteId, msg.sender, msg.value);
    }

    // Start reveal phase
    function startRevealPhase(uint256 voteId) external {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Committing, "Not in commit phase");
        require(block.timestamp >= vote.commitEndTime, "Commit phase not ended");
        vote.stage = VoteStage.Revealing;
    }

    // Reveal a vote
    function reveal(
        uint256 voteId,
        uint256 choice,
        uint256 betAmount,
        bytes32 secret
    ) external nonReentrant {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Revealing, "Not in reveal phase");
        require(block.timestamp < vote.revealEndTime, "Reveal phase ended");
        require(choice < voteOptions[voteId].length, "Invalid choice");

        Commit storage playerCommit = commits[voteId][msg.sender];
        require(playerCommit.commitHash != bytes32(0), "No commit found");
        require(!playerCommit.revealed, "Already revealed");

        bytes32 computedHash = keccak256(
            abi.encodePacked(voteId, choice, betAmount, secret, msg.sender)
        );
        require(computedHash == playerCommit.commitHash, "Hash mismatch");

        uint256 minDeposit = (betAmount * MIN_DEPOSIT_RATE) / 100;
        uint256 maxDeposit = (betAmount * MAX_DEPOSIT_RATE) / 100;
        require(
            playerCommit.depositAmount >= minDeposit &&
            playerCommit.depositAmount <= maxDeposit,
            "Invalid deposit amount"
        );

        playerCommit.revealed = true;
        playerCommit.choice = choice;
        playerCommit.betAmount = betAmount;

        vote.optionTotals[choice] += betAmount;

        emit RevealSubmitted(voteId, msg.sender, choice, betAmount);
    }

    // Finalize the vote
    function finalizeVote(uint256 voteId) external {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Revealing, "Not in reveal phase");
        require(block.timestamp >= vote.revealEndTime, "Reveal phase not ended");
        require(!vote.finalized, "Already finalized");

        vote.finalized = true;
        vote.stage = VoteStage.Finalized;

        // Find the option with minimum votes (minority wins)
        uint256 minVotes = type(uint256).max;
        uint256 winningOptionIndex = 0;
        uint256 optionsWithMinVotes = 0;

        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            uint256 optionTotal = vote.optionTotals[i];
            if (optionTotal > 0 && optionTotal < minVotes) {
                minVotes = optionTotal;
                winningOptionIndex = i;
                optionsWithMinVotes = 1;
            } else if (optionTotal == minVotes) {
                optionsWithMinVotes++;
            }
        }

        // If tie, no winner (winningOption will be handled in reward calculation)
        if (optionsWithMinVotes > 1) {
            vote.winningOption = type(uint256).max; // Special value for tie
        } else {
            vote.winningOption = winningOptionIndex;
        }

        vote.stage = VoteStage.Claiming;

        emit VoteFinalized(voteId, vote.winningOption, minVotes);
    }

    // Calculate reward for a player
    function calculateReward(uint256 voteId, address player) public view returns (uint256) {
        Vote storage vote = votes[voteId];
        Commit storage playerCommit = commits[voteId][player];

        if (!vote.finalized || !playerCommit.revealed) {
            return 0;
        }

        // If tie, return deposit + bet
        if (vote.winningOption == type(uint256).max) {
            return playerCommit.betAmount + playerCommit.depositAmount;
        }

        // If not winner, return 0
        if (playerCommit.choice != vote.winningOption) {
            return 0;
        }

        // Calculate total winning and losing amounts
        uint256 winningTotal = vote.optionTotals[vote.winningOption];
        uint256 losingTotal = 0;

        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            if (i != vote.winningOption) {
                losingTotal += vote.optionTotals[i];
            }
        }

        // Calculate proportional share of losing bets
        uint256 share = (losingTotal * playerCommit.betAmount) / winningTotal;
        return playerCommit.betAmount + playerCommit.depositAmount + share;
    }

    // Claim reward
    function claimReward(uint256 voteId) external nonReentrant {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Claiming, "Not in claiming phase");

        Commit storage playerCommit = commits[voteId][msg.sender];
        require(playerCommit.commitHash != bytes32(0), "No commit found");

        uint256 reward = 0;

        if (!playerCommit.revealed) {
            emit DepositConfiscated(voteId, msg.sender, playerCommit.depositAmount);
        } else {
            reward = calculateReward(voteId, msg.sender);
            require(reward > 0, "No reward to claim");
        }

        delete commits[voteId][msg.sender];

        if (reward > 0) {
            payable(msg.sender).transfer(reward);
            emit RewardClaimed(voteId, msg.sender, reward);
        }
    }

    // View functions
    function getVoteInfo(uint256 voteId) external view returns (
        uint256 id,
        address creator,
        string memory question,
        string[] memory options,
        VoteStage stage,
        uint256 commitEndTime,
        uint256 revealEndTime,
        uint256 totalDeposits,
        bool finalized,
        uint256 winningOption,
        uint256 createdAt
    ) {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");

        return (
            vote.voteId,
            vote.creator,
            vote.question,
            voteOptions[voteId],
            vote.stage,
            vote.commitEndTime,
            vote.revealEndTime,
            vote.totalDeposits,
            vote.finalized,
            vote.winningOption,
            vote.createdAt
        );
    }

    function getOptionTotal(uint256 voteId, uint256 optionIndex) external view returns (uint256) {
        require(votes[voteId].voteId != 0, "Vote does not exist");
        require(optionIndex < voteOptions[voteId].length, "Invalid option index");
        return votes[voteId].optionTotals[optionIndex];
    }

    function getCommit(uint256 voteId, address player) external view returns (Commit memory) {
        return commits[voteId][player];
    }

    function getParticipants(uint256 voteId) external view returns (address[] memory) {
        return participants[voteId];
    }

    function getAllActiveVotes() external view returns (uint256[] memory) {
        uint256[] memory activeVotes = new uint256[](voteCounter);
        uint256 count = 0;

        for (uint256 i = 1; i <= voteCounter; i++) {
            if (votes[i].stage != VoteStage.Claiming && votes[i].stage != VoteStage.Finalized) {
                activeVotes[count] = i;
                count++;
            }
        }

        // Resize array
        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeVotes[i];
        }

        return result;
    }
}
