const { ethers } = require("hardhat");
const fs = require("fs");

async function main() {
    // 读取部署信息
    if (!fs.existsSync("deployment-info.json")) {
        console.error("❌ 找不到 deployment-info.json 文件");
        console.log("请先运行部署脚本");
        process.exit(1);
    }

    const deploymentInfo = JSON.parse(fs.readFileSync("deployment-info.json", "utf8"));
    const contractAddress = deploymentInfo.contractAddress;

    console.log("连接到合约:", contractAddress);

    // 获取合约实例
    const VotingGame = await ethers.getContractFactory("VotingGame");
    const votingGame = VotingGame.attach(contractAddress);

    // 获取签名者
    const [owner] = await ethers.getSigners();
    console.log("当前账户:", owner.address);

    // 演示：创建一个测试投票
    console.log("\n创建测试投票...");
    const question = "你最喜欢的编程语言是？";
    const options = ["JavaScript", "Python", "Rust", "Go"];

    const tx = await votingGame.createVote(question, options);
    console.log("交易已提交:", tx.hash);

    const receipt = await tx.wait();
    console.log("✅ 交易已确认!");

    // 获取投票ID
    const voteCounter = await votingGame.voteCounter();
    const voteId = voteCounter;

    console.log("\n投票ID:", voteId.toString());

    // 获取投票信息
    const voteInfo = await votingGame.getVoteInfo(voteId);
    console.log("\n=== 投票信息 ===");
    console.log("问题:", voteInfo.question);
    console.log("选项:", voteInfo.options);
    console.log("阶段:", ["Active", "Committing", "Revealing", "Finalized", "Claiming"][voteInfo.stage]);
    console.log("提交截止时间:", new Date(Number(voteInfo.commitEndTime) * 1000).toLocaleString());
    console.log("揭示截止时间:", new Date(Number(voteInfo.revealEndTime) * 1000).toLocaleString());

    console.log("\n✅ 交互成功!");
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
