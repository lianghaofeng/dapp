import { ethers } from "ethers";

// wei         0
// kwei        3
// mwei        6
// gwei        9
// szabo       12
// finney      15
// ether       18

const oneGwei = ethers.getBigInt("1000000000"); // 从十进制字符串生成
console.log(oneGwei)
console.log(ethers.getBigInt("0x3b9aca00")) // 从hex字符串生成
console.log(ethers.getBigInt(1000000000)) // 从数字生成
// 不能从js最大的安全整数之外的数字生成BigNumber，下面代码会报错
// ethers.getBigInt(Number.MAX_SAFE_INTEGER);
console.log("js中最大安全整数：", Number.MAX_SAFE_INTEGER)

// 运算
console.log("加法：", oneGwei + 1n)
console.log("减法：", oneGwei - 1n)
console.log("乘法：", oneGwei * 2n)
console.log("除法：", oneGwei / 2n)
// 比较
console.log("是否相等：", oneGwei == 1000000000n)


//代码参考：https://docs.ethers.org/v6/api/utils/#about-units
console.group('\n2. 格式化：小单位转大单位，formatUnits');
console.log(ethers.formatUnits(oneGwei, 0));
// '1000000000'
console.log(ethers.formatUnits(oneGwei, "gwei"));
// '1.0'
console.log(ethers.formatUnits(oneGwei, 9));
// '1.0'
console.log(ethers.formatUnits(oneGwei, "ether"));
// `0.000000001`
console.log(ethers.formatUnits(1000000000, "gwei"));
// '1.0'
console.log(ethers.formatEther(oneGwei));
// `0.000000001` 等同于formatUnits(value, "ether")
console.groupEnd();

// 3. 解析：大单位转小单位
// 例如将ether转换为wei：parseUnits(变量, 单位),parseUnits默认单位是 ether
// 代码参考：https://docs.ethers.org/v6/api/utils/#about-units
console.group('\n3. 解析：大单位转小单位，parseUnits');
console.log(ethers.parseUnits("1.0").toString());
// { BigNumber: "1000000000000000000" }
console.log(ethers.parseUnits("1.0", "ether").toString());
// { BigNumber: "1000000000000000000" }
console.log(ethers.parseUnits("1.0", 18).toString());
// { BigNumber: "1000000000000000000" }
console.log(ethers.parseUnits("1.0", "gwei").toString());
// { BigNumber: "1000000000" }
console.log(ethers.parseUnits("1.0", 9).toString());
// { BigNumber: "1000000000" }
console.log(ethers.parseEther("1.0").toString());
// { BigNumber: "1000000000000000000" } 等同于parseUnits(value, "ether")
console.groupEnd();

