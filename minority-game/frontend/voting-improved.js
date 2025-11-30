// Contract Configuration
const CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const CONTRACT_ABI = [
    "function createVote(string memory question, string[] memory options, uint256 commitDuration, uint256 revealDuration) external returns (uint256)",
    "function commit(uint256 voteId, bytes32 commitHash) external payable",
    "function startRevealPhase(uint256 voteId) external",
    "function reveal(uint256 voteId, uint256 choice, bytes32 secret) external",
    "function finalizeVote(uint256 voteId) external",
    "function claimReward(uint256 voteId) external",
    "function calculateReward(uint256 voteId, address player) external view returns (uint256)",
    "function getVoteInfo(uint256 voteId) external view returns (tuple(uint256 voteId, address creator, string question, string[] options, uint8 stage, uint256 commitEndTime, uint256 revealEndTime, uint256 totalBets, bool finalized, uint256 winningOption, uint256 createdAt))",
    "function getOptionTotal(uint256 voteId, uint256 optionIndex) external view returns (uint256)",
    "function getCommit(uint256 voteId, address player) external view returns (bytes32 commitHash, bool revealed, uint256 choice, uint256 betAmount)",
    "function getParticipants(uint256 voteId) external view returns (address[] memory)",
    "function getAllActiveVotes() external view returns (uint256[] memory)",
    "function voteCounter() external view returns (uint256)"
];

// Global Variables
let provider;
let signer;
let contract;
let userAddress;
let userCommits = {}; // Per-wallet commits: {walletAddress: {voteId: {choice, secret, betAmount}}}
let autoRevealEnabled = true;

// Stage Labels (English)
const VoteStage = {
    0: "Active",
    1: "Commit Phase",
    2: "Reveal Phase",
    3: "Finalized",
    4: "Claiming"
};

// Initialize on page load
document.addEventListener('DOMContentLoaded', async () => {
    setupEventListeners();
    checkWalletConnection();
    startAutoRefreshTimer();
    initAutoReveal();
});

// Load user commits from localStorage (per wallet)
function loadUserCommits() {
    if (!userAddress) return;

    const allCommits = localStorage.getItem('allUserCommits');
    if (allCommits) {
        const parsed = JSON.parse(allCommits);
        userCommits = parsed[userAddress.toLowerCase()] || {};
    } else {
        userCommits = {};
    }
}

// Save user commits to localStorage (per wallet)
function saveUserCommits() {
    if (!userAddress) return;

    const allCommits = localStorage.getItem('allUserCommits');
    const parsed = allCommits ? JSON.parse(allCommits) : {};

    parsed[userAddress.toLowerCase()] = userCommits;
    localStorage.setItem('allUserCommits', JSON.stringify(parsed));
}

// Setup Event Listeners
function setupEventListeners() {
    document.getElementById('connectWallet').addEventListener('click', connectWallet);
    document.getElementById('disconnectWallet').addEventListener('click', disconnectWallet);

    document.querySelectorAll('.tab').forEach(tab => {
        tab.addEventListener('click', () => switchTab(tab.dataset.tab));
    });

    document.getElementById('addOption').addEventListener('click', addOptionInput);
    document.getElementById('createVote').addEventListener('click', createVote);

    document.getElementById('refreshActive').addEventListener('click', loadActiveVotes);
    document.getElementById('refreshHistory').addEventListener('click', loadHistoryVotes);
}

// Switch Tab
function switchTab(tabName) {
    document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
        if (tab.dataset.tab === tabName) {
            tab.classList.add('active');
        }
    });

    document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
    });
    document.getElementById(`${tabName}-tab`).classList.add('active');

    if (tabName === 'active') {
        loadActiveVotes();
    } else if (tabName === 'history') {
        loadHistoryVotes();
    }
}

// Connect Wallet
async function connectWallet() {
    try {
        if (typeof window.ethereum === 'undefined') {
            showStatus('walletStatus', 'error', '⚠️ Please install MetaMask!', true);
            return;
        }

        showStatus('walletStatus', 'info', 'Connecting...', true);

        await window.ethereum.request({ method: 'eth_requestAccounts' });

        provider = new ethers.BrowserProvider(window.ethereum);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        contract = new ethers.Contract(CONTRACT_ADDRESS, CONTRACT_ABI, signer);

        // Load commits for this wallet
        loadUserCommits();

        showStatus('walletStatus', 'success', `✅ Connected: ${userAddress.slice(0, 6)}...${userAddress.slice(-4)}`, true);

        window.ethereum.on('accountsChanged', handleAccountsChanged);
        window.ethereum.on('chainChanged', () => window.location.reload());

        loadActiveVotes();

    } catch (error) {
        console.error('Wallet connection failed:', error);
        showStatus('walletStatus', 'error', 'Connection failed: ' + error.message, true);
    }
}

// Disconnect Wallet
async function disconnectWallet() {
    provider = null;
    signer = null;
    contract = null;
    userAddress = null;
    userCommits = {};

    showStatus('walletStatus', 'info', 'Disconnected', true);
}

// Check Wallet Connection
async function checkWalletConnection() {
    if (typeof window.ethereum !== 'undefined') {
        try {
            const accounts = await window.ethereum.request({ method: 'eth_accounts' });
            if (accounts.length > 0) {
                await connectWallet();
            }
        } catch (error) {
            console.error('Check wallet failed:', error);
        }
    }
}

// Handle Account Changes
function handleAccountsChanged(accounts) {
    if (accounts.length === 0) {
        disconnectWallet();
    } else {
        window.location.reload();
    }
}

// Add Option Input
function addOptionInput() {
    const container = document.getElementById('optionsInputs');
    const currentOptions = container.querySelectorAll('.option-input-group').length;

    if (currentOptions >= 10) {
        showStatus('createStatus', 'error', 'Maximum 10 options allowed', false);
        return;
    }

    const div = document.createElement('div');
    div.className = 'option-input-group';
    div.innerHTML = `
        <input type="text" placeholder="Option ${currentOptions + 1}" class="option-input">
        <button onclick="this.parentElement.remove()" class="secondary">Remove</button>
    `;
    container.appendChild(div);
}

// Create Vote
async function createVote() {
    if (!contract) {
        showStatus('createStatus', 'error', 'Please connect wallet first!', false);
        return;
    }

    const question = document.getElementById('voteQuestion').value.trim();
    const optionInputs = document.querySelectorAll('.option-input');
    const options = Array.from(optionInputs)
        .map(input => input.value.trim())
        .filter(opt => opt.length > 0);

    const commitMinutes = parseInt(document.getElementById('commitDuration').value) || 60;
    const revealMinutes = parseInt(document.getElementById('revealDuration').value) || 30;
    const commitDuration = commitMinutes * 60;
    const revealDuration = revealMinutes * 60;

    if (!question) {
        showStatus('createStatus', 'error', 'Please enter a question!', false);
        return;
    }

    if (options.length < 2) {
        showStatus('createStatus', 'error', 'At least 2 options required!', false);
        return;
    }

    if (options.length > 10) {
        showStatus('createStatus', 'error', 'Maximum 10 options allowed!', false);
        return;
    }

    if (commitMinutes < 5 || commitMinutes > 1440) {
        showStatus('createStatus', 'error', 'Commit phase must be between 5 and 1440 minutes!', false);
        return;
    }

    if (revealMinutes < 5 || revealMinutes > 720) {
        showStatus('createStatus', 'error', 'Reveal phase must be between 5 and 720 minutes!', false);
        return;
    }

    try {
        showStatus('createStatus', 'info', 'Creating vote...', false);

        const tx = await contract.createVote(question, options, commitDuration, revealDuration);
        showStatus('createStatus', 'info', 'Transaction submitted, waiting for confirmation...', false);

        const receipt = await tx.wait();

        showStatus('createStatus', 'success', `✅ Vote created successfully! TX: ${receipt.hash.slice(0, 10)}...`, false);

        document.getElementById('voteQuestion').value = '';
        document.querySelectorAll('.option-input').forEach(input => input.value = '');
        document.getElementById('commitDuration').value = '60';
        document.getElementById('revealDuration').value = '30';

        setTimeout(() => {
            switchTab('active');
        }, 2000);

    } catch (error) {
        console.error('Create vote failed:', error);
        showStatus('createStatus', 'error', 'Creation failed: ' + (error.reason || error.message), false);
    }
}

// Check if user has committed on-chain
async function hasUserCommitted(voteId) {
    try {
        const commitInfo = await contract.getCommit(voteId, userAddress);
        // commitHash will be non-zero if user has committed
        return commitInfo[0] !== "0x0000000000000000000000000000000000000000000000000000000000000000";
    } catch (error) {
        console.error('Check commit failed:', error);
        return false;
    }
}

// Load Active Votes
async function loadActiveVotes() {
    const container = document.getElementById('activeVotesList');

    if (!contract) {
        container.innerHTML = '<div class="empty-state"><p>Please connect wallet first</p></div>';
        return;
    }

    try {
        container.innerHTML = '<div class="status info">Loading votes...</div>';

        const voteCounter = await contract.voteCounter();
        const voteCount = Number(voteCounter);

        if (voteCount === 0) {
            container.innerHTML = '<div class="empty-state"><p>No votes yet</p></div>';
            return;
        }

        const votes = [];
        for (let i = 1; i <= voteCount; i++) {
            try {
                const voteInfo = await contract.getVoteInfo(i);
                const stage = Number(voteInfo[4]);

                // Show stage 1, 2, and 3 (before finalized)
                if (stage === 1 || stage === 2 || (stage === 3 && !voteInfo[8])) {
                    const vote = {
                        id: Number(voteInfo[0]),
                        creator: voteInfo[1],
                        question: voteInfo[2],
                        options: voteInfo[3],
                        stage: stage,
                        commitEndTime: Number(voteInfo[5]),
                        revealEndTime: Number(voteInfo[6]),
                        totalBets: voteInfo[7],
                        finalized: voteInfo[8],
                        winningOption: Number(voteInfo[9]),
                        createdAt: Number(voteInfo[10])
                    };

                    // Check if user has committed on-chain
                    vote.userHasCommitted = await hasUserCommitted(i);

                    votes.push(vote);
                }
            } catch (error) {
                console.error(`Failed to get vote ${i}:`, error);
            }
        }

        if (votes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No active votes</p></div>';
            return;
        }

        // Fetch option totals only for reveal phase
        for (let vote of votes) {
            vote.optionTotals = [];
            if (vote.stage >= 2) { // Only show in reveal phase or later
                for (let i = 0; i < vote.options.length; i++) {
                    try {
                        const total = await contract.getOptionTotal(vote.id, i);
                        vote.optionTotals.push(total);
                    } catch (error) {
                        vote.optionTotals.push(0n);
                    }
                }
            }
        }

        container.innerHTML = votes.map(vote => createVoteCard(vote)).join('');

        // Attach event listeners
        votes.forEach(vote => {
            const voteBtn = document.getElementById(`vote-btn-${vote.id}`);
            const revealBtn = document.getElementById(`reveal-btn-${vote.id}`);
            const startRevealBtn = document.getElementById(`start-reveal-btn-${vote.id}`);
            const finalizeBtn = document.getElementById(`finalize-btn-${vote.id}`);
            const claimBtn = document.getElementById(`claim-btn-${vote.id}`);

            if (voteBtn) {
                voteBtn.addEventListener('click', () => showVoteModal(vote));
            }

            if (revealBtn) {
                revealBtn.addEventListener('click', () => showRevealModal(vote));
            }

            if (startRevealBtn) {
                startRevealBtn.addEventListener('click', () => triggerRevealPhase(vote.id));
            }

            if (finalizeBtn) {
                finalizeBtn.addEventListener('click', () => finalizeVote(vote.id));
            }

            if (claimBtn) {
                claimBtn.addEventListener('click', () => claimReward(vote.id));
            }
        });

    } catch (error) {
        console.error('Load active votes failed:', error);
        container.innerHTML = '<div class="status error">Loading failed: ' + error.message + '</div>';
    }
}

// Create Vote Card
function createVoteCard(vote) {
    const now = Math.floor(Date.now() / 1000);
    const stageBadge = vote.stage === 1 ? 'commit' : vote.stage === 2 ? 'reveal' : 'finalized';

    let timeLeft = 0;
    if (vote.stage === 1) {
        timeLeft = vote.commitEndTime - now;
    } else if (vote.stage === 2) {
        timeLeft = vote.revealEndTime - now;
    }

    const totalPool = ethers.formatEther(vote.totalBets);

    const commitEnded = now >= vote.commitEndTime;
    const revealEnded = now >= vote.revealEndTime;
    const showStartReveal = vote.stage === 1 && commitEnded;
    const showFinalize = vote.stage === 2 && revealEnded;

    // Check if user has revealed
    const userHasRevealed = userCommits[vote.id] && userCommits[vote.id].revealed;

    return `
        <div class="vote-card">
            <h3>${escapeHtml(vote.question)}</h3>
            <div class="vote-meta">
                <span class="badge ${stageBadge}">${VoteStage[vote.stage]}</span>
                ${timeLeft > 0 ? `<span class="countdown">Time Left: ${formatTimeLeft(timeLeft)}</span>` :
                  `<span class="countdown" style="color: #ff6666;">Ended</span>`}
            </div>
            <div class="vote-meta">
                <span class="vote-meta-item">
                    <span class="vote-meta-label">Creator:</span>
                    <span class="vote-meta-value">${vote.creator.slice(0, 6)}...${vote.creator.slice(-4)}</span>
                </span>
                <span class="vote-meta-item">
                    <span class="vote-meta-label">Options:</span>
                    <span class="vote-meta-value">${vote.options.length}</span>
                </span>
            </div>
            <div class="total-pool">💰 Total Pool: ${totalPool} ETH</div>

            ${vote.stage === 1 ? `
                <div class="vote-stats">
                    <strong>Current Bets by Option:</strong>
                    ${vote.options.map((opt, idx) => `
                        <div style="margin-top: 8px;">
                            <span style="color: #00ffff;">${escapeHtml(opt)}:</span>
                            <span style="color: #ffaa00; margin-left: 10px;">🔒 Hidden</span>
                        </div>
                    `).join('')}
                    <p style="color: #aaffff; font-size: 10px; margin-top: 10px;">
                        💡 Bet amounts will be revealed during reveal phase
                    </p>
                </div>
            ` : vote.stage >= 2 && vote.optionTotals.length > 0 ? `
                <div class="vote-stats">
                    <strong>Revealed Bets by Option:</strong>
                    ${vote.options.map((opt, idx) => `
                        <div style="margin-top: 8px;">
                            <span style="color: #00ffff;">${escapeHtml(opt)}:</span>
                            <span style="color: #ffaa00; margin-left: 10px;">${ethers.formatEther(vote.optionTotals[idx])} ETH</span>
                        </div>
                    `).join('')}
                </div>
            ` : ''}

            <div style="margin-top: 15px; display: flex; gap: 10px; flex-wrap: wrap;">
                ${vote.stage === 1 ? `
                    <button id="vote-btn-${vote.id}" class="secondary" ${vote.userHasCommitted ? 'disabled' : ''}>
                        ${vote.userHasCommitted ? 'Already Voted' : 'Submit Vote'}
                    </button>
                    ${showStartReveal ? `
                        <button id="start-reveal-btn-${vote.id}" class="danger">
                            Start Reveal Phase
                        </button>
                    ` : ''}
                ` : vote.stage === 2 ? `
                    ${vote.userHasCommitted && !userHasRevealed ? `
                        <button id="reveal-btn-${vote.id}">
                            Submit Reveal
                        </button>
                    ` : ''}
                    ${showFinalize ? `
                        <button id="finalize-btn-${vote.id}" class="danger">
                            Finalize Vote
                        </button>
                    ` : ''}
                ` : vote.stage === 3 && !vote.finalized ? `
                    <button id="finalize-btn-${vote.id}" class="danger">
                        Finalize Vote
                    </button>
                ` : vote.stage === 3 && vote.finalized ? `
                    <button id="claim-btn-${vote.id}">
                        Claim Reward
                    </button>
                ` : ''}
            </div>
        </div>
    `;
}

// Trigger Reveal Phase Manually
async function triggerRevealPhase(voteId) {
    if (!confirm('Start the reveal phase for this vote?')) {
        return;
    }

    try {
        const tx = await contract.startRevealPhase(voteId);
        alert('Transaction submitted, waiting for confirmation...');
        await tx.wait();
        alert('✅ Reveal phase started!');
        loadActiveVotes();
    } catch (error) {
        console.error('Start reveal phase failed:', error);
        alert('Failed: ' + (error.reason || error.message));
    }
}

// Finalize Vote
async function finalizeVote(voteId) {
    if (!confirm('Finalize this vote and determine the winner?')) {
        return;
    }

    try {
        const tx = await contract.finalizeVote(voteId);
        alert('Transaction submitted, waiting for confirmation...');
        await tx.wait();
        alert('✅ Vote finalized! Winners can now claim rewards.');
        loadActiveVotes();
        loadHistoryVotes();
    } catch (error) {
        console.error('Finalize vote failed:', error);
        alert('Failed: ' + (error.reason || error.message));
    }
}

// Show Vote Modal (Commit Phase)
async function showVoteModal(vote) {
    if (vote.userHasCommitted) {
        alert('You have already voted in this poll!');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'voteModal';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <h2>${escapeHtml(vote.question)}</h2>
        <div style="margin-bottom: 20px;">
            <label>Select Your Answer:</label>
            <div id="optionsList" class="vote-options">
                ${vote.options.map((opt, idx) => `
                    <div class="vote-option" data-option="${idx}">
                        <span>${escapeHtml(opt)}</span>
                    </div>
                `).join('')}
            </div>
        </div>
        <div style="margin-bottom: 20px;">
            <label>Bet Amount (ETH):</label>
            <input type="number" id="betAmount" value="0.01" step="0.001" min="0.001" style="width: 100%;">
            <p style="color: #aaffff; font-size: 11px; margin-top: 8px;">
                💡 Tip: Your bet will be deducted immediately
            </p>
        </div>
        <div class="modal-buttons">
            <button id="submitCommit">Submit Vote</button>
            <button id="closeModal" class="secondary">Cancel</button>
        </div>
        <div id="modalStatus"></div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    let selectedOption = null;
    document.querySelectorAll('.vote-option').forEach(opt => {
        opt.addEventListener('click', () => {
            document.querySelectorAll('.vote-option').forEach(o => o.classList.remove('selected'));
            opt.classList.add('selected');
            selectedOption = parseInt(opt.dataset.option);
        });
    });

    document.getElementById('closeModal').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('submitCommit').addEventListener('click', async () => {
        if (selectedOption === null) {
            showStatus('modalStatus', 'error', 'Please select an option!', false);
            return;
        }
        await submitCommit(vote.id, selectedOption);
    });
}

// Show Reveal Modal
async function showRevealModal(vote) {
    const userCommit = userCommits[vote.id];
    if (!userCommit) {
        alert('You did not participate in this vote');
        return;
    }

    const modal = document.createElement('div');
    modal.className = 'modal';
    modal.id = 'revealModal';

    const content = document.createElement('div');
    content.className = 'modal-content';
    content.innerHTML = `
        <h2>${escapeHtml(vote.question)}</h2>
        <div style="margin-bottom: 20px;">
            <p style="font-size: 14px;">Your Choice: <strong style="color: #00ffff;">${escapeHtml(vote.options[userCommit.choice])}</strong></p>
            <p style="color: #aaffff; font-size: 11px; margin-top: 10px;">
                Submit your reveal to finalize your vote
            </p>
        </div>
        <div class="modal-buttons">
            <button id="submitReveal">Submit Reveal</button>
            <button id="closeModal" class="secondary">Cancel</button>
        </div>
        <div id="modalStatus"></div>
    `;

    modal.appendChild(content);
    document.body.appendChild(modal);

    document.getElementById('closeModal').addEventListener('click', () => {
        modal.remove();
    });

    document.getElementById('submitReveal').addEventListener('click', async () => {
        await submitReveal(vote.id);
    });
}

// Submit Commit
async function submitCommit(voteId, choice) {
    try {
        const betAmountInput = document.getElementById('betAmount').value;
        const betAmount = ethers.parseEther(betAmountInput);

        const secret = ethers.hexlify(ethers.randomBytes(32));

        const commitHash = ethers.keccak256(
            ethers.solidityPacked(
                ['uint256', 'uint256', 'bytes32', 'address'],
                [voteId, choice, secret, userAddress]
            )
        );

        showStatus('modalStatus', 'info', 'Submitting...', false);

        const tx = await contract.commit(voteId, commitHash, { value: betAmount });
        showStatus('modalStatus', 'info', 'Transaction submitted, waiting for confirmation...', false);

        await tx.wait();

        // Save commit info locally
        userCommits[voteId] = {
            choice: choice,
            secret: secret,
            betAmount: betAmountInput,
            revealed: false
        };
        saveUserCommits();

        showStatus('modalStatus', 'success', '✅ Vote submitted! Please reveal during reveal phase.', false);

        setTimeout(() => {
            document.getElementById('voteModal')?.remove();
            loadActiveVotes();
        }, 2000);

    } catch (error) {
        console.error('Submit commit failed:', error);
        showStatus('modalStatus', 'error', 'Submission failed: ' + (error.reason || error.message), false);
    }
}

// Submit Reveal
async function submitReveal(voteId) {
    try {
        const commit = userCommits[voteId];
        if (!commit) {
            showStatus('modalStatus', 'error', 'Commit information not found!', false);
            return;
        }

        showStatus('modalStatus', 'info', 'Submitting reveal...', false);

        const tx = await contract.reveal(
            voteId,
            commit.choice,
            commit.secret
        );
        showStatus('modalStatus', 'info', 'Transaction submitted, waiting for confirmation...', false);

        await tx.wait();

        showStatus('modalStatus', 'success', '✅ Reveal submitted successfully!', false);

        userCommits[voteId].revealed = true;
        saveUserCommits();

        setTimeout(() => {
            document.getElementById('revealModal')?.remove();
            loadActiveVotes();
        }, 2000);

    } catch (error) {
        console.error('Submit reveal failed:', error);
        showStatus('modalStatus', 'error', 'Submission failed: ' + (error.reason || error.message), false);
    }
}

// Load History Votes
async function loadHistoryVotes() {
    const container = document.getElementById('historyVotesList');

    if (!contract) {
        container.innerHTML = '<div class="empty-state"><p>Please connect wallet first</p></div>';
        return;
    }

    try {
        container.innerHTML = '<div class="status info">Loading history...</div>';

        const voteCounter = await contract.voteCounter();
        const voteCount = Number(voteCounter);

        if (voteCount === 0) {
            container.innerHTML = '<div class="empty-state"><p>No votes yet</p></div>';
            return;
        }

        const votes = [];
        for (let i = 1; i <= voteCount; i++) {
            try {
                const voteInfo = await contract.getVoteInfo(i);
                const finalized = voteInfo[8];

                if (finalized) {
                    votes.push({
                        id: Number(voteInfo[0]),
                        creator: voteInfo[1],
                        question: voteInfo[2],
                        options: voteInfo[3],
                        stage: Number(voteInfo[4]),
                        totalBets: voteInfo[7],
                        finalized: finalized,
                        winningOption: Number(voteInfo[9])
                    });
                }
            } catch (error) {
                console.error(`Failed to get vote ${i}:`, error);
            }
        }

        if (votes.length === 0) {
            container.innerHTML = '<div class="empty-state"><p>No finished votes</p></div>';
            return;
        }

        container.innerHTML = votes.map(vote => createHistoryCard(vote)).join('');

        votes.forEach(vote => {
            const claimBtn = document.getElementById(`history-claim-btn-${vote.id}`);
            if (claimBtn) {
                claimBtn.addEventListener('click', () => claimReward(vote.id));
            }
        });

    } catch (error) {
        console.error('Load history failed:', error);
        container.innerHTML = '<div class="status error">Loading failed: ' + error.message + '</div>';
    }
}

// Create History Card
function createHistoryCard(vote) {
    const totalPool = ethers.formatEther(vote.totalBets);
    const userParticipated = userCommits[vote.id] !== undefined;
    const userRevealed = userParticipated && userCommits[vote.id].revealed;

    const winnerText = vote.winningOption !== 999999 ?
        vote.options[vote.winningOption] :
        'No Winner';

    return `
        <div class="vote-card">
            <h3>${escapeHtml(vote.question)}</h3>
            <div class="vote-meta">
                <span class="badge finalized">Finalized</span>
            </div>
            <div class="vote-meta">
                <span class="vote-meta-item">
                    <span class="vote-meta-label">Total Pool:</span>
                    <span class="vote-meta-value">${totalPool} ETH</span>
                </span>
                <span class="vote-meta-item">
                    <span class="vote-meta-label">Winner:</span>
                    <span class="vote-meta-value">${escapeHtml(winnerText)}</span>
                </span>
            </div>
            ${userParticipated ? `
                <div class="vote-stats">
                    <strong>Your Choice:</strong> ${escapeHtml(vote.options[userCommits[vote.id].choice])}<br>
                    ${userRevealed ? `
                        <button id="history-claim-btn-${vote.id}" style="margin-top: 10px;">Claim Reward</button>
                    ` : `
                        <span style="color: #ff6666;">Did not reveal - No reward</span>
                    `}
                </div>
            ` : ''}
        </div>
    `;
}

// Claim Reward
async function claimReward(voteId) {
    try {
        const reward = await contract.calculateReward(voteId, userAddress);

        if (reward === 0n) {
            alert('No reward available to claim. You may not have won or already claimed.');
            return;
        }

        if (!confirm(`You will receive ${ethers.formatEther(reward)} ETH. Confirm claim?`)) {
            return;
        }

        const tx = await contract.claimReward(voteId);
        alert('Transaction submitted, waiting for confirmation...');

        await tx.wait();
        alert('✅ Reward claimed successfully!');

        loadHistoryVotes();
        loadActiveVotes();

    } catch (error) {
        console.error('Claim reward failed:', error);
        alert('Claim failed: ' + (error.reason || error.message));
    }
}

// Auto-refresh timer
function startAutoRefreshTimer() {
    setInterval(() => {
        const activeTab = document.querySelector('.tab.active');
        if (activeTab && activeTab.dataset.tab === 'active' && contract) {
            loadActiveVotes();
        }
    }, 30000);
}

// Auto-reveal mechanism
function initAutoReveal() {
    setInterval(async () => {
        if (!contract || !autoRevealEnabled) return;

        try {
            for (const voteId in userCommits) {
                const commit = userCommits[voteId];
                if (commit.revealed) continue;

                const voteInfo = await contract.getVoteInfo(parseInt(voteId));
                const stage = Number(voteInfo[4]);

                if (stage === 2) {
                    console.log(`Auto-revealing vote ${voteId}...`);
                    try {
                        const tx = await contract.reveal(parseInt(voteId), commit.choice, commit.secret);
                        await tx.wait();
                        commit.revealed = true;
                        saveUserCommits();
                        console.log(`✅ Auto-revealed vote ${voteId}`);
                    } catch (error) {
                        console.error(`Auto-reveal failed for vote ${voteId}:`, error);
                    }
                }
            }
        } catch (error) {
            console.error('Auto-reveal check failed:', error);
        }
    }, 60000);
}

// Utility Functions
function showStatus(elementId, type, message, show) {
    const element = document.getElementById(elementId);
    if (!element) return;
    element.className = `status ${type}`;
    element.innerHTML = message;
    if (show !== undefined) {
        element.style.display = show ? 'block' : '';
    }
}

function formatTimeLeft(seconds) {
    if (seconds < 0) return 'Ended';
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
        return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
        return `${minutes}m ${secs}s`;
    } else {
        return `${secs}s`;
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}
