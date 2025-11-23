class MinorityGame {
    constructor(contractAddress, abi) {
        this.contractAddress = contractAddress;
        this.abi = abi;

        this.readProvider = null;
        this.writeProvider = null;
        this.signer = null;

        this.readContract = null;
        this.writeContract = null;

        this.initializeProviders();
    }

    initializeProviders(){
        try{
            this.readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:8545");
            
            if(window.ethereum){
                this.writeProvider = new ethers.BrowserProvider(window.ethereum);
            }

            this.readContract = new ethers.Contract(
                this.contractAddress,
                this.abi,
                this.readProvider
            );

            console.log('✅ Providers initialized:', {
                readProvider: !!this.readProvider,
                writeProvider: !!this.writeProvider,
                readContract: !!this.readContract
            });


        } catch(error) {
            console.error('❌ Failed to initialize providers:', error);
        }
    }

    // 新的方法：连接到特定账户
    async connectToAccount(accountAddress = null) {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return false;
        }

        try {
            // 确保已请求账户访问权限
            await window.ethereum.request({ method: 'eth_requestAccounts' });
            
            if (!this.writeProvider) {
                this.writeProvider = new ethers.BrowserProvider(window.ethereum);
            }
            
            // 获取所有账户
            const accounts = await this.writeProvider.listAccounts();
            
            // 选择账户
            let targetSigner;
            if (accountAddress) {
                // 连接到特定账户
                const targetAccount = accounts.find(acc => acc.address.toLowerCase() === accountAddress.toLowerCase());
                if (targetAccount) {
                    targetSigner = targetAccount;
                } else {
                    // 如果找不到特定账户，使用第一个账户
                    targetSigner = accounts[0];
                    console.warn(`⚠️ Account ${accountAddress} not found, using ${targetSigner.address}`);
                }
            } else {
                // 使用第一个账户
                targetSigner = accounts[0];
            }
            
            this.signer = targetSigner;
            this.writeContract = new ethers.Contract(
                this.contractAddress, 
                this.abi, 
                this.signer
            );

            // 如果 readProvider 失败，尝试重新初始化
            if (!this.readProvider) {
                try {
                    this.readProvider = new ethers.JsonRpcProvider("http://127.0.0.1:9944");
                    this.readContract = new ethers.Contract(
                        this.contractAddress, 
                        this.abi, 
                        this.readProvider
                    );
                } catch (readError) {
                    console.warn('⚠️ Read provider unavailable');
                }
            }

            let network;
            if (this.readProvider) {
                network = await this.readProvider.getNetwork();
            } else {
                network = await this.writeProvider.getNetwork();
            }
            
            console.log(">>> Your Webpage Is On:", network.chainId, network.name);
            
            let currentGameIdValue;
            if (this.readContract) {
                currentGameIdValue = await this.readContract.currentGameId();
            } else {
                currentGameIdValue = await this.writeContract.currentGameId();
            }
            console.log("currentGameId:", Number(currentGameIdValue));

            window.gameInstance = this;
            window.readContract = this.readContract;
            window.writeContract = this.writeContract;
            console.log('✅ MinorityGame connected to account:', await this.signer.getAddress());

            return true;
        } catch (err) {
            console.error('connect error', err);
            return false;
        }
    }

    // 保持向后兼容的 connect 方法
    async connect() {
        return await this.connectToAccount();
    }


    // async connect() {
    //     if (!window.ethereum) {
    //         alert('Please install MetaMask!');
    //         return false;
    //     }

    //     try {
    //         await window.ethereum.request({ method: 'eth_requestAccounts' });

    //         this.writeProvider = new ethers.BrowserProvider(window.ethereum);
    //         this.signer = await this.writeProvider.getSigner();

    //         this.writeContract = new ethers.Contract(
    //             this.contractAddress, 
    //             this.abi, 
    //             this.signer
    //         );

    //         const network = await this.readProvider.getNetwork();
    //         console.log(">>> Your Webpage Is On:", network.chainId, network.name);


    //         const currentGameId = await this.readContract.currentGameId();
    //         console.log("currentGameId (from RPC):", Number(currentGameId));

    //         // 暴露便于调试
    //         window.gameInstance = this;
    //         window.contract = this.contract;
    //         console.log('✅ MinorityGame connected. contract and gameInstance exposed to window.');

    //         return true;
    //     } catch (err) {
    //         console.error('connect error', err);
    //         return false;
    //     }
    // }

    async getCurrentGameId() {
        try {
            const currentGameId = await this.readContract.currentGameId();
            console.log('📖 Read currentGameId from RPC:', currentGameId);
            return Number(currentGameId);
        } catch (error) {
            console.error('Error getting current game ID from RPC:', error);
            return 0;
        }
    }

    generateSecret() {
        return ethers.hexlify(ethers.randomBytes(32));
    }

    calculateCommitHash(gameId, choice, betAmount, secret, userAddress) {
        return ethers.keccak256(
            ethers.solidityPacked(
                ['uint256','uint8','uint256','bytes32','address'],
                [gameId, choice, betAmount, secret, userAddress]
            )
        );
    }

    async submitCommit(gameId, choice, betAmount) {
        try {
            const userAddress = await this.signer.getAddress();

            const secret = this.generateSecret();
            // depositAmount = betAmount * randomRate / 100
            const randomRate = 30 + Math.floor(Math.random() * 41);
            const betAmountBigInt =BigInt(betAmount);
            const depositAmount = betAmountBigInt;

            const commitHash = this.calculateCommitHash(gameId, choice, betAmount, secret, userAddress);

            const commitData = {
                gameId: gameId.toString(),
                choice: choice,
                betAmount: betAmountBigInt.toString(),
                secret: secret,
                depositAmount: depositAmount.toString(),
                timestamp: Date.now()
            };
            localStorage.setItem(`commit_${gameId}_${userAddress}`, JSON.stringify(commitData));

            const tx = await this.writeContract.commit(gameId, commitHash, { value: depositAmount });
            const receipt = await tx.wait();
            return { success: true, txHash: receipt.hash, commitHash};
        } catch (e) {
            console.error('submitCommit error', e);
            return { success: false, error: e.message || e.toString() };
        }
    }

    getStoredCommit(gameId, userAddress) {
        const key = `commit_${gameId}_${userAddress}`;
        const data = localStorage.getItem(key);
        if (!data) return null;
        return JSON.parse(data);
    }

    async submitReveal(gameId) {
        try {
            if (!this.writeContract) {
                throw new Error('Write contract not available. Please connect wallet.');
            }

            const addr = await this.signer.getAddress();
            const commitData = this.getStoredCommit(gameId, addr);
            if (!commitData) throw new Error('No commit found in localStorage');

            const tx = await this.writeContract.reveal(
                gameId,
                commitData.choice,
                BigInt(commitData.betAmount),
                commitData.secret
            );
            const receipt = await tx.wait();
            return { success: true, txHash: receipt.hash };
        } catch (e) {
            console.error('submitReveal error', e);
            return { success: false, error: e.message || e.toString() };
        }
    }

    async getGameInfo(gameId) {
        try {
            const game = await this.readContract.getGameInfo(gameId);

            // 解析返回值（兼容可能的 array-like 或 object-like）
            let gi;
            if(Array.isArray(game)){
                gi = {
                    gameId: Number(game[0]),
                    stage: Number(game[1]),
                    commitEndTime: Number(game[2]),
                    revealEndTime: Number(game[3]),
                    totalOptionA: ethers.formatEther(game[4]),
                    totalOptionB: ethers.formatEther(game[5]),
                    totalDeposits: ethers.formatEther(game[6]),
                    finalized: game[7],
                    winningOption: Number(game[8])
                };
            } else {
                // 如果是对象格式
                gi = {
                    gameId: Number(game.gameId),
                    stage: Number(game.stage),
                    commitEndTime: Number(game.commitEndTime),
                    revealEndTime: Number(game.revealEndTime),
                    totalOptionA: ethers.formatEther(game.totalOptionA),
                    totalOptionB: ethers.formatEther(game.totalOptionB),
                    totalDeposits: ethers.formatEther(game.totalDeposits),
                    finalized: game.finalized,
                    winningOption: Number(game.winningOption)
                };
            }
            

            // 转换时间为 Date（秒 -> ms）
            gi.commitEndTime = new Date(gi.commitEndTime * 1000);
            gi.revealEndTime = new Date(gi.revealEndTime * 1000);

            return gi;
        } catch (e) {
            console.error('getGameInfo error', e);
            throw e; // 上层 UI 会捕获并显示
        }
    }

    async calculateReward(gameId) {
        try {
            const addr = await this.signer.getAddress();
            const reward = await this.readContract.calculateReward(gameId, addr);
            return ethers.formatEther(reward);
        } catch (e) {
            console.error('calculateReward error', e);
            return '0';
        }
    }

    async claimReward(gameId) {
        try {
            if (!this.writeContract) {
                throw new Error('Write contract not available. Please connect wallet.');
            }

            const tx = await this.writeContract.claimReward(gameId);
            const receipt = await tx.wait();
            // 清本地 commit
            const addr = await this.signer.getAddress();
            localStorage.removeItem(`commit_${gameId}_${addr}`);
            return { success: true, txHash: receipt.hash };
        } catch (e) {
            console.error('claimReward error', e);
            return { success: false, error: e.message || e.toString() };
        }
    }

    setupEventListeners(callback) {
        if (!this.contract) return;

        this.readContract.on('GameStarted', (gameId, commitEndTime, revealEndTime) => {
            callback('GameStarted', { 
                gameId: gameId.toString(), 
                commitEndTime: Number(commitEndTime), 
                revealEndTime: Number(revealEndTime)
             });
        });
        this.readContract.on('CommitSubmitted', (gameId, player, depositAmount) => {
            callback('CommitSubmitted', { 
                gameId: gameId.toString(), 
                player, 
                depositAmount: ethers.formatEther(depositAmount) 
            });
        });
        this.readContract.on('RevealSubmitted', (gameId, player, choice, amount) => {
            callback('RevealSubmitted', { 
                gameId: gameId.toString(), 
                player, 
                choice: Number(choice), 
                amount: ethers.formatEther(amount) 
            });
        });
        this.readContract.on('GameFinalized', (gameId, winningOption, totalA, totalB) => {
            callback('GameFinalized', { 
                gameId: gameId.toString(), 
                winningOption: Number(winningOption), 
                totalA: ethers.formatEther(totalA), 
                totalB: ethers.formatEther(totalB) 
            });
        });
    }
}

export default MinorityGame;
