const { ethers } = require("hardhat");

async function main() {
    console.log("开始部署 VotingGame 合约...");

    // 获取部署账户
    const [deployer] = await ethers.getSigners();
    console.log("部署账户:", deployer.address);

    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("账户余额:", ethers.formatEther(balance), "ETH");

    // 部署合约
    console.log("\n正在部署合约...");
    const VotingGame = await ethers.getContractFactory("VotingGame");
    const votingGame = await VotingGame.deploy();

    await votingGame.waitForDeployment();

    const contractAddress = await votingGame.getAddress();
    console.log("✅ VotingGame 合约已部署到:", contractAddress);

    // 验证部署
    console.log("\n验证部署...");
    const voteCounter = await votingGame.voteCounter();
    console.log("初始投票计数:", voteCounter.toString());

    // 输出配置信息
    console.log("\n=== 配置信息 ===");
    console.log("合约地址:", contractAddress);
    console.log("网络:", (await ethers.provider.getNetwork()).name);
    console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

    console.log("\n=== 前端配置 ===");
    console.log("请将以下地址更新到 frontend/voting.js 中:");
    console.log(`const CONTRACT_ADDRESS = "${contractAddress}";`);

    // 保存部署信息
    const fs = require("fs");
    const deploymentInfo = {
        contractAddress: contractAddress,
        deployer: deployer.address,
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber()
    };

    fs.writeFileSync(
        "deployment-info.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n✅ 部署信息已保存到 deployment-info.json");

    return contractAddress;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
