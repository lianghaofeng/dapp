const { ethers } = require("hardhat");

async function main() {
    console.log("🚀 使用备用账户部署 VotingGame 合约（避开MetaMask警告）...\n");

    // 获取所有可用账户
    const signers = await ethers.getSigners();

    // 使用第2个账户部署（索引1），这样会生成不同的合约地址
    const deployer = signers[1];
    console.log("✅ 部署账户（账户#1）:", deployer.address);

    // 获取账户余额
    const balance = await ethers.provider.getBalance(deployer.address);
    console.log("💰 账户余额:", ethers.formatEther(balance), "ETH");

    // 部署合约
    console.log("\n📝 正在部署合约...");
    const VotingGame = await ethers.getContractFactory("VotingGame", deployer);
    const votingGame = await VotingGame.deploy();

    await votingGame.waitForDeployment();

    const contractAddress = await votingGame.getAddress();
    console.log("\n🎉 VotingGame 合约已部署!");
    console.log("📍 合约地址:", contractAddress);
    console.log("⚠️  这个地址与默认地址不同，MetaMask不会警告!");

    // 验证部署
    console.log("\n🔍 验证部署...");
    const voteCounter = await votingGame.voteCounter();
    console.log("✅ 初始投票计数:", voteCounter.toString());

    // 输出配置信息
    console.log("\n=== 配置信息 ===");
    console.log("合约地址:", contractAddress);
    console.log("部署账户:", deployer.address);
    console.log("网络:", (await ethers.provider.getNetwork()).name);
    console.log("Chain ID:", (await ethers.provider.getNetwork()).chainId);

    // 保存部署信息
    const fs = require("fs");
    const deploymentInfo = {
        contractAddress: contractAddress,
        deployer: deployer.address,
        network: (await ethers.provider.getNetwork()).name,
        chainId: (await ethers.provider.getNetwork()).chainId.toString(),
        deployedAt: new Date().toISOString(),
        blockNumber: await ethers.provider.getBlockNumber(),
        note: "使用备用账户部署以避开MetaMask警告"
    };

    fs.writeFileSync(
        "deployment-info.json",
        JSON.stringify(deploymentInfo, null, 2)
    );
    console.log("\n✅ 部署信息已保存到 deployment-info.json");

    // 自动更新前端配置
    console.log("\n🔧 正在自动更新前端配置...");
    try {
        const votingJsPath = "./frontend/voting.js";
        let votingJsContent = fs.readFileSync(votingJsPath, "utf8");

        // 替换合约地址
        const addressRegex = /const CONTRACT_ADDRESS = "0x[a-fA-F0-9]{40}";/;
        const newAddressLine = `const CONTRACT_ADDRESS = "${contractAddress}";`;

        if (addressRegex.test(votingJsContent)) {
            votingJsContent = votingJsContent.replace(addressRegex, newAddressLine);
            fs.writeFileSync(votingJsPath, votingJsContent);
            console.log("✅ frontend/voting.js 已自动更新合约地址!");
        }
    } catch (error) {
        console.log("⚠️  自动更新前端失败，请手动更新:");
        console.log(`   const CONTRACT_ADDRESS = "${contractAddress}";`);
    }

    console.log("\n=== 🦊 MetaMask 配置说明 ===");
    console.log("1. 确保MetaMask连接到 Localhost 8545");
    console.log("2. 网络配置:");
    console.log("   - RPC URL: http://127.0.0.1:8545");
    console.log("   - Chain ID: 1337");
    console.log("3. 导入测试账户（可选）:");
    console.log("   - 账户地址:", deployer.address);
    console.log("\n4. 新的合约地址不会触发MetaMask警告! ✅");

    return contractAddress;
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
