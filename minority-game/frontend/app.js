import MinorityGame from './minority-game.js';

// 在 app.js 开头添加缓存控制
console.log('🔄 App version: ' + new Date().toISOString());
console.log('🔧 强制禁用缓存版本');



// app.js - 修复函数定义顺序
console.log('🚀 App loading...');
console.log('ethers availability check:', typeof ethers);

// 配置 - 替换为你的实际合约地址和 ABI
const CONTRACT_ADDRESS = "0xDc64a140Aa3E981100a9becA4E685f962f0cF6C9"; 
const CONTRACT_ABI = [
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			}
		],
		"name": "claimReward",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "commitHash",
				"type": "bytes32"
			}
		],
		"name": "commit",
		"outputs": [],
		"stateMutability": "payable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			}
		],
		"name": "finalizeGame",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "initialOwner",
				"type": "address"
			}
		],
		"stateMutability": "nonpayable",
		"type": "constructor"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "owner",
				"type": "address"
			}
		],
		"name": "OwnableInvalidOwner",
		"type": "error"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "account",
				"type": "address"
			}
		],
		"name": "OwnableUnauthorizedAccount",
		"type": "error"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "depositAmount",
				"type": "uint256"
			}
		],
		"name": "CommitSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "DepositConfiscated",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "winningOption",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalA",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "totalB",
				"type": "uint256"
			}
		],
		"name": "GameFinalized",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "commitEndTime",
				"type": "uint256"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "revealEndTime",
				"type": "uint256"
			}
		],
		"name": "GameStarted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "address",
				"name": "previousOwner",
				"type": "address"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "OwnershipTransferred",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "renounceOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"internalType": "uint8",
				"name": "choice",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			},
			{
				"internalType": "bytes32",
				"name": "secret",
				"type": "bytes32"
			}
		],
		"name": "reveal",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint8",
				"name": "choice",
				"type": "uint8"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "amount",
				"type": "uint256"
			}
		],
		"name": "RevealSubmitted",
		"type": "event"
	},
	{
		"anonymous": false,
		"inputs": [
			{
				"indexed": true,
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"indexed": true,
				"internalType": "address",
				"name": "player",
				"type": "address"
			},
			{
				"indexed": false,
				"internalType": "uint256",
				"name": "reward",
				"type": "uint256"
			}
		],
		"name": "RewardClaimed",
		"type": "event"
	},
	{
		"inputs": [],
		"name": "startGame",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			}
		],
		"name": "startRevealPhase",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "address",
				"name": "newOwner",
				"type": "address"
			}
		],
		"name": "transferOwnership",
		"outputs": [],
		"stateMutability": "nonpayable",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "calculateReward",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "COMMIT_DURATION",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"name": "commits",
		"outputs": [
			{
				"internalType": "bytes32",
				"name": "commitHash",
				"type": "bytes32"
			},
			{
				"internalType": "uint256",
				"name": "depositAmount",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "revealed",
				"type": "bool"
			},
			{
				"internalType": "uint8",
				"name": "choice",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "betAmount",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "currentGameId",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "games",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"internalType": "enum MinorityGame.GameStage",
				"name": "stage",
				"type": "uint8"
			},
			{
				"internalType": "uint256",
				"name": "commitEndTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "revealEndTime",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalOptionA",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalOptionB",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "totalDeposits",
				"type": "uint256"
			},
			{
				"internalType": "bool",
				"name": "finalized",
				"type": "bool"
			},
			{
				"internalType": "uint8",
				"name": "winningOption",
				"type": "uint8"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			},
			{
				"internalType": "address",
				"name": "player",
				"type": "address"
			}
		],
		"name": "getCommit",
		"outputs": [
			{
				"components": [
					{
						"internalType": "bytes32",
						"name": "commitHash",
						"type": "bytes32"
					},
					{
						"internalType": "uint256",
						"name": "depositAmount",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "revealed",
						"type": "bool"
					},
					{
						"internalType": "uint8",
						"name": "choice",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "betAmount",
						"type": "uint256"
					}
				],
				"internalType": "struct MinorityGame.Commit",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			}
		],
		"name": "getGameInfo",
		"outputs": [
			{
				"components": [
					{
						"internalType": "uint256",
						"name": "gameId",
						"type": "uint256"
					},
					{
						"internalType": "enum MinorityGame.GameStage",
						"name": "stage",
						"type": "uint8"
					},
					{
						"internalType": "uint256",
						"name": "commitEndTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "revealEndTime",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalOptionA",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalOptionB",
						"type": "uint256"
					},
					{
						"internalType": "uint256",
						"name": "totalDeposits",
						"type": "uint256"
					},
					{
						"internalType": "bool",
						"name": "finalized",
						"type": "bool"
					},
					{
						"internalType": "uint8",
						"name": "winningOption",
						"type": "uint8"
					}
				],
				"internalType": "struct MinorityGame.Game",
				"name": "",
				"type": "tuple"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "gameId",
				"type": "uint256"
			}
		],
		"name": "getParticipants",
		"outputs": [
			{
				"internalType": "address[]",
				"name": "",
				"type": "address[]"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MAX_DEPOSIT_RATE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "MIN_DEPOSIT_RATE",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "owner",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			},
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"name": "participants",
		"outputs": [
			{
				"internalType": "address",
				"name": "",
				"type": "address"
			}
		],
		"stateMutability": "view",
		"type": "function"
	},
	{
		"inputs": [],
		"name": "REVEAL_DURATION",
		"outputs": [
			{
				"internalType": "uint256",
				"name": "",
				"type": "uint256"
			}
		],
		"stateMutability": "view",
		"type": "function"
	}
];

let gameInstance;
let currentSelectedAccount = null;

// 首先定义所有函数，确保在调用前已定义
function bindEventListeners() {
    console.log('🔗 Binding event listeners...');
    
    const connectBtn = document.getElementById('connectWallet');
    if (connectBtn) {
        connectBtn.addEventListener('click', connectWallet);
        console.log('✅ Connected Wallet button');
    } else {
        console.error('❌ Could not find connect wallet button');
    }

	const disconnectBtn = document.getElementById('disconnectWallet');
    if (disconnectBtn) {
        disconnectBtn.addEventListener('click', disconnectWallet);
        console.log('✅ Connected Disconnect button');
    }
    
    const gameInfoBtn = document.getElementById('getGameInfo');
    if (gameInfoBtn) {
        gameInfoBtn.addEventListener('click', function() {
            if (!gameInstance || !gameInstance.readContract) {
                alert('Please connect your wallet first！');
                return;
            }
            getGameInfo();
        });
        console.log('✅ Connected get game infor button');
    }
    
    const betOptionA = document.getElementById('betOptionA');
    const betOptionB = document.getElementById('betOptionB');
    if (betOptionA) {
        betOptionA.addEventListener('click', function() {
            if (!gameInstance || !gameInstance.writeContract) {
                alert('Please connect your wallet first！');
                return;
            }
            placeBet(1);
        });
        console.log('✅ Connected option A button');
    }
    if (betOptionB) {
        betOptionB.addEventListener('click', function() {
            if (!gameInstance || !gameInstance.writeContract) {
                alert('Please connect your wallet first!');
                return;
            }
            placeBet(2);
        });
        console.log('✅ Connected option B button');
    }
    
    const revealBtn = document.getElementById('reveal');
    if (revealBtn) {
        revealBtn.addEventListener('click', function() {
            if (!gameInstance || !gameInstance.writeContract) {
                alert('Please connect your wallet first!');
                return;
            }
            submitReveal();
        });
        console.log('✅ Connected reveal button');
    }
    
    const claimBtn = document.getElementById('claimReward');
    const checkBtn = document.getElementById('checkReward');
    if (claimBtn) {
        claimBtn.addEventListener('click', function() {
            if (!gameInstance || !gameInstance.writeContract) {
                alert('Please connect your wallet first!');
                return;
            }
            claimReward();
        });
        console.log('✅ Connected claim reward button');
    }
    if (checkBtn) {
        checkBtn.addEventListener('click', function() {
            if (!gameInstance || !gameInstance.readContract) {
                alert('Please connect your wallet first!');
                return;
            }
            checkReward();
        });
        console.log('✅ Connected check reward button');
    }
    
    console.log('✅ All button events bound successfully');
}

// 连接钱包 - 显示账户选择
async function connectWallet() {
    console.log('🦊 Connect wallet button clicked');
    const statusDiv = document.getElementById('walletStatus');
    statusDiv.innerHTML = "Connecting...";
    
    try {
        // 请求账户访问权限
        const accounts = await window.ethereum.request({ 
            method: 'eth_requestAccounts' 
        });
        
        console.log('Available accounts:', accounts);
        
        if (accounts.length === 0) {
            statusDiv.innerHTML = '<div class="error">❌ No accounts found</div>';
            return;
        }
        
        // 显示账户选择器
        showAccountSelector(accounts);
        
        statusDiv.innerHTML = '<div class="info">👆 Please select an account</div>';
        
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        console.error('❌ Error connecting wallet:', error);
    }
}

// 断开钱包连接
async function disconnectWallet() {
    const statusDiv = document.getElementById('walletStatus');
    statusDiv.innerHTML = "Disconnecting...";
    
    try {
        // 重置状态
        currentSelectedAccount = null;
        if (gameInstance) {
            gameInstance.signer = null;
            gameInstance.writeContract = null;
            gameInstance.writeProvider = null;
        }
        
        // 隐藏账户选择器
        document.getElementById('accountSelector').style.display = 'none';
        document.getElementById('accountList').innerHTML = '';
        
        statusDiv.innerHTML = '<div class="info">🔌 Wallet disconnected</div>';
        console.log('🔌 Wallet disconnected');
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error disconnecting: ' + error.message + '</div>';
        console.error('❌ Error disconnecting wallet:', error);
    }
}

// 显示账户选择器
function showAccountSelector(accounts) {
    const accountList = document.getElementById('accountList');
    const selector = document.getElementById('accountSelector');
    
    accountList.innerHTML = '';
    
    accounts.forEach((account, index) => {
        const accountElement = document.createElement('div');
        accountElement.className = 'account-option';
        accountElement.innerHTML = `
            <strong>Account ${index + 1}:</strong> ${account}
            ${index === 0 ? ' <em>(default)</em>' : ''}
        `;
        accountElement.addEventListener('click', () => {
            selectAccount(account);
        });
        accountList.appendChild(accountElement);
    });
    
    selector.style.display = 'block';
}

// 选择特定账户
async function selectAccount(accountAddress) {
    const statusDiv = document.getElementById('walletStatus');
    statusDiv.innerHTML = `Connecting to ${accountAddress.substring(0, 8)}...`;
    
    try {
        // 保存选择的账户
        currentSelectedAccount = accountAddress;
        
        // 更新账户选择器UI
        const accountOptions = document.querySelectorAll('.account-option');
        accountOptions.forEach(option => {
            option.classList.remove('selected');
            if (option.textContent.includes(accountAddress.substring(0, 8))) {
                option.classList.add('selected');
            }
        });
        
        // 连接到选择的账户
        const connected = await gameInstance.connectToAccount(accountAddress);
        
        if (connected) {
            const address = await gameInstance.signer.getAddress();
            statusDiv.innerHTML = `<div class="success">✅ Connected to: ${address}</div>`;
            console.log('✅ Connected to wallet:', address);
            
            // 连接成功后立即获取游戏信息
            await getGameInfo();
        } else {
            statusDiv.innerHTML = '<div class="error">❌ Connection failed</div>';
        }
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        console.error('❌ Error selecting account:', error);
    }
}



async function getCurrentGameId() {
    try {
        return await gameInstance.getCurrentGameId();
    } catch (error) {
        console.error('Error getting current game ID:', error);
        return 0;
    }
}


// 辅助函数
function getStageName(stage) {
    const stages = ['Not Started', 'Commit Phase', 'Reveal Phase', 'End', 'Claim Rewards'];
    return stages[stage] || 'Unknown';
}

function getWinningOptionName(option) {
    const options = ['Not Decided', 'Option A Wins', 'Option B Wins', 'Draw'];
    return options[option] || 'Unknown';
}



async function getGameInfo() {
    console.log('🎮 Getting game information');
    const statusDiv = document.getElementById('gameInfo');
    statusDiv.innerHTML = "Loading...";
    
    try {
        const currentGameId = await getCurrentGameId();
		console.log("使用游戏ID:", currentGameId);

		if (currentGameId === 0) {
            statusDiv.innerHTML = '<div class="info">⚠️ No active game. Please start a new game.</div>';
            return;
        }
        
        const gameInfo = await gameInstance.getGameInfo(currentGameId);

        if (gameInfo) {
            statusDiv.innerHTML = `
                <div class="info">
                    <strong>Game #${gameInfo.gameId}</strong><br>
                    Phase: ${getStageName(gameInfo.stage)}<br>
                    Commit Phase End: ${gameInfo.commitEndTime.toLocaleString()}<br>
                    Reveal Phase End: ${gameInfo.revealEndTime.toLocaleString()}<br>
                   	Option A Total Bet: ${gameInfo.totalOptionA} BNB<br>
                    Option B Total Bet: ${gameInfo.totalOptionB} BNB<br>
                    Winning Option: ${getWinningOptionName(gameInfo.winningOption)}<br>
                    Finalized: ${gameInfo.finalized ? 'Yes' : 'No'}
                </div>
            `;
        } else {
            statusDiv.innerHTML = '<div class="error">❌ Failed to get game information</div>';
        }
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        console.error('❌ Error getting game information:', error);
    }
}

async function placeBet(choice) {
    console.log(`💰 Placing bet on option${choice}`);
    const statusDiv = document.getElementById('betStatus');
    const betAmountInput = document.getElementById('betAmount');
    
    statusDiv.innerHTML = "Placing a bet...";
    
    try {
		const currentGameId = await getCurrentGameId();

		if (currentGameId === 0) {
            statusDiv.innerHTML = '<div class="error">❌ No active game to bet on</div>';
            return;
        }

        const betAmount = ethers.parseEther(betAmountInput.value);
        const result = await gameInstance.submitCommit(currentGameId, choice, betAmount);
        
        if (result.success) {
            statusDiv.innerHTML = `
                <div class="success">
                    ✅ Bet successful!<br>
                    Transaction Hash: ${result.txHash}<br>
                    Please remember to submit Reveal during the Reveal Phase
                </div>
            `;
        } else {
            statusDiv.innerHTML = '<div class="error">❌ Bet Failed: ' + result.error + '</div>';
        }
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        console.error('❌ Error placing bet:', error);
    }
}

async function submitReveal() {
    console.log('🔓 Submitting Reveal');
    const statusDiv = document.getElementById('revealStatus');
    statusDiv.innerHTML = "Submitting Reveal...";

    try {

		const currentGameId = await getCurrentGameId();
        if (currentGameId === 0) {
            statusDiv.innerHTML = '<div class="error">❌ No active game to reveal</div>';
            return;
        }

        const result = await gameInstance.submitReveal(currentGameId);
        
        if (result.success) {
            statusDiv.innerHTML = `
                <div class="success">
                    ✅ Reveal submitted successfully!<br>
                    Transaction Hash: ${result.txHash}
                </div>
            `;
        } else {
            statusDiv.innerHTML = '<div class="error">❌ Reveal failed: ' + result.error + '</div>';
        }
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        console.error('❌ Error submitting reveal:', error);
    }
}

async function checkReward() {
    console.log('🎁 Checking reward');
    const statusDiv = document.getElementById('rewardStatus');
    statusDiv.innerHTML = "Calculating reward...";

    try {

		const currentGameId = await getCurrentGameId();
        if (currentGameId === 0) {
            statusDiv.innerHTML = '<div class="error">❌ No active game to check reward</div>';
            return;
        }
        const reward = await gameInstance.calculateReward(currentGameId);
        statusDiv.innerHTML = `<div class="info">Estimated reward: ${reward} BNB</div>`;
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error: ' + error.message + '</div>';
        console.error('❌ Error checking reward:', error);
    }
}

async function claimReward() {
    console.log('🏆 Claiming reward');
    const statusDiv = document.getElementById('rewardStatus');
    statusDiv.innerHTML = "Claiming reward...";
    
    try {
		const currentGameId = await getCurrentGameId();
        if (currentGameId === 0) {
            statusDiv.innerHTML = '<div class="error">❌ No active game to claim reward</div>';
            return;
        }

        const result = await gameInstance.claimReward(currentGameId);
        
        if (result.success) {
            statusDiv.innerHTML = `
                <div class="success">
                    ✅ Reward claimed successfully!<br>
                    Transaction Hash: ${result.txHash}
                </div>
            `;
        } else {
            statusDiv.innerHTML = '<div class="error">❌ Claim failed:' + result.error + '</div>';
        }
    } catch (error) {
        statusDiv.innerHTML = '<div class="error">❌ Error:' + error.message + '</div>';
        console.error('❌ Error claiming reward:', error);
    }
}



// 初始化应用
function initializeApp() {
    console.log('✅ DOM loaded');
    
    try {
        // 检查 ethers 是否已加载
        if (typeof ethers === 'undefined') {
            throw new Error('ethers library not loaded, please check network connection');
        }
        
        // 直接使用全局的 MinorityGame 类
        gameInstance = new MinorityGame(CONTRACT_ADDRESS, CONTRACT_ABI);
        console.log('✅ Game instance created successfully游戏实例创建成功');
        
        // 绑定事件监听器
        bindEventListeners();
        console.log('✅ Event listeners bound successfully');

		// 设置账户变化监听
        setupAccountChangeListener();
        
    } catch (error) {
        console.error('❌ Initialization failed:', error);
        document.getElementById('walletStatus').innerHTML = 
            '<div class="error">Initialization failed: ' + error.message + '</div>';
    }
}

// 监听账户变化
function setupAccountChangeListener() {
    if (window.ethereum) {
        window.ethereum.on('accountsChanged', (accounts) => {
            console.log('🦊 Accounts changed:', accounts);
            if (accounts.length > 0) {
                // 自动选择第一个账户
                selectAccount(accounts[0]);
            } else {
                // 没有账户连接
                disconnectWallet();
            }
        });
    }
}


document.addEventListener('DOMContentLoaded', initializeApp);