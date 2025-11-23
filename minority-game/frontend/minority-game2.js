// Frontend integration example with ethers.js
// import { ethers } from 'ethers';

class MinorityGame {
    constructor(contractAddress, abi) {
        this.contractAddress = contractAddress;
        this.abi = abi;
        this.provider = null;
        this.signer = null;
        this.contract = null;
    }

    // Initialize Web3 connection
    async connect() {
        if (typeof window.ethereum !== 'undefined') {
            // Request account access
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            // Create provider and signer
            this.provider = new ethers.providers.Web3Provider(window.ethereum);
            this.signer = this.provider.getSigner();

            const address = await this.signer.getAddress();
            console.log('✅ Current User:', address);
            
            // Check if connected to BSC
            // const network = await this.provider.getNetwork();
            // if (network.chainId !== 56 && network.chainId !== 97) {
            //     // 56: BSC Mainnet, 97: BSC Testnet
            //     alert('Please connect to Binance Smart Chain');
            //     return false;
            // }
            
            // Initialize contract
            this.contract = new ethers.Contract(
                this.contractAddress,
                this.abi,
                this.signer
            );
            
            return true;
        } else {
            alert('Please install MetaMask!');
            return false;
        }
    }

    // Generate secret and store in localStorage
    generateSecret() {
        const secret = ethers.utils.hexlify(ethers.utils.randomBytes(32));
        return secret;
    }

    // Calculate commit hash
    calculateCommitHash(gameId, choice, betAmount, secret, userAddress) {
        // choice: 1 for A, 2 for B
        const hash = ethers.utils.keccak256(
            ethers.utils.defaultAbiCoder.encode(
                ['uint256', 'uint8', 'uint256', 'bytes32', 'address'],
                [gameId, choice, betAmount, secret, userAddress]
            )
        );
        return hash;
    }

    // Submit commit
    async submitCommit(gameId, choice, betAmount) {
        try {
            const userAddress = await this.signer.getAddress();
            
            // Generate secret
            const secret = this.generateSecret();
            
            // Calculate deposit (random between 30%-70%)
            const randomRate = 30 + Math.floor(Math.random() * 41); // 30-70
            const depositAmount = betAmount.mul(randomRate).div(100);
            
            // Calculate commit hash
            const commitHash = this.calculateCommitHash(
                gameId,
                choice,
                betAmount,
                secret,
                userAddress
            );
            
            // Store in localStorage for reveal phase
            const commitData = {
                gameId: gameId.toString(),
                choice: choice,
                betAmount: betAmount.toString(),
                secret: secret,
                depositAmount: depositAmount.toString(),
                timestamp: Date.now()
            };
            localStorage.setItem(`commit_${gameId}_${userAddress}`, JSON.stringify(commitData));
            
            // Submit to contract
            const tx = await this.contract.commit(gameId, commitHash, {
                value: depositAmount
            });
            
            await tx.wait();
            
            return {
                success: true,
                txHash: tx.hash,
                commitHash: commitHash
            };
            
        } catch (error) {
            console.error('Commit failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Retrieve commit data from localStorage
    getStoredCommit(gameId, userAddress) {
        const key = `commit_${gameId}_${userAddress}`;
        const data = localStorage.getItem(key);
        if (data) {
            return JSON.parse(data);
        }
        return null;
    }

    // Submit reveal
    async submitReveal(gameId) {
        try {
            const userAddress = await this.signer.getAddress();
            
            // Retrieve stored commit data
            const commitData = this.getStoredCommit(gameId, userAddress);
            if (!commitData) {
                throw new Error('No commit data found in localStorage');
            }
            
            // Submit reveal
            const tx = await this.contract.reveal(
                gameId,
                commitData.choice,
                ethers.BigNumber.from(commitData.betAmount),
                commitData.secret
            );
            
            await tx.wait();
            
            return {
                success: true,
                txHash: tx.hash
            };
            
        } catch (error) {
            console.error('Reveal failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Get game information
    async getGameInfo(gameId) {
        try {
            const game = await this.contract.getGameInfo(gameId);
            return {
                gameId: game.gameId.toString(),
                stage: game.stage,
                commitEndTime: new Date(game.commitEndTime.toNumber() * 1000),
                revealEndTime: new Date(game.revealEndTime.toNumber() * 1000),
                totalOptionA: ethers.utils.formatEther(game.totalOptionA),
                totalOptionB: ethers.utils.formatEther(game.totalOptionB),
                winningOption: game.winningOption,
                finalized: game.finalized
            };
        } catch (error) {
            console.error('Failed to get game info:', error);
            return null;
        }
    }

    // Calculate potential reward
    async calculateReward(gameId) {
        try {
            const userAddress = await this.signer.getAddress();
            const reward = await this.contract.calculateReward(gameId, userAddress);
            return ethers.utils.formatEther(reward);
        } catch (error) {
            console.error('Failed to calculate reward:', error);
            return '0';
        }
    }

    // Claim reward
    async claimReward(gameId) {
        try {
            const tx = await this.contract.claimReward(gameId);
            await tx.wait();
            
            // Clear localStorage after successful claim
            const userAddress = await this.signer.getAddress();
            localStorage.removeItem(`commit_${gameId}_${userAddress}`);
            
            return {
                success: true,
                txHash: tx.hash
            };
        } catch (error) {
            console.error('Claim failed:', error);
            return { success: false, error: error.message };
        }
    }

    // Listen to events
    setupEventListeners(callback) {
        this.contract.on('GameStarted', (gameId, commitEndTime, revealEndTime) => {
            callback('GameStarted', {
                gameId: gameId.toString(),
                commitEndTime: new Date(commitEndTime.toNumber() * 1000),
                revealEndTime: new Date(revealEndTime.toNumber() * 1000)
            });
        });

        this.contract.on('CommitSubmitted', (gameId, player, depositAmount) => {
            callback('CommitSubmitted', {
                gameId: gameId.toString(),
                player: player,
                depositAmount: ethers.utils.formatEther(depositAmount)
            });
        });

        this.contract.on('RevealSubmitted', (gameId, player, choice, amount) => {
            callback('RevealSubmitted', {
                gameId: gameId.toString(),
                player: player,
                choice: choice,
                amount: ethers.utils.formatEther(amount)
            });
        });

        this.contract.on('GameFinalized', (gameId, winningOption, totalA, totalB) => {
            callback('GameFinalized', {
                gameId: gameId.toString(),
                winningOption: winningOption,
                totalA: ethers.utils.formatEther(totalA),
                totalB: ethers.utils.formatEther(totalB)
            });
        });
    }
}

// Example usage
export default MinorityGame;

// Usage in React component:
/*
import MinorityGame from './MinorityGame';

const contractAddress = '0x...'; // Your deployed contract address
const abi = [...]; // Your contract ABI

const game = new MinorityGame(contractAddress, abi);

// Connect wallet
await game.connect();

// Submit commit
const betAmount = ethers.utils.parseEther('0.1'); // 0.1 BNB
const result = await game.submitCommit(1, 1, betAmount); // gameId=1, choice=A(1)

// Submit reveal (after commit phase)
await game.submitReveal(1);

// Claim reward (after game finalized)
await game.claimReward(1);
*/