// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * Baseline Implementation: Open Voting (No Commit-Reveal)
 *
 * This is the control group implementation where votes are
 * immediately visible, allowing strategic voting.
 *
 * Used for comparison to prove commit-reveal effectiveness.
 */

contract OpenVotingGame {
    enum VoteStage { Active, Voting, Finalized, Claiming }

    struct Vote {
        uint256 voteId;
        address creator;
        string question;
        string[] options;
        VoteStage stage;
        uint256 votingEndTime;
        mapping(uint256 => uint256) optionTotals;
        mapping(uint256 => address[]) optionVoters; // Track who voted for what
        uint256 totalBets;
        bool finalized;
        uint256 winningOption;
    }

    struct PlayerVote {
        uint256 choice;
        uint256 betAmount;
        bool hasVoted;
    }

    uint256 public voteCounter;
    mapping(uint256 => Vote) private votes;
    mapping(uint256 => string[]) public voteOptions;
    mapping(uint256 => mapping(address => PlayerVote)) public playerVotes;
    mapping(uint256 => address[]) public participants;

    event VoteCreated(uint256 indexed voteId, address indexed creator, string question);
    event VoteSubmitted(uint256 indexed voteId, address indexed player, uint256 choice, uint256 amount);
    event VoteFinalized(uint256 indexed voteId, uint256 winningOption);
    event RewardClaimed(uint256 indexed voteId, address indexed player, uint256 reward);

    function createVote(
        string memory question,
        string[] memory options,
        uint256 votingDuration
    ) external returns (uint256) {
        require(bytes(question).length > 0, "Question cannot be empty");
        require(options.length >= 2, "At least 2 options required");

        voteCounter++;
        uint256 voteId = voteCounter;

        Vote storage newVote = votes[voteId];
        newVote.voteId = voteId;
        newVote.creator = msg.sender;
        newVote.question = question;
        newVote.stage = VoteStage.Voting;
        newVote.votingEndTime = block.timestamp + (votingDuration == 0 ? 3600 : votingDuration);

        voteOptions[voteId] = options;

        emit VoteCreated(voteId, msg.sender, question);

        return voteId;
    }

    /**
     * Vote immediately - choice is visible on blockchain right away
     * This allows later voters to see previous votes and strategize
     */
    function vote(uint256 voteId, uint256 choice) external payable {
        Vote storage vt = votes[voteId];
        require(vt.voteId != 0, "Vote does not exist");
        require(vt.stage == VoteStage.Voting, "Not in voting phase");
        require(block.timestamp < vt.votingEndTime, "Voting ended");
        require(!playerVotes[voteId][msg.sender].hasVoted, "Already voted");
        require(choice < voteOptions[voteId].length, "Invalid choice");
        require(msg.value > 0, "Bet amount required");

        playerVotes[voteId][msg.sender] = PlayerVote({
            choice: choice,
            betAmount: msg.value,
            hasVoted: true
        });

        participants[voteId].push(msg.sender);
        vt.optionTotals[choice] += msg.value;
        vt.optionVoters[choice].push(msg.sender);
        vt.totalBets += msg.value;

        emit VoteSubmitted(voteId, msg.sender, choice, msg.value);
    }

    function finalizeVote(uint256 voteId) external {
        Vote storage vt = votes[voteId];
        require(vt.voteId != 0, "Vote does not exist");
        require(vt.stage == VoteStage.Voting, "Not in voting phase");
        require(block.timestamp >= vt.votingEndTime, "Voting not ended");
        require(!vt.finalized, "Already finalized");

        vt.finalized = true;
        vt.stage = VoteStage.Finalized;

        uint256 minVotes = type(uint256).max;
        uint256 winningOptionIndex = 0;

        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            uint256 optionTotal = vt.optionTotals[i];
            if (optionTotal > 0 && optionTotal < minVotes) {
                minVotes = optionTotal;
                winningOptionIndex = i;
            }
        }

        vt.winningOption = winningOptionIndex;
        vt.stage = VoteStage.Claiming;

        emit VoteFinalized(voteId, winningOptionIndex);
    }

    function calculateReward(uint256 voteId, address player) public view returns (uint256) {
        Vote storage vt = votes[voteId];
        PlayerVote storage pv = playerVotes[voteId][player];

        if (!vt.finalized || !pv.hasVoted) {
            return 0;
        }

        if (pv.choice != vt.winningOption) {
            return 0;
        }

        uint256 winningTotal = vt.optionTotals[vt.winningOption];
        uint256 losingTotal = 0;

        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            if (i != vt.winningOption) {
                losingTotal += vt.optionTotals[i];
            }
        }

        uint256 share = (losingTotal * pv.betAmount) / winningTotal;
        return pv.betAmount + share;
    }

    function claimReward(uint256 voteId) external {
        Vote storage vt = votes[voteId];
        require(vt.voteId != 0, "Vote does not exist");
        require(vt.stage == VoteStage.Claiming, "Not in claiming phase");

        PlayerVote storage pv = playerVotes[voteId][msg.sender];
        require(pv.hasVoted, "No vote found");

        uint256 reward = calculateReward(voteId, msg.sender);
        require(reward > 0, "No reward to claim");

        delete playerVotes[voteId][msg.sender];

        payable(msg.sender).transfer(reward);
        emit RewardClaimed(voteId, msg.sender, reward);
    }

    /**
     * Get current vote distribution - VISIBLE DURING VOTING
     * This is the key difference from commit-reveal
     */
    function getCurrentDistribution(uint256 voteId) external view returns (uint256[] memory) {
        uint256[] memory distribution = new uint256[](voteOptions[voteId].length);
        for (uint256 i = 0; i < voteOptions[voteId].length; i++) {
            distribution[i] = votes[voteId].optionTotals[i];
        }
        return distribution;
    }

    function getParticipants(uint256 voteId) external view returns (address[] memory) {
        return participants[voteId];
    }

    function getPlayerVote(uint256 voteId, address player) external view returns (PlayerVote memory) {
        return playerVotes[voteId][player];
    }
}
