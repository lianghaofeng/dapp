// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract MinorityGame is ReentrancyGuard, Ownable {
    enum GameStage { NotStarted, Committing, Revealing, Finalized, Claiming }

    struct Game {
        uint256 gameId;
        GameStage stage;
        uint256 commitEndTime;
        uint256 revealEndTime;
        uint256 totalOptionA;
        uint256 totalOptionB;
        uint256 totalDeposits;
        bool finalized;
        uint8 winningOption;
    }

    struct Commit {
        bytes32 commitHash;
        uint256 depositAmount;
        bool revealed;
        uint8 choice;
        uint256 betAmount;
    }

    uint256 public currentGameId;
    mapping(uint256 => Game) public games;
    mapping(uint256 => mapping(address => Commit)) public commits;
    mapping(uint256 => address[]) public participants;

    uint256 public constant COMMIT_DURATION = 1 hours;
    uint256 public constant REVEAL_DURATION = 30 minutes;
    uint256 public constant MIN_DEPOSIT_RATE = 30;
    uint256 public constant MAX_DEPOSIT_RATE = 70;

    event GameStarted(uint256 indexed gameId, uint256 commitEndTime, uint256 revealEndTime);
    event CommitSubmitted(uint256 indexed gameId, address indexed player, uint256 depositAmount);
    event RevealSubmitted(uint256 indexed gameId, address indexed player, uint8 choice, uint256 amount);
    event GameFinalized(uint256 indexed gameId, uint8 winningOption, uint256 totalA, uint256 totalB);
    event RewardClaimed(uint256 indexed gameId, address indexed player, uint256 reward);
    event DepositConfiscated(uint256 indexed gameId, address indexed player, uint256 amount);

    // Constructor: 如果传入 initialOwner 且非 0 地址，就把 owner 设置为它；否则 owner 为部署者（Ownable 的默认）
    constructor (address initialOwner) Ownable(initialOwner){
        currentGameId = 0;
        if (initialOwner != address(0)) {
            _transferOwnership(initialOwner); // OpenZeppelin internal hook
        }
    }

    function startGame() external onlyOwner {
        currentGameId++;
        games[currentGameId] = Game({
            gameId: currentGameId,
            stage: GameStage.Committing,
            commitEndTime: block.timestamp + COMMIT_DURATION,
            revealEndTime: block.timestamp + COMMIT_DURATION + REVEAL_DURATION,
            totalOptionA: 0,
            totalOptionB: 0,
            totalDeposits: 0,
            finalized: false,
            winningOption: 0
        });
        emit GameStarted(currentGameId, games[currentGameId].commitEndTime, games[currentGameId].revealEndTime);
    }

    // commit / reveal / finalize / calculateReward / claimReward 等保持原逻辑（你原代码良好）
    // 我把你原有的函数原样保留（提交/揭示/结算逻辑），此处省略重复粘贴（如需我可完整再贴一次）。
    // 下面保留你原有实现（和你给我的代码一致）。

    function calculateDeposit(uint256 betAmount, uint256 randomSeed) internal pure returns (uint256) {
        uint256 rate = MIN_DEPOSIT_RATE + (randomSeed % (MAX_DEPOSIT_RATE - MIN_DEPOSIT_RATE + 1));
        return (betAmount * rate) / 100;
    }

    function commit(uint256 gameId, bytes32 commitHash) external payable nonReentrant {
        Game storage game = games[gameId];
        require(game.stage == GameStage.Committing, "Not in commit phase");
        require(block.timestamp < game.commitEndTime, "Commit phase ended");
        require(commits[gameId][msg.sender].commitHash == bytes32(0), "Already committed");
        require(msg.value > 0, "Deposit required");

        commits[gameId][msg.sender] = Commit({
            commitHash: commitHash,
            depositAmount: msg.value,
            revealed: false,
            choice: 0,
            betAmount: 0
        });

        participants[gameId].push(msg.sender);
        game.totalDeposits += msg.value;

        emit CommitSubmitted(gameId, msg.sender, msg.value);
    }

    function startRevealPhase(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.stage == GameStage.Committing, "Not in commit phase");
        require(block.timestamp >= game.commitEndTime, "Commit phase not ended");
        game.stage = GameStage.Revealing;
    }

    function reveal(uint256 gameId, uint8 choice, uint256 betAmount, bytes32 secret) external nonReentrant {
        Game storage game = games[gameId];
        require(game.stage == GameStage.Revealing, "Not in reveal phase");
        require(block.timestamp < game.revealEndTime, "Reveal phase ended");
        require(choice == 1 || choice == 2, "Invalid choice");

        Commit storage playerCommit = commits[gameId][msg.sender];
        require(playerCommit.commitHash != bytes32(0), "No commit found");
        require(!playerCommit.revealed, "Already revealed");

        bytes32 computedHash = keccak256(abi.encodePacked(gameId, choice, betAmount, secret, msg.sender));
        require(computedHash == playerCommit.commitHash, "Hash mismatch");

        uint256 minDeposit = (betAmount * MIN_DEPOSIT_RATE) / 100;
        uint256 maxDeposit = (betAmount * MAX_DEPOSIT_RATE) / 100;
        require(playerCommit.depositAmount >= minDeposit && playerCommit.depositAmount <= maxDeposit, "Invalid deposit amount");

        playerCommit.revealed = true;
        playerCommit.choice = choice;
        playerCommit.betAmount = betAmount;

        if (choice == 1) {
            game.totalOptionA += betAmount;
        } else {
            game.totalOptionB += betAmount;
        }

        emit RevealSubmitted(gameId, msg.sender, choice, betAmount);
    }

    function finalizeGame(uint256 gameId) external {
        Game storage game = games[gameId];
        require(game.stage == GameStage.Revealing, "Not in reveal phase");
        require(block.timestamp >= game.revealEndTime, "Reveal phase not ended");
        require(!game.finalized, "Already finalized");

        game.finalized = true;
        game.stage = GameStage.Finalized;

        if (game.totalOptionA < game.totalOptionB) {
            game.winningOption = 1;
        } else if (game.totalOptionB < game.totalOptionA) {
            game.winningOption = 2;
        } else {
            game.winningOption = 3;
        }

        game.stage = GameStage.Claiming;

        emit GameFinalized(gameId, game.winningOption, game.totalOptionA, game.totalOptionB);
    }

    function calculateReward(uint256 gameId, address player) public view returns (uint256) {
        Game storage game = games[gameId];
        Commit storage playerCommit = commits[gameId][player];

        if (!game.finalized || !playerCommit.revealed) {
            return 0;
        }

        if (game.winningOption == 3) {
            return playerCommit.betAmount + playerCommit.depositAmount;
        }

        if (playerCommit.choice != game.winningOption) {
            return 0;
        }

        uint256 winningTotal = (game.winningOption == 1) ? game.totalOptionA : game.totalOptionB;
        uint256 losingTotal = (game.winningOption == 1) ? game.totalOptionB : game.totalOptionA;

        uint256 share = (losingTotal * playerCommit.betAmount) / winningTotal;
        return playerCommit.betAmount + playerCommit.depositAmount + share;
    }

    function claimReward(uint256 gameId) external nonReentrant {
        Game storage game = games[gameId];
        require(game.stage == GameStage.Claiming, "Not in claiming phase");

        Commit storage playerCommit = commits[gameId][msg.sender];
        require(playerCommit.commitHash != bytes32(0), "No commit found");

        uint256 reward = 0;

        if (!playerCommit.revealed) {
            emit DepositConfiscated(gameId, msg.sender, playerCommit.depositAmount);
        } else {
            reward = calculateReward(gameId, msg.sender);
            require(reward > 0, "No reward to claim");
        }

        delete commits[gameId][msg.sender];

        if (reward > 0) {
            payable(msg.sender).transfer(reward);
            emit RewardClaimed(gameId, msg.sender, reward);
        }
    }

    function getGameInfo(uint256 gameId) external view returns (Game memory) {
        return games[gameId];
    }

    function getCommit(uint256 gameId, address player) external view returns (Commit memory) {
        return commits[gameId][player];
    }

    function getParticipants(uint256 gameId) external view returns (address[] memory) {
        return participants[gameId];
    }
}
