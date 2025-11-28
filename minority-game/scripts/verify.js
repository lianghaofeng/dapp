const { run } = require("hardhat");
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

    console.log("开始验证合约:", contractAddress);

    try {
        await run("verify:verify", {
            address: contractAddress,
            constructorArguments: []
        });

        console.log("✅ 合约验证成功!");
    } catch (error) {
        if (error.message.includes("Already Verified")) {
            console.log("✅ 合约已经验证过了");
        } else {
            console.error("❌ 验证失败:", error.message);
        }
    }
}

main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
