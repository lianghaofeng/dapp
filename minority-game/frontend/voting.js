// 合约配置
const CONTRACT_ADDRESS = "YOUR_CONTRACT_ADDRESS_HERE"; // 部署后替换
const CONTRACT_ABI = [
    "function createVote(string memory question, string[] memory options) external returns (uint256)",
    "function commit(uint256 voteId, bytes32 commitHash) external payable",
    "function startRevealPhase(uint256 voteId) external",
    "function reveal(uint256 voteId, uint256 choice, uint256 betAmount, bytes32 secret) external",
    "function finalizeVote(uint256 voteId) external",
    "function claimReward(uint256 voteId) external",
    "function calculateReward(uint256 voteId, address player) external view returns (uint256)",
    "function getVoteInfo(uint256 voteId) external view returns (uint256 id, address creator, string memory question, string[] memory options, uint8 stage, uint256 commitEndTime, uint256 revealEndTime, uint256 totalDeposits, bool finalized, uint256 winningOption, uint256 createdAt)",
    "function getOptionTotal(uint256 voteId, uint256 optionIndex) external view returns (uint256)",
    "function getCommit(uint256 voteId, address player) external view returns (bytes32 commitHash, uint256 depositAmount, bool revealed, uint256 choice, uint256 betAmount)",
    "function getParticipants(uint256 voteId) external view returns (address[] memory)",
    "function getAllActiveVotes() external view returns (uint256[] memory)",
    "function voteCounter() external view returns (uint256)",
    "event VoteCreated(uint256 indexed voteId, address indexed creator, string question, uint256 optionsCount, uint256 commitEndTime)",
    "event CommitSubmitted(uint256 indexed voteId, address indexed player, uint256 depositAmount)",
    "event RevealSubmitted(uint256 indexed voteId, address indexed player, uint256 choice, uint256 amount)",
    "event VoteFinalized(uint256 indexed voteId, uint256 winningOption, uint256 winningTotal)",
    "event RewardClaimed(uint256 indexed voteId, address indexed player, uint256 reward)"
];

// 全局变量
let provider;
let signer;
let contract;
let userAddress;
let userCommits = {}; // 存储用户的commit信息 {voteId: {choice, betAmount, secret}}

// Stage 枚举
const VoteStage = {
    0: "Active",
    1: "提交阶段",
    2: "揭示阶段",
    3: "已结束",
    4: "领奖阶段"
};

// 初始化
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    checkWalletConnection();
});

// 设置事件监听
function setupEventListeners() {
    // 钱包连接
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);

    // Tab切换
    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    // 创建投票
    document.getElementById('addOption').addEventListener('click', addOptionInput);
    document.getElementById('createVote').addEventListener('click', createVote);

    // 刷新按钮
    document.getElementById('refreshVotes').addEventListener('click', loadActiveVotes);
    document.getElementById('refreshMyVotes').addEventListener('click', loadMyVotes);
}

// 切换Tab
function switchTab(tabName) {
    // 更新tab按钮状态
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    // 更新内容显示
    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    // 根据tab加载相应内容
    if (tabName === 'vote') {
        loadActiveVotes();
    } else if (tabName === 'my-votes') {
        loadMyVotes();
    }
}

// 连接钱包
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showStatus('walletStatus', 'error', '请安装 MetaMask!');
            return;
        }

        showStatus('walletStatus', 'info', '连接中...', true);

        // 请求账户访问
        await window.ethereum.request({ method: 'eth_requestAccounts' });

        // 创建provider和signer
        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // 创建合约实例
        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        showStatus('walletStatus', 'success', `✅ 已连接: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`, true);

        // 监听账户变化
        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

        // 加载活跃投票
        loadActiveVotes();

    } catch (error) {
        console.error('连接钱包失败:', error);
        showStatus('walletStatus', 'error', '连接失败: ' + error.message, true);
    }
}

// 断开钱包
async function disconnectWallet() {
    provider = null;
    signer = null;
    contract = null;
    userAddress = null;
    userCommits = {};

    showStatus('walletStatus', 'info', '已断开连接', true);
}

// 检查钱包连接
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('检查钱包连接失败:', error);
        }
    }
}

// 处理账户变化
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        window.location.reload();
    }
}

// 添加选项输入框
function addOptionInput() {
    const container = document.getElementById('optionsInputs');
    const currentOptions = container.querySelectorAll('.option-input-group').length;

    if (currentOptions >= 10) {
        showStatus('createStatus', 'error', '最多只能添加10个选项', false);
        return;
    }

    const div = document.createElement('div');
    div.className = 'option-input-group';
    div.innerHTML = `
        <input type="text" placeholder="选项 ${currentOptions + 1}" class="option-input">
        <button onclick="this.parentElement.remove()" class="secondary">删除</button>
    `;
    container.appendChild(div);
}

// 创建投票
async function createVote() {
    if (!contract) {
        showStatus('createStatus', 'error', '请先连接钱包!', false);
        return;
    }

    const question = document.getElementById('voteQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(opt => opt.length > 0);

    // 验证
    if (!question) {
        showStatus('createStatus', 'error', '请输入投票问题!', false);
        return;
    }

    if (options.length < 2) {
        showStatus('createStatus', 'error', '至少需要2个选项!', false);
        return;
    }

    if (options.length > 10) {
        showStatus('createStatus', 'error', '最多只能10个选项!', false);
        return;
    }

    try {
        showStatus('createStatus', 'info', '创建中...', false);

        const tx = await contract.createVote(question, options);
        showStatus('createStatus', 'info', '交易已提交，等待确认...', false);

        const receipt = await tx.wait();

        // 从事件中获取voteId
        const voteCreatedEvent = receipt.logs.find(
            log => log.topics[0] === ethers.id("VoteCreated(uint256,address,string,uint256,uint256)")
        );

        showStatus('createStatus', 'success', `✅ 投票创建成功! 交易哈希: ${receipt.hash.slice(0, 10)}...`, false);

        // 清空表单
        document.getElementById('voteQuestion').value = '';
        document.querySelectorAll('.option-input').forEach(input => input.value = '');

        // 切换到投票列表
        setTimeout(() => {
            switchTab('vote');
        }, 2000);

    } catch (error) {
        console.error('创建投票失败:', error);
        showStatus('createStatus', 'error', '创建失败: ' + (error.reason || error.message), false);
    }
}

// 加载活跃投票
async function loadActiveVotes() {
    const container = document.getElementById('activeVotesList');

    if (!contract) {
        container.innerHTML = '<div class="empty-state"><p>请先连接钱包</p></div>';
        return;
    }

    try {
        container.innerHTML = '<div class="status info">加载中...</div>';

        const voteCounter = await contract.voteCounter();
        const voteCount = Number(voteCounter);

        if (voteCount === 0) {
            container.innerHTML = '<div class="empty-state"><p>暂无投票</p></div>';
            return;
        }

        const votes = [];
        for (let i = 1; i <= voteCount; i++) {
            try {
                const voteInfo = await contract.getVoteInfo(i);
                const stage = Number(voteInfo[4]);

                // 只显示活跃的投票（提交和揭示阶段）
                if (stage === 1 || stage === 2) {
                    votes.push({
                        id: Number(voteInfo[0]),
                        creator: voteInfo[1],
                        question: voteInfo[2],
                        options: voteInfo[3],
                        stage: stage,
                        commitEndTime: Number(voteInfo[5]),
                        revealEndTime: Number(voteInfo[6]),
                        totalDeposits: voteInfo[7],
                        finalized: voteInfo[8],
                        winningOption: Number(voteInfo[9]),
                        createdAt: Number(voteInfo[10])
                    });
                }
            } catch (error) {
                console.error(`获取投票${i}信息失败:`, error);
            }
        }

        if (votes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>暂无活跃投票</p></div>';
            return;
        }

        container.innerHTML = votes.map(vote => createVoteCard(vote)).join('');

        // 绑定投票按钮事件
        votes.forEach(vote => {
            document.getElementById(`vote-btn-${vote.id}`)?.addEventListener('click', () => {
                showVoteModal(vote);
            });
        });

    } catch (error) {
        console.error('加载投票列表失败:', error);
        container.innerHTML = '<div class="status error">加载失败: ' + error.message + '</div>';
    }
}

// 创建投票卡片
function createVoteCard(vote) {
    const now = Math.floor(Date.now() / 1000);
    const stageBadge = vote.stage === 1 ? 'commit' : 'reveal';
    const timeLeft = vote.stage === 1 ?
        formatTimeLeft(vote.commitEndTime - now) :
        formatTimeLeft(vote.revealEndTime - now);

    return `
        <div class="vote-card">
            <h3>${escapeHtml(vote.question)}</h3>
            <div class="vote-meta">
                <span class="badge ${stageBadge}">${VoteStage[vote.stage]}</span>
                <span>剩余时间: ${timeLeft}</span>
            </div>
            <div class="vote-meta">
                创建者: ${vote.creator.slice(0, 6)}...${vote.creator.slice(-4)} |
                选项数: ${vote.options.length}
            </div>
            <button id="vote-btn-${vote.id}" class="secondary">
                ${vote.stage === 1 ? '参与投票' : '提交揭示'}
            </button>
        </div>
    `;
}

// 显示投票详情弹窗
async function showVoteModal(vote) {
    const modal = document.createElement('div');
    modal.id = 'voteModalContent';
    modal.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0,0,0,0.7);
        display: flex;
        align-items: center;
        justify-content: center;
        z-index: 1000;
        animation: fadeIn 0.3s ease-out;
    `;

    const content = document.createElement('div');
    content.style.cssText = `
        background: white;
        padding: 30px;
        border-radius: 20px;
        max-width: 600px;
        width: 90%;
        max-height: 80vh;
        overflow-y: auto;
    `;

    if (vote.stage === 1) {
        // 提交阶段
        content.innerHTML = `
            <h2 style="color: #667eea; margin-bottom: 20px;">${escapeHtml(vote.question)}</h2>
            <div style="margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px; font-weight: 600;">选择你的答案:</label>
                <div id="optionsList">
                    ${vote.options.map((opt, idx) => `
                        <div class="vote-option" data-option="${idx}">
                            ${escapeHtml(opt)}
                        </div>
                    `).join('')}
                </div>
            </div>
            <div style="margin-bottom: 20px;">
                <label>投注金额 (BNB):</label>
                <input type="number" id="betAmount" value="0.01" step="0.01" min="0.01">
            </div>
            <div style="display: flex; gap: 10px;">
                <button id="submitCommit">提交</button>
                <button id="closeModal" class="secondary">取消</button>
            </div>
            <div id="modalStatus"></div>
        `;
    } else if (vote.stage === 2) {
        // 揭示阶段
        const userCommit = userCommits[vote.id];
        if (!userCommit) {
            content.innerHTML = `
                <h2 style="color: #667eea;">你没有参与这个投票</h2>
                <button id="closeModal" class="secondary">关闭</button>
            `;
        } else {
            content.innerHTML = `
                <h2 style="color: #667eea; margin-bottom: 20px;">${escapeHtml(vote.question)}</h2>
                <div style="margin-bottom: 20px;">
                    <p>你的选择: <strong>${escapeHtml(vote.options[userCommit.choice])}</strong></p>
                    <p>投注金额: <strong>${ethers.formatEther(userCommit.betAmount)} BNB</strong></p>
                </div>
                <div style="display: flex; gap: 10px;">
                    <button id="submitReveal">提交揭示</button>
                    <button id="closeModal" class="secondary">取消</button>
                </div>
                <div id="modalStatus"></div>
            `;
        }
    }

    modal.appendChild(content);
    document.body.appendChild(modal);

    // 绑定事件
    let selectedOption = null;
    document.querySelectorAll('.vote-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.vote-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedOption = parseInt(opt.dataset.option);
        });
    });

    document.getElementById('closeModal')?.addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('submitCommit')?.addEventListener('click', async () => {
        if (selectedOption === null) {
            showStatus('modalStatus', 'error', '请选择一个选项!', false);
            return;
        }
        await submitCommit(vote.id, selectedOption);
    });

    document.getElementById('submitReveal')?.addEventListener('click', async () => {
        await submitReveal(vote.id);
    });
}

// 提交commit
async function submitCommit(voteId, choice) {
    try {
        const betAmountInput = document.getElementById('betAmount').value;
        const betAmount = ethers.parseEther(betAmountInput);

        // 生成随机secret
        const secret = ethers.hexlify(ethers.randomBytes(32));

        // 计算deposit (30%-70% of bet amount)
        const minDeposit = betAmount * BigInt(30) / BigInt(100);
        const maxDeposit = betAmount * BigInt(70) / BigInt(100);
        const randomPercent = Math.floor(Math.random() * 41) + 30; // 30-70
        const deposit = betAmount * BigInt(randomPercent) / BigInt(100);

        // 计算commitHash
        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ['uint256', 'uint256', 'uint256', 'bytes32', 'address'],
                [voteId, choice, betAmount, secret, userAddress]
            )
        );

        showStatus('modalStatus', 'info', '提交中...', false);

        const tx = await contract.commit(voteId, commitHash, { value: deposit });
        showStatus('modalStatus', 'info', '交易已提交，等待确认...', false);

        await tx.wait();

        // 保存commit信息到本地存储
        userCommits[voteId] = {
            choice: choice,
            betAmount: betAmount.toString(),
            secret: secret
        };
        localStorage.setItem('userCommits', JSON.stringify(userCommits));

        showStatus('modalStatus', 'success', '✅ 提交成功! 请在揭示阶段提交揭示。', false);

        setTimeout(() => {
            document.getElementById('voteModalContent')?.remove();
            loadActiveVotes();
        }, 2000);

    } catch (error) {
        console.error('提交commit失败:', error);
        showStatus('modalStatus', 'error', '提交失败: ' + (error.reason || error.message), false);
    }
}

// 提交reveal
async function submitReveal(voteId) {
    try {
        const commit = userCommits[voteId];
        if (!commit) {
            showStatus('modalStatus', 'error', '找不到commit信息!', false);
            return;
        }

        showStatus('modalStatus', 'info', '提交揭示中...', false);

        const tx = await contract.reveal(
            voteId,
            commit.choice,
            commit.betAmount,
            commit.secret
        );
        showStatus('modalStatus', 'info', '交易已提交，等待确认...', false);

        await tx.wait();

        showStatus('modalStatus', 'success', '✅ 揭示提交成功!', false);

        setTimeout(() => {
            document.getElementById('voteModalContent')?.remove();
            loadActiveVotes();
        }, 2000);

    } catch (error) {
        console.error('提交reveal失败:', error);
        showStatus('modalStatus', 'error', '提交失败: ' + (error.reason || error.message), false);
    }
}

// 加载我的投票
async function loadMyVotes() {
    const container = document.getElementById('myVotesList');

    if (!contract) {
        container.innerHTML = '<div class="empty-state"><p>请先连接钱包</p></div>';
        return;
    }

    try {
        container.innerHTML = '<div class="status info">加载中...</div>';

        // 从localStorage恢复commits
        const storedCommits = localStorage.getItem('userCommits');
        if (storedCommits) {
            userCommits = JSON.parse(storedCommits);
        }

        const voteIds = Object.keys(userCommits).map(Number);

        if (voteIds.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>你还没有参与任何投票</p></div>';
            return;
        }

        const myVotes = [];
        for (const voteId of voteIds) {
            try {
                const voteInfo = await contract.getVoteInfo(voteId);
                const commitInfo = await contract.getCommit(voteId, userAddress);

                myVotes.push({
                    id: Number(voteInfo[0]),
                    question: voteInfo[2],
                    options: voteInfo[3],
                    stage: Number(voteInfo[4]),
                    finalized: voteInfo[8],
                    winningOption: Number(voteInfo[9]),
                    commitInfo: commitInfo,
                    localCommit: userCommits[voteId]
                });
            } catch (error) {
                console.error(`获取投票${voteId}信息失败:`, error);
            }
        }

        container.innerHTML = myVotes.map(vote => createMyVoteCard(vote)).join('');

        // 绑定领取奖励按钮
        myVotes.forEach(vote => {
            const claimBtn = document.getElementById(`claim-btn-${vote.id}`);
            if (claimBtn) {
                claimBtn.addEventListener('click', () => claimReward(vote.id));
            }
        });

    } catch (error) {
        console.error('加载我的投票失败:', error);
        container.innerHTML = '<div class="status error">加载失败: ' + error.message + '</div>';
    }
}

// 创建我的投票卡片
function createMyVoteCard(vote) {
    const stageBadge = vote.stage === 1 ? 'commit' :
                       vote.stage === 2 ? 'reveal' :
                       vote.stage === 3 ? 'finalized' : 'claiming';

    let actionButton = '';
    if (vote.stage === 4 && vote.commitInfo.revealed) {
        actionButton = `<button id="claim-btn-${vote.id}">领取奖励</button>`;
    }

    const choiceText = vote.localCommit ?
        `你的选择: ${escapeHtml(vote.options[vote.localCommit.choice])}` :
        '选择信息丢失';

    return `
        <div class="vote-card">
            <h3>${escapeHtml(vote.question)}</h3>
            <div class="vote-meta">
                <span class="badge ${stageBadge}">${VoteStage[vote.stage]}</span>
            </div>
            <div class="vote-meta">
                ${choiceText}<br>
                ${vote.finalized && vote.winningOption !== 999999 ?
                    `获胜选项: ${escapeHtml(vote.options[vote.winningOption])}` :
                    ''}
            </div>
            ${actionButton}
        </div>
    `;
}

// 领取奖励
async function claimReward(voteId) {
    try {
        const reward = await contract.calculateReward(voteId, userAddress);

        if (reward === 0n) {
            alert('没有可领取的奖励');
            return;
        }

        if (!confirm(`你将获得 ${ethers.formatEther(reward)} BNB, 确认领取?`)) {
            return;
        }

        const tx = await contract.claimReward(voteId);
        alert('交易已提交，等待确认...');

        await tx.wait();
        alert('✅ 奖励领取成功!');

        loadMyVotes();

    } catch (error) {
        console.error('领取奖励失败:', error);
        alert('领取失败: ' + (error.reason || error.message));
    }
}

// 工具函数
function showStatus(elementId, type, message, show) {
    const element = document.getElementById(elementId);
    element.className = `status ${type}`;
    element.innerHTML = message;
    if (show !== undefined) {
        element.style.display = show ? 'block' : '';
    }
}

function formatTimeLeft(seconds) {
    if (seconds < 0) return '已结束';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
