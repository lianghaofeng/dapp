const { expect } = require("chai");
const { ethers } = require("hardhat");
const { time } = require("@nomicfoundation/hardhat-network-helpers");

describe("VotingGame", function () {
    let votingGame;
    let owner;
    let player1;
    let player2;
    let player3;
    let player4;

    const COMMIT_DURATION = 3600; // 1 hour
    const REVEAL_DURATION = 1800; // 30 minutes

    beforeEach(async function () {
        [owner, player1, player2, player3, player4] = await ethers.getSigners();

        const VotingGame = await ethers.getContractFactory("VotingGame");
        votingGame = await VotingGame.deploy();
        await votingGame.waitForDeployment();
    });

    describe("创建投票", function () {
        it("应该能够成功创建投票", async function () {
            const question = "你最喜欢的颜色是什么？";
            const options = ["红色", "蓝色", "绿色"];

            const tx = await votingGame.createVote(question, options);
            const receipt = await tx.wait();

            // 验证事件
            const event = receipt.logs.find(log => {
                try {
                    return votingGame.interface.parseLog(log).name === "VoteCreated";
                } catch {
                    return false;
                }
            });
            expect(event).to.not.be.undefined;

            // 验证投票信息
            const voteInfo = await votingGame.getVoteInfo(1);
            expect(voteInfo.voteId).to.equal(1);
            expect(voteInfo.creator).to.equal(owner.address);
            expect(voteInfo.question).to.equal(question);
            expect(voteInfo.options).to.deep.equal(options);
            expect(voteInfo.stage).to.equal(1); // Committing stage
        });

        it("不应该允许创建少于2个选项的投票", async function () {
            const question = "测试问题";
            const options = ["唯一选项"];

            await expect(
                votingGame.createVote(question, options)
            ).to.be.revertedWith("At least 2 options required");
        });

        it("不应该允许创建超过10个选项的投票", async function () {
            const question = "测试问题";
            const options = Array(11).fill("选项");

            await expect(
                votingGame.createVote(question, options)
            ).to.be.revertedWith("Too many options");
        });

        it("不应该允许空问题", async function () {
            const question = "";
            const options = ["选项1", "选项2"];

            await expect(
                votingGame.createVote(question, options)
            ).to.be.revertedWith("Question cannot be empty");
        });

        it("不应该允许空选项", async function () {
            const question = "测试问题";
            const options = ["选项1", ""];

            await expect(
                votingGame.createVote(question, options)
            ).to.be.revertedWith("Option cannot be empty");
        });
    });

    describe("提交投票 (Commit Phase)", function () {
        let voteId;
        const question = "测试问题";
        const options = ["选项A", "选项B", "选项C"];

        beforeEach(async function () {
            const tx = await votingGame.createVote(question, options);
            await tx.wait();
            voteId = 1;
        });

        it("应该能够成功提交commit", async function () {
            const choice = 0;
            const betAmount = ethers.parseEther("1.0");
            const secret = ethers.hexlify(ethers.randomBytes(32));

            // 新的commitHash：只有4个参数（移除了betAmount）
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(
                    ["uint256", "uint256", "bytes32", "address"],
                    [voteId, choice, secret, player1.address]
                )
            );

            // 100%押金模式：直接支付全额
            const tx = await votingGame.connect(player1).commit(voteId, commitHash, {
                value: betAmount
            });

            await expect(tx)
                .to.emit(votingGame, "CommitSubmitted")
                .withArgs(voteId, player1.address, betAmount);

            const commitInfo = await votingGame.getCommit(voteId, player1.address);
            expect(commitInfo.commitHash).to.equal(commitHash);
            expect(commitInfo.betAmount).to.equal(betAmount);
            expect(commitInfo.revealed).to.be.false;
        });

        it("不应该允许不支付deposit的commit", async function () {
            const commitHash = ethers.hexlify(ethers.randomBytes(32));

            await expect(
                votingGame.connect(player1).commit(voteId, commitHash, { value: 0 })
            ).to.be.revertedWith("Bet amount required");
        });

        it("不应该允许重复commit", async function () {
            const commitHash = ethers.hexlify(ethers.randomBytes(32));
            const betAmount = ethers.parseEther("0.5");

            await votingGame.connect(player1).commit(voteId, commitHash, { value: betAmount });

            await expect(
                votingGame.connect(player1).commit(voteId, commitHash, { value: betAmount })
            ).to.be.revertedWith("Already committed");
        });

        it("不应该允许在commit阶段结束后提交", async function () {
            await time.increase(COMMIT_DURATION + 1);

            const commitHash = ethers.hexlify(ethers.randomBytes(32));
            const betAmount = ethers.parseEther("0.5");

            await expect(
                votingGame.connect(player1).commit(voteId, commitHash, { value: betAmount })
            ).to.be.revertedWith("Commit phase ended");
        });
    });

    describe("揭示投票 (Reveal Phase)", function () {
        let voteId;
        const question = "测试问题";
        const options = ["选项A", "选项B"];

        beforeEach(async function () {
            const tx = await votingGame.createVote(question, options);
            await tx.wait();
            voteId = 1;
        });

        it("应该能够成功揭示投票", async function () {
            // Player1 commits
            const choice = 0;
            const betAmount = ethers.parseEther("1.0");
            const secret = ethers.hexlify(ethers.randomBytes(32));

            // 新的commitHash：4个参数
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(
                    ["uint256", "uint256", "bytes32", "address"],
                    [voteId, choice, secret, player1.address]
                )
            );

            // 100%支付
            await votingGame.connect(player1).commit(voteId, commitHash, { value: betAmount });

            // Move to reveal phase
            await time.increase(COMMIT_DURATION + 1);
            await votingGame.startRevealPhase(voteId);

            // 新的reveal：3个参数（移除了betAmount）
            const tx = await votingGame.connect(player1).reveal(
                voteId,
                choice,
                secret
            );

            await expect(tx)
                .to.emit(votingGame, "RevealSubmitted")
                .withArgs(voteId, player1.address, choice, betAmount);

            const commitInfo = await votingGame.getCommit(voteId, player1.address);
            expect(commitInfo.revealed).to.be.true;
            expect(commitInfo.choice).to.equal(choice);
            expect(commitInfo.betAmount).to.equal(betAmount);
        });

        it("不应该允许在commit阶段揭示", async function () {
            const choice = 0;
            const secret = ethers.hexlify(ethers.randomBytes(32));

            await expect(
                votingGame.connect(player1).reveal(voteId, choice, secret)
            ).to.be.revertedWith("Not in reveal phase");
        });

        it("不应该允许错误的哈希揭示", async function () {
            const choice = 0;
            const betAmount = ethers.parseEther("1.0");
            const secret = ethers.hexlify(ethers.randomBytes(32));

            const commitHash = ethers.keccak256(
                ethers.solidityPacked(
                    ["uint256", "uint256", "bytes32", "address"],
                    [voteId, choice, secret, player1.address]
                )
            );

            await votingGame.connect(player1).commit(voteId, commitHash, { value: betAmount });

            await time.increase(COMMIT_DURATION + 1);
            await votingGame.startRevealPhase(voteId);

            // Try to reveal with wrong choice
            await expect(
                votingGame.connect(player1).reveal(voteId, 1, secret)
            ).to.be.revertedWith("Hash mismatch");
        });
    });

    describe("结算投票", function () {
        let voteId;
        const question = "测试问题";
        const options = ["选项A", "选项B", "选项C"];

        beforeEach(async function () {
            const tx = await votingGame.createVote(question, options);
            await tx.wait();
            voteId = 1;
        });

        it("应该正确计算少数派获胜", async function () {
            // 所有玩家自动commit和reveal
            await commitAndRevealMultiple([
                { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") }, // Option 0, 1 ETH
                { player: player2, choice: 1, betAmount: ethers.parseEther("2.0") }, // Option 1, 2 ETH
                { player: player3, choice: 1, betAmount: ethers.parseEther("3.0") }  // Option 1, 3 ETH
            ]);

            // Move to finalize
            await time.increase(REVEAL_DURATION + 1);
            await votingGame.finalizeVote(voteId);

            const voteInfo = await votingGame.getVoteInfo(voteId);
            expect(voteInfo.winningOption).to.equal(0); // Option 0 is minority

            // Check totals
            const option0Total = await votingGame.getOptionTotal(voteId, 0);
            const option1Total = await votingGame.getOptionTotal(voteId, 1);
            expect(option0Total).to.equal(ethers.parseEther("1.0"));
            expect(option1Total).to.equal(ethers.parseEther("5.0"));
        });

        it("应该正确计算奖励", async function () {
            // 所有玩家自动commit和reveal
            await commitAndRevealMultiple([
                { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") }, // Option 0, 1 ETH (winner)
                { player: player2, choice: 1, betAmount: ethers.parseEther("2.0") }, // Option 1, 2 ETH
                { player: player3, choice: 1, betAmount: ethers.parseEther("3.0") }  // Option 1, 3 ETH
            ]);

            await time.increase(REVEAL_DURATION + 1);
            await votingGame.finalizeVote(voteId);

            // 100%押金模式：Player1应该获得自己的1 ETH + 失败者的5 ETH = 6 ETH
            const reward = await votingGame.calculateReward(voteId, player1.address);

            // Reward = betAmount + (losingTotal * betAmount / winningTotal)
            // = 1 + (5 * 1 / 1) = 6 ETH
            expect(reward).to.equal(ethers.parseEther("6.0"));
        });

        it("应该允许获胜者领取奖励", async function () {
            // 所有玩家自动commit和reveal
            await commitAndRevealMultiple([
                { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") },
                { player: player2, choice: 1, betAmount: ethers.parseEther("2.0") }
            ]);

            await time.increase(REVEAL_DURATION + 1);
            await votingGame.finalizeVote(voteId);

            const balanceBefore = await ethers.provider.getBalance(player1.address);

            const tx = await votingGame.connect(player1).claimReward(voteId);
            const receipt = await tx.wait();

            const gasUsed = receipt.gasUsed * receipt.gasPrice;
            const balanceAfter = await ethers.provider.getBalance(player1.address);

            // Player1 should receive rewards
            expect(balanceAfter).to.be.gt(balanceBefore - gasUsed);
        });

        it("失败者不应该获得奖励", async function () {
            // 所有玩家自动commit和reveal
            await commitAndRevealMultiple([
                { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") },
                { player: player2, choice: 1, betAmount: ethers.parseEther("2.0") }
            ]);

            await time.increase(REVEAL_DURATION + 1);
            await votingGame.finalizeVote(voteId);

            const reward = await votingGame.calculateReward(voteId, player2.address);
            expect(reward).to.equal(0);
        });

        it("未揭示的玩家应该失去押金", async function () {
            const choice = 0;
            const betAmount = ethers.parseEther("1.0");
            const secret = ethers.hexlify(ethers.randomBytes(32));

            // 新的commitHash：4个参数
            const commitHash = ethers.keccak256(
                ethers.solidityPacked(
                    ["uint256", "uint256", "bytes32", "address"],
                    [voteId, choice, secret, player1.address]
                )
            );

            // 100%支付
            await votingGame.connect(player1).commit(voteId, commitHash, { value: betAmount });

            // Don't reveal, just finalize
            await time.increase(COMMIT_DURATION + REVEAL_DURATION + 1);
            await votingGame.connect(player2).startRevealPhase(voteId);
            await votingGame.finalizeVote(voteId);

            const reward = await votingGame.calculateReward(voteId, player1.address);
            expect(reward).to.equal(0);

            // 新的事件名：BetConfiscated
            await expect(
                votingGame.connect(player1).claimReward(voteId)
            ).to.emit(votingGame, "BetConfiscated");
        });
    });

    describe("查询功能", function () {
        it("应该能够获取所有活跃投票", async function () {
            await votingGame.createVote("问题1", ["选项A", "选项B"]);
            await votingGame.createVote("问题2", ["选项C", "选项D"]);

            const activeVotes = await votingGame.getAllActiveVotes();
            expect(activeVotes.length).to.equal(2);
        });

        it("应该能够获取投票参与者", async function () {
            await votingGame.createVote("测试", ["A", "B"]);
            const voteId = 1;

            // 所有玩家自动commit和reveal
            await commitAndRevealMultiple([
                { player: player1, choice: 0, betAmount: ethers.parseEther("1.0") },
                { player: player2, choice: 1, betAmount: ethers.parseEther("1.0") }
            ]);

            const participants = await votingGame.getParticipants(voteId);
            expect(participants.length).to.equal(2);
            expect(participants).to.include(player1.address);
            expect(participants).to.include(player2.address);
        });
    });

    // Helper functions - 完全重写以支持100%押金模式
    // 存储每个玩家的commit信息
    const commits = new Map();

    // 阶段1：提交commit
    async function doCommit(player, choice, betAmount) {
        const secret = ethers.hexlify(ethers.randomBytes(32));
        const voteId = 1;

        // 新的commitHash：4个参数（移除betAmount）
        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ["uint256", "uint256", "bytes32", "address"],
                [voteId, choice, secret, player.address]
            )
        );

        // 100%押金模式：直接支付全额
        await votingGame.connect(player).commit(voteId, commitHash, { value: betAmount });

        // 保存commit信息供后续reveal使用
        commits.set(player.address, { player, choice, secret });
    }

    // 阶段2：切换到reveal阶段并reveal所有玩家
    async function doRevealAll() {
        const voteId = 1;

        // 切换到reveal阶段
        await time.increase(COMMIT_DURATION + 1);
        await votingGame.startRevealPhase(voteId);

        // Reveal所有玩家
        for (const [address, info] of commits.entries()) {
            await votingGame.connect(info.player).reveal(voteId, info.choice, info.secret);
        }
    }

    // 便捷函数：一次性完成多个玩家的commit和reveal
    async function commitAndRevealMultiple(playerCommits) {
        // playerCommits: [{player, choice, betAmount}, ...]
        // 先让所有玩家commit
        for (const c of playerCommits) {
            await doCommit(c.player, c.choice, c.betAmount);
        }
        // 统一reveal
        await doRevealAll();
    }

    // Reset helper for each test
    beforeEach(function() {
        commits.clear();
    });
});
