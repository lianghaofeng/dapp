import {ethers} from "ethers";
import dotenv from "dotenv";
dotenv.config();

const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

const abi = [
  "function mint() public",
  "function totalSupply() view returns (uint256)",
  "function ownerOf(uint256) view returns (address)"
];

const contractAddress = process.env.CONTRACT_ADDRESS;
const contract = new ethers.Contract(contractAddress, abi, wallet);

async function main(){
  console.log("From wallet:", wallet.address);

  // 1. call mint
  const tx = await contract.mint();
  console.log("mint tx submitted:", tx.hash);
  const receipt = await tx.wait();
  console.log("mint mined in block:", receipt.blockNumber);

  // 2. read totalSupply
  const s = await contract.totalSupply();
  console.log("totalSupply:", s.toString());

  // 3. ownerOf
  const owner = await contract.ownerOf(s);
  console.log("owner of token", s.toString(), "is", owner);
}

main().catch(console.error);