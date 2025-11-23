import { ethers } from "ethers";

const RPC_URL = "https://sepolia.infura.io/v3/6dbcaabcb9954b1db39639f962315c9f"; // 替换!
const provider = new ethers.JsonRpcProvider(RPC_URL);


const privateKey = '0xf2d2070d1e06c000286e9545519578d654a6a29a1cad96f3be8f6ff104afd935'
const wallet = new ethers.Wallet(privateKey, provider);

// 创建 EIP712 Domain
let contractName = "EIP712Storage"
let version = "1"
let chainId = "1"
let contractAddress = "0xf8e81D47203A594245E36C48e151709F0C19fBe8"


const domain = {
    name: contractName,
    version: version,
    chainId: chainId,
    verifyingContract: contractAddress,
};

console.log(`wallet address: ${wallet.address}`)
// 创建类型化数据，Storage
let spender = wallet.address
let number = "100"

const types = {
    Storage: [
        { name: "spender", type: "address" },
        { name: "number", type: "uint256" },
    ],
};

const message = {
    spender: spender,
    number: number,
};

const signature = await wallet.signTypedData(domain, types, message);

let eip712Signer = ethers.verifyTypedData(domain, types, message, signature);
console.log("EIP712 Signer: ", eip712Signer);