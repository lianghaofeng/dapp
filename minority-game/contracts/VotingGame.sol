// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @dev Contract module that helps prevent reentrant calls to a function.
 */
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;
    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
        _;
        _status = _NOT_ENTERED;
    }
}

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
        mapping(uint256 => uint256) optionTotals;
        uint256 totalBets;
        bool finalized;
        uint256 winningOption;
        uint256 createdAt;
    }

    struct Commit {
        bytes32 commitHash;
        bool revealed;
        uint256 choice;
        uint256 betAmount;
    }

    // 用于返回投票信息的struct（避免Stack too deep）
    struct VoteInfo {
        uint256 voteId;
        address creator;
        string question;
        string[] options;
        VoteStage stage;
        uint256 commitEndTime;
        uint256 revealEndTime;
        uint256 totalBets;
        bool finalized;
        uint256 winningOption;
        uint256 createdAt;
    }

    uint256 public voteCounter;
    mapping(uint256 => Vote) private votes;
    mapping(uint256 => string[]) public voteOptions;
    mapping(uint256 => mapping(address => Commit)) public commits;
    mapping(uint256 => address[]) public participants;

    uint256 public constant DEFAULT_COMMIT_DURATION = 1 hours;
    uint256 public constant DEFAULT_REVEAL_DURATION = 30 minutes;
    uint256 public constant MIN_COMMIT_DURATION = 5 seconds;
    uint256 public constant MAX_COMMIT_DURATION = 7 days;
    uint256 public constant MIN_REVEAL_DURATION = 5 seconds;
    uint256 public constant MAX_REVEAL_DURATION = 1 days;
    uint256 public constant MIN_OPTIONS = 2;
    uint256 public constant MAX_OPTIONS = 10;

    event VoteCreated(
        uint256 indexed voteId,
        address indexed creator,
        string question,
        uint256 optionsCount,
        uint256 commitEndTime
    );
    event CommitSubmitted(uint256 indexed voteId, address indexed player, uint256 betAmount);
    event RevealSubmitted(uint256 indexed voteId, address indexed player, uint256 choice, uint256 amount);
    event VoteFinalized(uint256 indexed voteId, uint256 winningOption, uint256 winningTotal);
    event RewardClaimed(uint256 indexed voteId, address indexed player, uint256 reward);
    event BetConfiscated(uint256 indexed voteId, address indexed player, uint256 amount);

    function createVote(
        string memory question,
        string[] memory options,
        uint256 commitDuration,
        uint256 revealDuration
    ) external returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= MIN_OPTIONS, "At least 2 options required");
        require(options.length <= MAX_OPTIONS, "Too many options");

        // Validate custom durations (use defaults if 0)
        uint256 actualCommitDuration = commitDuration == 0 ? DEFAULT_COMMIT_DURATION : commitDuration;
        uint256 actualRevealDuration = revealDuration == 0 ? DEFAULT_REVEAL_DURATION : revealDuration;

        require(actualCommitDuration >= MIN_COMMIT_DURATION, "Commit duration too short");
        require(actualCommitDuration <= MAX_COMMIT_DURATION, "Commit duration too long");
        require(actualRevealDuration >= MIN_REVEAL_DURATION, "Reveal duration too short");
        require(actualRevealDuration <= MAX_REVEAL_DURATION, "Reveal duration too long");

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
        newVote.commitEndTime = block.timestamp + actualCommitDuration;
        newVote.revealEndTime = block.timestamp + actualCommitDuration + actualRevealDuration;
        newVote.createdAt = block.timestamp;

        voteOptions[voteId] = options;

        emit VoteCreated(voteId, msg.sender, question, options.length, newVote.commitEndTime);

        return voteId;
    }

    function commit(uint256 voteId, bytes32 commitHash) external payable nonReentrant {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Committing, "Not in commit phase");
        require(block.timestamp < vote.commitEndTime, "Commit phase ended");
        require(commits[voteId][msg.sender].commitHash == bytes32(0), "Already committed");
        require(msg.value > 0, "Bet amount required");

        commits[voteId][msg.sender] = Commit({
            commitHash: commitHash,
            revealed: false,
            choice: 0,
            betAmount: msg.value
        });

        participants[voteId].push(msg.sender);
        vote.totalBets += msg.value;

        emit CommitSubmitted(voteId, msg.sender, msg.value);
    }

    function startRevealPhase(uint256 voteId) external {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Committing, "Not in commit phase");
        require(block.timestamp >= vote.commitEndTime, "Commit phase not ended");
        vote.stage = VoteStage.Revealing;
    }

    function reveal(
        uint256 voteId,
        uint256 choice,
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
            abi.encodePacked(voteId, choice, secret, msg.sender)
        );
        require(computedHash == playerCommit.commitHash, "Hash mismatch");

        playerCommit.revealed = true;
        playerCommit.choice = choice;

        vote.optionTotals[choice] += playerCommit.betAmount;

        emit RevealSubmitted(voteId, msg.sender, choice, playerCommit.betAmount);
    }

    function finalizeVote(uint256 voteId) external {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Revealing, "Not in reveal phase");
        require(block.timestamp >= vote.revealEndTime, "Reveal phase not ended");
        require(!vote.finalized, "Already finalized");

        vote.finalized = true;
        vote.stage = VoteStage.Finalized;

        uint256 minVotes = type(uint256).max;
        uint256 winningOptionIndex = 0;
        uint256 optionsWithMinVotes = 0;

        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            uint256 optionTotal = vote.optionTotals[i];
            if (optionTotal > 0 && optionTotal < minVotes) {
                minVotes = optionTotal;
                winningOptionIndex = i;
                optionsWithMinVotes = 1;
            } else if (optionTotal == minVotes && optionTotal > 0) {
                optionsWithMinVotes++;
            }
        }

        if (optionsWithMinVotes > 1) {
            vote.winningOption = type(uint256).max;
        } else {
            vote.winningOption = winningOptionIndex;
        }

        vote.stage = VoteStage.Claiming;

        emit VoteFinalized(voteId, vote.winningOption, minVotes);
    }

    function calculateReward(uint256 voteId, address player) public view returns (uint256) {
        Vote storage vote = votes[voteId];
        Commit storage playerCommit = commits[voteId][player];

        if (!vote.finalized || !playerCommit.revealed) {
            return 0;
        }

        if (vote.winningOption == type(uint256).max) {
            return playerCommit.betAmount;
        }

        if (playerCommit.choice != vote.winningOption) {
            return 0;
        }

        uint256 winningTotal = vote.optionTotals[vote.winningOption];
        uint256 losingTotal = 0;

        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            if (i != vote.winningOption) {
                losingTotal += vote.optionTotals[i];
            }
        }

        uint256 share = (losingTotal * playerCommit.betAmount) / winningTotal;
        return playerCommit.betAmount + share;
    }

    function claimReward(uint256 voteId) external nonReentrant {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");
        require(vote.stage == VoteStage.Claiming, "Not in claiming phase");

        Commit storage playerCommit = commits[voteId][msg.sender];
        require(playerCommit.commitHash != bytes32(0), "No commit found");

        uint256 reward = 0;

        if (!playerCommit.revealed) {
            emit BetConfiscated(voteId, msg.sender, playerCommit.betAmount);
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

    // 使用struct返回避免Stack too deep错误
    function getVoteInfo(uint256 voteId) external view returns (VoteInfo memory) {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");

        return VoteInfo({
            voteId: vote.voteId,
            creator: vote.creator,
            question: vote.question,
            options: voteOptions[voteId],
            stage: vote.stage,
            commitEndTime: vote.commitEndTime,
            revealEndTime: vote.revealEndTime,
            totalBets: vote.totalBets,
            finalized: vote.finalized,
            winningOption: vote.winningOption,
            createdAt: vote.createdAt
        });
    }

    // 简化版本的查询函数（避免Stack too deep）
    function getVoteBasicInfo(uint256 voteId) external view returns (
        string memory question,
        string[] memory options,
        VoteStage stage,
        uint256 commitEndTime,
        uint256 revealEndTime
    ) {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");

        return (
            vote.question,
            voteOptions[voteId],
            vote.stage,
            vote.commitEndTime,
            vote.revealEndTime
        );
    }

    function getVoteStatus(uint256 voteId) external view returns (
        uint256 totalBets,
        bool finalized,
        uint256 winningOption,
        address creator
    ) {
        Vote storage vote = votes[voteId];
        require(vote.voteId != 0, "Vote does not exist");

        return (
            vote.totalBets,
            vote.finalized,
            vote.winningOption,
            vote.creator
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

        uint256[] memory result = new uint256[](count);
        for (uint256 i = 0; i < count; i++) {
            result[i] = activeVotes[i];
        }

        return result;
    }
}
