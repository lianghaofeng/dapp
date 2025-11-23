"""
Minority Wins Game - UML Diagrams Generator
生成用例图和原型图

依赖安装:
pip install matplotlib pillow

使用方法:
python diagrams.py
"""

import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch, Circle, Rectangle
from matplotlib.lines import Line2D
import matplotlib.patches as mpatches

# 设置中文字体
plt.rcParams['font.sans-serif'] = ['Arial Unicode MS', 'SimHei', 'DejaVu Sans']
plt.rcParams['axes.unicode_minus'] = False

# ============= 用例图 (Use Case Diagram) =============
def draw_use_case_diagram():
    fig, ax = plt.subplots(figsize=(16, 12))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.axis('off')
    
    # 标题
    ax.text(8, 11.5, 'Minority Wins Game - Use Case Diagram', 
            fontsize=20, weight='bold', ha='center')
    ax.text(8, 11, '少数派获胜游戏 - 用例图', 
            fontsize=16, ha='center', color='gray')
    
    # 系统边界
    system_box = FancyBboxPatch((3, 1), 10, 9, 
                                boxstyle="round,pad=0.1", 
                                edgecolor='#2196F3', 
                                facecolor='#E3F2FD', 
                                linewidth=3)
    ax.add_patch(system_box)
    ax.text(8, 9.5, 'Minority Wins Smart Contract', 
            fontsize=14, weight='bold', ha='center')
    
    # Actor 1: Player (玩家)
    player_circle = Circle((1.5, 6), 0.3, color='#FF9800', zorder=10)
    ax.add_patch(player_circle)
    ax.plot([1.5, 1.5], [5.7, 4.8], 'k-', linewidth=2)
    ax.plot([1.2, 1.8], [5.2, 5.2], 'k-', linewidth=2)
    ax.plot([1.5, 1.2], [4.8, 4.2], 'k-', linewidth=2)
    ax.plot([1.5, 1.8], [4.8, 4.2], 'k-', linewidth=2)
    ax.text(1.5, 3.8, 'Player\n玩家', fontsize=11, ha='center', weight='bold')
    
    # Actor 2: Owner (合约所有者)
    owner_circle = Circle((14.5, 8), 0.3, color='#4CAF50', zorder=10)
    ax.add_patch(owner_circle)
    ax.plot([14.5, 14.5], [7.7, 6.8], 'k-', linewidth=2)
    ax.plot([14.2, 14.8], [7.2, 7.2], 'k-', linewidth=2)
    ax.plot([14.5, 14.2], [6.8, 6.2], 'k-', linewidth=2)
    ax.plot([14.5, 14.8], [6.8, 6.2], 'k-', linewidth=2)
    ax.text(14.5, 5.8, 'Owner\n所有者', fontsize=11, ha='center', weight='bold')
    
    # Use Cases - Player Actions
    use_cases_player = [
        (5.5, 8, 'Connect Wallet\n连接钱包'),
        (5.5, 7, 'View Game Info\n查看游戏信息'),
        (5.5, 6, 'Submit Commit\n提交承诺'),
        (5.5, 5, 'Submit Reveal\n揭示选择'),
        (5.5, 4, 'Claim Reward\n领取奖励'),
        (5.5, 3, 'Check History\n查看历史'),
    ]
    
    # Use Cases - Owner Actions
    use_cases_owner = [
        (10.5, 8, 'Start New Game\n开始新游戏'),
        (10.5, 7, 'Finalize Game\n结算游戏'),
    ]
    
    # Use Cases - System Actions
    use_cases_system = [
        (8, 2.5, 'Verify Commit Hash\n验证承诺哈希'),
        (10.5, 5.5, 'Calculate Deposit\n计算押金'),
        (10.5, 4.5, 'Determine Winner\n判定赢家'),
        (10.5, 3.5, 'Distribute Rewards\n分配奖励'),
    ]
    
    player_ellipses = []
    # Draw Player Use Cases
    for x, y, label in use_cases_player:
        ellipse = patches.Ellipse((x, y), 1.6, 0.6, 
                                 facecolor='#FFF9C4', 
                                 edgecolor='#F57C00', 
                                 linewidth=2)
        ax.add_patch(ellipse)
        player_ellipses.append((x, y))
        lines = label.split('\n')
        ax.text(x, y+0.1, lines[0], fontsize=9, ha='center', weight='bold')
        ax.text(x, y-0.15, lines[1], fontsize=8, ha='center', color='gray')
    
    owner_ellipses = []
    # Draw Owner Use Cases
    for x, y, label in use_cases_owner:
        ellipse = patches.Ellipse((x, y), 1.6, 0.6, 
                                 facecolor='#C8E6C9', 
                                 edgecolor='#2E7D32', 
                                 linewidth=2)
        ax.add_patch(ellipse)
        owner_ellipses.append((x, y))
        lines = label.split('\n')
        ax.text(x, y+0.1, lines[0], fontsize=9, ha='center', weight='bold')
        ax.text(x, y-0.15, lines[1], fontsize=8, ha='center', color='gray')
    
    system_ellipses = []
    # Draw System Use Cases
    for x, y, label in use_cases_system:
        ellipse = patches.Ellipse((x, y), 1.6, 0.6, 
                                 facecolor='#E1BEE7', 
                                 edgecolor='#6A1B9A', 
                                 linewidth=2)
        ax.add_patch(ellipse)
        system_ellipses.append((x, y))
        lines = label.split('\n')
        ax.text(x, y+0.1, lines[0], fontsize=9, ha='center', weight='bold')
        ax.text(x, y-0.15, lines[1], fontsize=8, ha='center', color='gray')
    
    # Draw connections from Player to Use Cases
    for x, y in player_ellipses:
        ax.plot([1.5, x-0.8], [6, y], 'k-', linewidth=1.5, alpha=0.6)
    
    # Draw connections from Owner to Use Cases
    for x, y in owner_ellipses:
        ax.plot([14.5, x+0.8], [8, y], 'k-', linewidth=1.5, alpha=0.6)
    
    # Draw <<include>> relationships
    # Submit Commit includes Calculate Deposit
    arrow1 = FancyArrowPatch((5.5, 5.7), (10, 5.5),
                            arrowstyle='->', mutation_scale=20,
                            linestyle='--', color='#9C27B0', linewidth=1.5)
    ax.add_patch(arrow1)
    ax.text(7.5, 5.8, '<<include>>', fontsize=8, style='italic', color='#9C27B0')
    
    # Submit Reveal includes Verify Commit Hash
    arrow2 = FancyArrowPatch((5.8, 4.7), (7.5, 2.8),
                            arrowstyle='->', mutation_scale=20,
                            linestyle='--', color='#9C27B0', linewidth=1.5)
    ax.add_patch(arrow2)
    ax.text(6.5, 3.5, '<<include>>', fontsize=8, style='italic', color='#9C27B0')
    
    # Finalize Game includes Determine Winner
    arrow3 = FancyArrowPatch((10.5, 6.7), (10.5, 5.8),
                            arrowstyle='->', mutation_scale=20,
                            linestyle='--', color='#9C27B0', linewidth=1.5)
    ax.add_patch(arrow3)
    ax.text(11, 6.2, '<<include>>', fontsize=8, style='italic', color='#9C27B0')
    
    # Claim Reward includes Distribute Rewards
    arrow4 = FancyArrowPatch((6.3, 3.8), (9.7, 3.6),
                            arrowstyle='->', mutation_scale=20,
                            linestyle='--', color='#9C27B0', linewidth=1.5)
    ax.add_patch(arrow4)
    ax.text(8, 4, '<<include>>', fontsize=8, style='italic', color='#9C27B0')
    
    # Legend
    legend_elements = [
        Line2D([0], [0], color='#FF9800', linewidth=3, label='Player Actions'),
        Line2D([0], [0], color='#4CAF50', linewidth=3, label='Owner Actions'),
        Line2D([0], [0], color='#6A1B9A', linewidth=3, label='System Actions'),
        Line2D([0], [0], color='#9C27B0', linewidth=2, linestyle='--', label='Include Relationship')
    ]
    ax.legend(handles=legend_elements, loc='upper right', fontsize=9)
    
    plt.tight_layout()
    plt.savefig('use_case_diagram.png', dpi=300, bbox_inches='tight', facecolor='white')
    print("✓ Use Case Diagram saved as 'use_case_diagram.png'")
    plt.close()


# ============= 原型图 (Wireframe) =============
def draw_wireframes():
    fig = plt.figure(figsize=(20, 24))
    
    # ===== Screen 1: Commit Phase =====
    ax1 = plt.subplot(3, 2, 1)
    ax1.set_xlim(0, 10)
    ax1.set_ylim(0, 16)
    ax1.axis('off')
    
    # Header
    header = Rectangle((0, 15), 10, 1, facecolor='#1976D2', edgecolor='black', linewidth=2)
    ax1.add_patch(header)
    ax1.text(0.5, 15.5, '☰', fontsize=24, color='white', va='center')
    ax1.text(5, 15.5, 'Minority Wins Game', fontsize=14, weight='bold', 
             color='white', ha='center', va='center')
    ax1.text(9.5, 15.5, '👤', fontsize=20, color='white', va='center', ha='right')
    
    # Title
    ax1.text(5, 14, 'Commit Phase - 提交阶段', fontsize=16, weight='bold', ha='center')
    
    # Timer Box
    timer_box = FancyBboxPatch((2, 12.5), 6, 1, boxstyle="round,pad=0.1",
                               facecolor='#FFF3E0', edgecolor='#FF6F00', linewidth=2)
    ax1.add_patch(timer_box)
    ax1.text(5, 13, '⏱ Time Remaining: 45:23', fontsize=12, ha='center', weight='bold')
    
    # Game Info Box
    info_box = Rectangle((1, 10), 8, 2, facecolor='#E8F5E9', edgecolor='#388E3C', linewidth=2)
    ax1.add_patch(info_box)
    ax1.text(5, 11.5, 'Game #42', fontsize=13, weight='bold', ha='center')
    ax1.text(2, 11, '👥 Participants: 156', fontsize=10, ha='left')
    ax1.text(2, 10.5, '💰 Total Staked: ???', fontsize=10, ha='left')
    ax1.text(5, 10.2, '(Hidden during commit phase)', fontsize=8, 
             ha='center', style='italic', color='gray')
    
    # Choice Buttons
    ax1.text(5, 9.3, 'Select Your Choice:', fontsize=12, weight='bold', ha='center')
    
    option_a = FancyBboxPatch((1.5, 7.5), 3, 1.3, boxstyle="round,pad=0.1",
                              facecolor='#FFEBEE', edgecolor='#D32F2F', linewidth=3)
    ax1.add_patch(option_a)
    ax1.text(3, 8.5, '🅰️ Option A', fontsize=13, weight='bold', ha='center')
    ax1.text(3, 8, 'Red Team', fontsize=10, ha='center', color='gray')
    
    option_b = FancyBboxPatch((5.5, 7.5), 3, 1.3, boxstyle="round,pad=0.1",
                              facecolor='#E3F2FD', edgecolor='#1976D2', linewidth=3)
    ax1.add_patch(option_b)
    ax1.text(7, 8.5, '🅱️ Option B', fontsize=13, weight='bold', ha='center')
    ax1.text(7, 8, 'Blue Team', fontsize=10, ha='center', color='gray')
    
    # Bet Amount Input
    ax1.text(5, 6.8, 'Bet Amount:', fontsize=12, weight='bold', ha='center')
    amount_input = Rectangle((2, 5.8), 6, 0.7, facecolor='white', 
                             edgecolor='#757575', linewidth=2)
    ax1.add_patch(amount_input)
    ax1.text(2.3, 6.2, '1.5', fontsize=14, va='center')
    ax1.text(7.7, 6.2, 'BNB', fontsize=11, va='center', ha='right', color='gray')
    
    # Deposit Info
    deposit_box = Rectangle((2, 4.8), 6, 0.6, facecolor='#FFF9C4', 
                            edgecolor='#F57F17', linewidth=1)
    ax1.add_patch(deposit_box)
    ax1.text(5, 5.1, '💰 Deposit Required: 0.75 BNB (50%)', 
             fontsize=9, ha='center')
    
    # Submit Button
    submit_btn = FancyBboxPatch((2.5, 3.5), 5, 0.8, boxstyle="round,pad=0.1",
                                facecolor='#4CAF50', edgecolor='#2E7D32', linewidth=2)
    ax1.add_patch(submit_btn)
    ax1.text(5, 3.9, 'COMMIT YOUR CHOICE', fontsize=13, weight='bold', 
             ha='center', color='white')
    
    # Warning Box
    warning_box = Rectangle((1, 2), 8, 1, facecolor='#FFF3E0', 
                           edgecolor='#F57C00', linewidth=2)
    ax1.add_patch(warning_box)
    ax1.text(5, 2.7, '⚠️ Important:', fontsize=10, weight='bold', ha='center')
    ax1.text(5, 2.35, 'Your choice is hidden. Remember to reveal later!', 
             fontsize=9, ha='center')
    ax1.text(5, 2, 'Failure to reveal will result in deposit loss.', 
             fontsize=8, ha='center', color='red')
    
    # Info Section
    ax1.text(5, 1.3, 'ℹ️ How it works:', fontsize=10, weight='bold', ha='center')
    ax1.text(5, 0.9, '1. Choose A or B and enter bet amount', fontsize=8, ha='center')
    ax1.text(5, 0.6, '2. Pay deposit (30-70% of bet)', fontsize=8, ha='center')
    ax1.text(5, 0.3, '3. Wait for reveal phase to disclose choice', fontsize=8, ha='center')
    
    # ===== Screen 2: Reveal Phase =====
    ax2 = plt.subplot(3, 2, 2)
    ax2.set_xlim(0, 10)
    ax2.set_ylim(0, 16)
    ax2.axis('off')
    
    # Header
    header = Rectangle((0, 15), 10, 1, facecolor='#1976D2', edgecolor='black', linewidth=2)
    ax2.add_patch(header)
    ax2.text(0.5, 15.5, '☰', fontsize=24, color='white', va='center')
    ax2.text(5, 15.5, 'Minority Wins Game', fontsize=14, weight='bold', 
             color='white', ha='center', va='center')
    ax2.text(9.5, 15.5, '👤', fontsize=20, color='white', va='center', ha='right')
    
    # Title
    ax2.text(5, 14, 'Reveal Phase - 揭示阶段', fontsize=16, weight='bold', ha='center')
    
    # Timer Box
    timer_box = FancyBboxPatch((2, 12.5), 6, 1, boxstyle="round,pad=0.1",
                               facecolor='#FFEBEE', edgecolor='#D32F2F', linewidth=2)
    ax2.add_patch(timer_box)
    ax2.text(5, 13, '⏱ Time Remaining: 15:47', fontsize=12, ha='center', weight='bold')
    
    # Your Commit Info
    commit_box = Rectangle((1, 10), 8, 2.2, facecolor='#E8EAF6', 
                           edgecolor='#3F51B5', linewidth=2)
    ax2.add_patch(commit_box)
    ax2.text(5, 11.7, '✅ Your Commit Found', fontsize=13, weight='bold', ha='center')
    ax2.text(2, 11.2, '🔐 Choice: Option A (Hidden)', fontsize=10, ha='left')
    ax2.text(2, 10.8, '💵 Bet Amount: 1.5 BNB', fontsize=10, ha='left')
    ax2.text(2, 10.4, '💰 Deposit Paid: 0.75 BNB', fontsize=10, ha='left')
    ax2.text(5, 10, 'Status: Waiting for Reveal', fontsize=9, 
             ha='center', style='italic', color='gray')
    
    # Current Stats (Partial)
    stats_box = Rectangle((1, 8), 8, 1.5, facecolor='#FFF9C4', 
                          edgecolor='#F57F17', linewidth=2)
    ax2.add_patch(stats_box)
    ax2.text(5, 9.3, '📊 Current Stats (Live)', fontsize=12, weight='bold', ha='center')
    ax2.text(2, 8.8, '👥 Revealed: 89 / 156', fontsize=10, ha='left')
    ax2.text(2, 8.4, '🅰️ Option A: 45 reveals', fontsize=10, ha='left')
    ax2.text(2, 8, '🅱️ Option B: 44 reveals', fontsize=10, ha='left')
    
    # Reveal Button
    reveal_btn = FancyBboxPatch((2, 6.5), 6, 1, boxstyle="round,pad=0.1",
                                facecolor='#FF5722', edgecolor='#BF360C', linewidth=2)
    ax2.add_patch(reveal_btn)
    ax2.text(5, 7, 'REVEAL MY CHOICE NOW', fontsize=13, weight='bold', 
             ha='center', color='white')
    
    # Warning
    warning_box = Rectangle((1.5, 5), 7, 1.2, facecolor='#FFEBEE', 
                           edgecolor='#D32F2F', linewidth=2)
    ax2.add_patch(warning_box)
    ax2.text(5, 5.9, '⚠️ CRITICAL WARNING', fontsize=11, weight='bold', 
             ha='center', color='#D32F2F')
    ax2.text(5, 5.5, 'You MUST reveal before time expires!', fontsize=9, ha='center')
    ax2.text(5, 5.2, 'Otherwise, your 0.75 BNB deposit will be lost forever.', 
             fontsize=8, ha='center', color='#D32F2F')
    
    # Info Box
    info_box = Rectangle((1, 3), 8, 1.7, facecolor='#E1F5FE', 
                        edgecolor='#0277BD', linewidth=1)
    ax2.add_patch(info_box)
    ax2.text(5, 4.3, 'ℹ️ What happens when you reveal:', fontsize=10, 
             weight='bold', ha='center')
    ax2.text(5, 3.9, '• Your choice becomes public', fontsize=8, ha='center')
    ax2.text(5, 3.6, '• Contract verifies your commit hash', fontsize=8, ha='center')
    ax2.text(5, 3.3, '• Your bet is added to the total pool', fontsize=8, ha='center')
    ax2.text(5, 3, '• You become eligible for rewards if you win', fontsize=8, ha='center')
    
    # Strategy Note
    ax2.text(5, 2.3, '💡 Strategy Tip:', fontsize=10, weight='bold', ha='center')
    ax2.text(5, 1.9, 'Even if your option seems to be losing,', fontsize=8, ha='center')
    ax2.text(5, 1.6, 'ALWAYS reveal to get your deposit back!', fontsize=8, ha='center')
    ax2.text(5, 1.3, 'Others might be waiting to reveal at the last moment.', 
             fontsize=8, ha='center', style='italic', color='gray')
    
    # Progress Bar
    ax2.text(5, 0.8, 'Reveal Progress:', fontsize=9, weight='bold', ha='center')
    progress_bg = Rectangle((2, 0.4), 6, 0.25, facecolor='#E0E0E0', 
                           edgecolor='#757575', linewidth=1)
    ax2.add_patch(progress_bg)
    progress_fill = Rectangle((2, 0.4), 3.42, 0.25, facecolor='#4CAF50', 
                             edgecolor='none')
    ax2.add_patch(progress_fill)
    ax2.text(5, 0.25, '57%', fontsize=8, ha='center')
    
    # ===== Screen 3: Results =====
    ax3 = plt.subplot(3, 2, 3)
    ax3.set_xlim(0, 10)
    ax3.set_ylim(0, 16)
    ax3.axis('off')
    
    # Header
    header = Rectangle((0, 15), 10, 1, facecolor='#1976D2', edgecolor='black', linewidth=2)
    ax3.add_patch(header)
    ax3.text(0.5, 15.5, '☰', fontsize=24, color='white', va='center')
    ax3.text(5, 15.5, 'Minority Wins Game', fontsize=14, weight='bold', 
             color='white', ha='center', va='center')
    ax3.text(9.5, 15.5, '👤', fontsize=20, color='white', va='center', ha='right')
    
    # Title
    ax3.text(5, 14, 'Game Results - 游戏结果', fontsize=16, weight='bold', ha='center')
    ax3.text(5, 13.5, 'Game #42 - Finalized', fontsize=11, ha='center', color='gray')
    
    # Winner Banner
    winner_box = FancyBboxPatch((1, 11.5), 8, 1.8, boxstyle="round,pad=0.1",
                                facecolor='#C8E6C9', edgecolor='#2E7D32', linewidth=3)
    ax3.add_patch(winner_box)
    ax3.text(5, 12.8, '🎉 OPTION A WINS! 🎉', fontsize=15, weight='bold', 
             ha='center', color='#1B5E20')
    ax3.text(5, 12.3, '(Minority Option)', fontsize=11, ha='center', color='#388E3C')
    ax3.text(5, 11.8, 'Option A chose the path less traveled!', 
             fontsize=9, ha='center', style='italic')
    
    # Final Stats
    stats_box = Rectangle((1, 9), 8, 2.2, facecolor='#F5F5F5', 
                          edgecolor='#616161', linewidth=2)
    ax3.add_patch(stats_box)
    ax3.text(5, 10.8, '📊 Final Statistics', fontsize=12, weight='bold', ha='center')
    
    # Option A (Winner)
    ax3.text(2.5, 10.3, '🅰️ Option A', fontsize=10, weight='bold', ha='left', color='#D32F2F')
    ax3.text(2.5, 9.9, '45 players', fontsize=9, ha='left')
    ax3.text(2.5, 9.5, '67.5 BNB', fontsize=10, ha='left', weight='bold')
    ax3.text(2.5, 9.2, '(Minority - Winners!)', fontsize=8, ha='left', color='#2E7D32')
    
    # VS
    ax3.text(5, 9.7, 'VS', fontsize=12, weight='bold', ha='center', color='gray')
    
    # Option B (Loser)
    ax3.text(7.5, 10.3, '🅱️ Option B', fontsize=10, weight='bold', ha='right', color='#1976D2')
    ax3.text(7.5, 9.9, '111 players', fontsize=9, ha='right')
    ax3.text(7.5, 9.5, '166.5 BNB', fontsize=10, ha='right', weight='bold')
    ax3.text(7.5, 9.2, '(Majority - Lost)', fontsize=8, ha='right', color='#D32F2F')
    
    # Your Result - Winner
    your_result_box = FancyBboxPatch((1, 6.5), 8, 2.2, boxstyle="round,pad=0.1",
                                     facecolor='#E8F5E9', edgecolor='#4CAF50', linewidth=3)
    ax3.add_patch(your_result_box)
    ax3.text(5, 8.3, '✨ YOU WON! ✨', fontsize=14, weight='bold', 
             ha='center', color='#1B5E20')
    ax3.text(2, 7.8, '💵 Your Bet: 1.5 BNB', fontsize=10, ha='left')
    ax3.text(2, 7.4, '💰 Your Deposit: 0.75 BNB', fontsize=10, ha='left')
    ax3.text(2, 7.0, '🎁 Your Share: 3.7 BNB', fontsize=10, ha='left', color='#2E7D32')
    ax3.text(2, 6.6, '💎 Total Reward: 5.95 BNB', fontsize=11, ha='left', 
             weight='bold', color='#1B5E20')
    
    # Calculation Explanation
    calc_box = Rectangle((1, 4.8), 8, 1.5, facecolor='#FFF9C4', 
                         edgecolor='#F57F17', linewidth=1)
    ax3.add_patch(calc_box)
    ax3.text(5, 6.0, '🧮 Reward Calculation:', fontsize=10, weight='bold', ha='center')
    ax3.text(5, 5.6, 'Share = (Your Bet / Total Minority) × Total Majority', 
             fontsize=8, ha='center')
    ax3.text(5, 5.3, '= (1.5 / 67.5) × 166.5 = 3.7 BNB', fontsize=8, ha='center')
    ax3.text(5, 5.0, 'Total = Bet + Deposit + Share = 5.95 BNB', fontsize=8, ha='center')
    
    # Claim Button
    claim_btn = FancyBboxPatch((2, 3.5), 6, 0.9, boxstyle="round,pad=0.1",
                               facecolor='#FF9800', edgecolor='#E65100', linewidth=2)
    ax3.add_patch(claim_btn)
    ax3.text(5, 3.95, 'CLAIM YOUR REWARD', fontsize=13, weight='bold', 
             ha='center', color='white')
    
    # Additional Info
    ax3.text(5, 2.8, '📈 ROI: +296.7%', fontsize=11, weight='bold', 
             ha='center', color='#1B5E20')
    ax3.text(5, 2.4, 'Congratulations on choosing wisely!', fontsize=9, 
             ha='center', style='italic')
    
    # Next Game Info
    next_game_box = Rectangle((1.5, 1), 7, 0.8, facecolor='#E3F2FD', 
                             edgecolor='#1976D2', linewidth=1)
    ax3.add_patch(next_game_box)
    ax3.text(5, 1.5, '🎮 Next Game starts in: 05:32', fontsize=10, ha='center')
    ax3.text(5, 1.15, 'Get ready for Game #43!', fontsize=8, ha='center', color='gray')
    
    # Buttons
    ax3.text(2.5, 0.5, '📜 View Details', fontsize=9, ha='center', 
             bbox=dict(boxstyle='round', facecolor='white', edgecolor='#757575'))
    ax3.text(5, 0.5, '📊 History', fontsize=9, ha='center',
             bbox=dict(boxstyle='round', facecolor='white', edgecolor='#757575'))
    ax3.text(7.5, 0.5, '🔄 Play Again', fontsize=9, ha='center',
             bbox=dict(boxstyle='round', facecolor='#4CAF50', edgecolor='#2E7D32'))
    
    # ===== Screen 4: Lost Scenario =====
    ax4 = plt.subplot(3, 2, 4)
    ax4.set_xlim(0, 10)
    ax4.set_ylim(0, 16)
    ax4.axis('off')
    
    # Header
    header = Rectangle((0, 15), 10, 1, facecolor='#1976D2', edgecolor='black', linewidth=2)
    ax4.add_patch(header)
    ax4.text(0.5, 15.5, '☰', fontsize=24, color='white', va='center')
    ax4.text(5, 15.5, 'Minority Wins Game', fontsize=14, weight='bold', 
             color='white', ha='center', va='center')
    ax4.text(9.5, 15.5, '👤', fontsize=20, color='white', va='center', ha='right')
    
    # Title
    ax4.text(5, 14, 'Game Results - 游戏结果', fontsize=16, weight='bold', ha='center')
    ax4.text(5, 13.5, 'Game #42 - Finalized', fontsize=11, ha='center', color='gray')
    
    # Winner Banner (same as before)
    winner_box = FancyBboxPatch((1, 11.5), 8, 1.8, boxstyle="round,pad=0.1",
                                facecolor='#FFEBEE', edgecolor='#D32F2F', linewidth=3)
    ax4.add_patch(winner_box)
    ax4.text(5, 12.8, '🅰️ OPTION A WINS!', fontsize=15, weight='bold', 
             ha='center', color='#B71C1C')
    ax4.text(5, 12.3, '(Minority Option)', fontsize=11, ha='center', color='#D32F2F')
    ax4.text(5, 11.8, 'The minority prevailed this round!', 
             fontsize=9, ha='center', style='italic')
    
    # Final Stats (same numbers)
    stats_box = Rectangle((1, 9), 8, 2.2, facecolor='#F5F5F5', 
                          edgecolor='#616161', linewidth=2)
    ax4.add_patch(stats_box)
    ax4.text(5, 10.8, '📊 Final Statistics', fontsize=12, weight='bold', ha='center')
    
    ax4.text(2.5, 10.3, '🅰️ Option A', fontsize=10, weight='bold', ha='left', color='#D32F2F')
    ax4.text(2.5, 9.9, '45 players', fontsize=9, ha='left')
    ax4.text(2.5, 9.5, '67.5 BNB', fontsize=10, ha='left', weight='bold')
    ax4.text(2.5, 9.2, '(Minority - Winners!)', fontsize=8, ha='left', color='#2E7D32')
    
    ax4.text(5, 9.7, 'VS', fontsize=12, weight='bold', ha='center', color='gray')
    
    ax4.text(7.5, 10.3, '🅱️ Option B', fontsize=10, weight='bold', ha='right', color='#1976D2')
    ax4.text(7.5, 9.9, '111 players', fontsize=9, ha='right')
    ax4.text(7.5, 9.5, '166.5 BNB', fontsize=10, ha='right', weight='bold')
    ax4.text(7.5, 9.2, '(Majority - Lost)', fontsize=8, ha='right', color='#D32F2F')
    
    # Your Result - Loser
    your_result_box = FancyBboxPatch((1, 6.5), 8, 2.2, boxstyle="round,pad=0.1",
                                     facecolor='#FFEBEE', edgecolor='#D32F2F', linewidth=3)
    ax4.add_patch(your_result_box)
    ax4.text(5, 8.3, '😔 You Lost This Round', fontsize=14, weight='bold', 
             ha='center', color='#B71C1C')
    ax4.text(2, 7.8, '💵 Your Bet: 2.0 BNB', fontsize=10, ha='left')
    ax4.text(2, 7.4, '💰 Deposit Returned: 1.0 BNB', fontsize=10, ha='left', color='#2E7D32')
    ax4.text(2, 7.0, '❌ Bet Lost: -2.0 BNB', fontsize=10, ha='left', color='#D32F2F')
    ax4.text(2, 6.6, '💔 Net Result: -1.0 BNB', fontsize=11, ha='left', 
             weight='bold', color='#B71C1C')
    
    # Explanation
    explain_box = Rectangle((1, 4.8), 8, 1.5, facecolor='#FFF9C4', 
                           edgecolor='#F57F17', linewidth=1)
    ax4.add_patch(explain_box)
    ax4.text(5, 6.0, 'ℹ️ What Happened:', fontsize=10, weight='bold', ha='center')
    ax4.text(5, 5.6, 'You chose Option B (majority), so your bet was distributed', 
             fontsize=8, ha='center')
    ax4.text(5, 5.3, 'to Option A winners. Your deposit is returned because', 
             fontsize=8, ha='center')
    ax4.text(5, 5.0, 'you successfully revealed your choice.', fontsize=8, ha='center')
    
    # No Claim Button (Nothing to claim)
    no_claim_box = Rectangle((2, 3.5), 6, 0.9, facecolor='#E0E0E0', 
                            edgecolor='#9E9E9E', linewidth=2)
    ax4.add_patch(no_claim_box)
    ax4.text(5, 3.95, 'NOTHING TO CLAIM', fontsize=13, weight='bold', 
             ha='center', color='#616161')
    
    # Encouragement
    ax4.text(5, 2.8, '💪 Don\'t Give Up!', fontsize=11, weight='bold', ha='center')
    ax4.text(5, 2.4, 'Better luck in the next game!', fontsize=9, 
             ha='center', style='italic')
    ax4.text(5, 2.0, 'Remember: Predicting the minority is the key!', 
             fontsize=8, ha='center', color='gray')
    
    # Next Game Info
    next_game_box = Rectangle((1.5, 1), 7, 0.8, facecolor='#E3F2FD', 
                             edgecolor='#1976D2', linewidth=1)
    ax4.add_patch(next_game_box)
    ax4.text(5, 1.5, '🎮 Next Game starts in: 05:32', fontsize=10, ha='center')
    ax4.text(5, 1.15, 'Ready for revenge in Game #43?', fontsize=8, ha='center', color='gray')
    
    # Buttons
    ax4.text(2.5, 0.5, '📜 View Details', fontsize=9, ha='center', 
             bbox=dict(boxstyle='round', facecolor='white', edgecolor='#757575'))
    ax4.text(5, 0.5, '📊 History', fontsize=9, ha='center',
             bbox=dict(boxstyle='round', facecolor='white', edgecolor='#757575'))
    ax4.text(7.5, 0.5, '🔄 Try Again', fontsize=9, ha='center',
             bbox=dict(boxstyle='round', facecolor='#FF9800', edgecolor='#E65100'))
    
    # ===== Screen 5: Failed to Reveal =====
    ax5 = plt.subplot(3, 2, 5)
    ax5.set_xlim(0, 10)
    ax5.set_ylim(0, 16)
    ax5.axis('off')
    
    # Header
    header = Rectangle((0, 15), 10, 1, facecolor='#1976D2', edgecolor='black', linewidth=2)
    ax5.add_patch(header)
    ax5.text(0.5, 15.5, '☰', fontsize=24, color='white', va='center')
    ax5.text(5, 15.5, 'Minority Wins Game', fontsize=14, weight='bold', 
             color='white', ha='center', va='center')
    ax5.text(9.5, 15.5, '👤', fontsize=20, color='white', va='center', ha='right')
    
    # Title
    ax5.text(5, 14, 'Game Results - 游戏结果', fontsize=16, weight='bold', ha='center')
    ax5.text(5, 13.5, 'Game #42 - Finalized', fontsize=11, ha='center', color='gray')
    
    # Critical Warning Banner
    warning_banner = FancyBboxPatch((0.5, 11.5), 9, 2, boxstyle="round,pad=0.1",
                                    facecolor='#B71C1C', edgecolor='#000000', linewidth=3)
    ax5.add_patch(warning_banner)
    ax5.text(5, 12.9, '⚠️ DEPOSIT CONFISCATED ⚠️', fontsize=15, weight='bold', 
             ha='center', color='white')
    ax5.text(5, 12.4, 'You failed to reveal your choice!', fontsize=12, 
             ha='center', color='white')
    ax5.text(5, 11.9, 'Your deposit has been permanently lost.', fontsize=10, 
             ha='center', color='#FFCDD2')
    
    # Your Loss Box
    loss_box = FancyBboxPatch((1, 8.5), 8, 2.5, boxstyle="round,pad=0.1",
                              facecolor='#FFEBEE', edgecolor='#D32F2F', linewidth=3)
    ax5.add_patch(loss_box)
    ax5.text(5, 10.5, '💸 YOUR LOSS', fontsize=14, weight='bold', 
             ha='center', color='#B71C1C')
    ax5.text(2, 9.9, '🔐 Commit Hash: 0x7a4f...b39e', fontsize=9, ha='left', 
             family='monospace')
    ax5.text(2, 9.5, '💰 Deposit Paid: 0.75 BNB', fontsize=10, ha='left')
    ax5.text(2, 9.1, '❌ Status: NOT REVEALED', fontsize=10, ha='left', 
             weight='bold', color='#D32F2F')
    ax5.text(2, 8.7, '💔 Lost Forever: 0.75 BNB', fontsize=11, ha='left', 
             weight='bold', color='#B71C1C')
    
    # Explanation Box
    explain_box = Rectangle((1, 6), 8, 2.2, facecolor='#FFF3E0', 
                           edgecolor='#F57C00', linewidth=2)
    ax5.add_patch(explain_box)
    ax5.text(5, 7.8, '📋 What Went Wrong:', fontsize=11, weight='bold', ha='center')
    ax5.text(5, 7.4, '1. You submitted a commit during the commit phase', 
             fontsize=9, ha='center')
    ax5.text(5, 7.1, '2. You paid a deposit of 0.75 BNB', fontsize=9, ha='center')
    ax5.text(5, 6.8, '3. You did NOT reveal during the reveal phase', 
             fontsize=9, ha='center', color='#D32F2F', weight='bold')
    ax5.text(5, 6.5, '4. Your deposit was confiscated as penalty', 
             fontsize=9, ha='center', color='#D32F2F')
    ax5.text(5, 6.2, '(This prevents manipulation and ensures fairness)', 
             fontsize=8, ha='center', style='italic', color='gray')
    
    # Timeline Visualization
    ax5.text(5, 5.5, '⏱ Timeline:', fontsize=10, weight='bold', ha='center')
    
    # Timeline line
    ax5.plot([2, 8], [5, 5], 'k-', linewidth=2)
    
    # Commit point
    ax5.plot(2.5, 5, 'go', markersize=12)
    ax5.text(2.5, 4.6, 'Commit\n✅', fontsize=8, ha='center', color='#2E7D32')
    
    # Reveal missed
    ax5.plot(5, 5, 'ro', markersize=12)
    ax5.text(5, 4.6, 'Reveal\n❌', fontsize=8, ha='center', color='#D32F2F')
    
    # Finalized
    ax5.plot(7.5, 5, 'ko', markersize=12)
    ax5.text(7.5, 4.6, 'Finalized\n⏹', fontsize=8, ha='center')
    
    # Lessons Learned
    lesson_box = Rectangle((1, 2.5), 8, 1.5, facecolor='#E8EAF6', 
                          edgecolor='#3F51B5', linewidth=2)
    ax5.add_patch(lesson_box)
    ax5.text(5, 3.7, '💡 Lessons for Next Time:', fontsize=10, weight='bold', ha='center')
    ax5.text(5, 3.3, '• Set reminders during the reveal phase', fontsize=8, ha='center')
    ax5.text(5, 3.0, '• ALWAYS reveal, even if you think you\'ll lose', fontsize=8, ha='center')
    ax5.text(5, 2.7, '• You get your deposit back when you reveal!', 
             fontsize=8, ha='center', color='#2E7D32', weight='bold')
    
    # Next Game
    next_game_box = Rectangle((1.5, 1.3), 7, 0.8, facecolor='#E3F2FD', 
                             edgecolor='#1976D2', linewidth=1)
    ax5.add_patch(next_game_box)
    ax5.text(5, 1.8, '🎮 Next Game starts in: 05:32', fontsize=10, ha='center')
    ax5.text(5, 1.45, 'Don\'t make the same mistake!', fontsize=8, ha='center', color='#D32F2F')
    
    # Buttons
    ax5.text(3.3, 0.5, '📊 History', fontsize=9, ha='center',
             bbox=dict(boxstyle='round', facecolor='white', edgecolor='#757575'))
    ax5.text(6.7, 0.5, '🔄 Play Again', fontsize=9, ha='center',
             bbox=dict(boxstyle='round', facecolor='#FF9800', edgecolor='#E65100'))
    
    # ===== Screen 6: Game History =====
    ax6 = plt.subplot(3, 2, 6)
    ax6.set_xlim(0, 10)
    ax6.set_ylim(0, 16)
    ax6.axis('off')
    
    # Header
    header = Rectangle((0, 15), 10, 1, facecolor='#1976D2', edgecolor='black', linewidth=2)
    ax6.add_patch(header)
    ax6.text(0.5, 15.5, '←', fontsize=24, color='white', va='center')
    ax6.text(5, 15.5, 'Game History', fontsize=14, weight='bold', 
             color='white', ha='center', va='center')
    ax6.text(9.5, 15.5, '👤', fontsize=20, color='white', va='center', ha='right')
    
    # Stats Summary
    stats_summary = Rectangle((0.5, 13), 9, 1.5, facecolor='#E8F5E9', 
                             edgecolor='#4CAF50', linewidth=2)
    ax6.add_patch(stats_summary)
    ax6.text(5, 14.2, '📊 Your Statistics', fontsize=13, weight='bold', ha='center')
    ax6.text(2, 13.7, '🎮 Games Played: 27', fontsize=9, ha='left')
    ax6.text(2, 13.35, '✅ Wins: 12 (44%)', fontsize=9, ha='left', color='#2E7D32')
    ax6.text(6, 13.7, '💰 Total Earned: 23.4 BNB', fontsize=9, ha='left', color='#1B5E20')
    ax6.text(6, 13.35, '📈 Best Win: 8.2 BNB', fontsize=9, ha='left')
    
    # Recent Games Title
    ax6.text(5, 12.5, 'Recent Games:', fontsize=12, weight='bold', ha='center')
    
    # Game History Items
    games = [
        {'id': 42, 'result': 'WIN', 'amount': '+5.95', 'color': '#C8E6C9', 'border': '#4CAF50'},
        {'id': 41, 'result': 'LOST', 'amount': '-1.0', 'color': '#FFCDD2', 'border': '#F44336'},
        {'id': 40, 'result': 'WIN', 'amount': '+3.2', 'color': '#C8E6C9', 'border': '#4CAF50'},
        {'id': 39, 'result': 'DEPOSIT LOST', 'amount': '-0.8', 'color': '#FFEBEE', 'border': '#D32F2F'},
        {'id': 38, 'result': 'WIN', 'amount': '+7.1', 'color': '#C8E6C9', 'border': '#4CAF50'},
    ]
    
    y_pos = 11.5
    for game in games:
        game_box = Rectangle((0.8, y_pos-0.5), 8.4, 1.2, 
                            facecolor=game['color'], 
                            edgecolor=game['border'], 
                            linewidth=2)
        ax6.add_patch(game_box)
        
        # Game ID
        ax6.text(1.2, y_pos, f"Game #{game['id']}", fontsize=10, 
                weight='bold', va='center')
        
        # Result
        result_color = '#2E7D32' if 'WIN' in game['result'] else '#D32F2F'
        ax6.text(4, y_pos, game['result'], fontsize=10, 
                weight='bold', ha='center', color=result_color, va='center')
        
        # Amount
        ax6.text(8.7, y_pos, f"{game['amount']} BNB", fontsize=11, 
                weight='bold', ha='right', color=result_color, va='center')
        
        # View details button
        ax6.text(1.2, y_pos-0.3, '📋 Details', fontsize=7, va='center',
                bbox=dict(boxstyle='round,pad=0.3', facecolor='white', 
                         edgecolor='gray', linewidth=0.5))
        
        y_pos -= 1.5
    
    # Load More Button
    load_more = FancyBboxPatch((2.5, 3.5), 5, 0.7, boxstyle="round,pad=0.1",
                               facecolor='#E0E0E0', edgecolor='#757575', linewidth=1)
    ax6.add_patch(load_more)
    ax6.text(5, 3.85, 'Load More Games...', fontsize=10, ha='center')
    
    # Charts/Analytics Teaser
    analytics_box = Rectangle((0.8, 1.5), 8.4, 1.5, facecolor='#E3F2FD', 
                             edgecolor='#1976D2', linewidth=2)
    ax6.add_patch(analytics_box)
    ax6.text(5, 2.6, '📈 Performance Analytics', fontsize=11, weight='bold', ha='center')
    ax6.text(5, 2.2, 'Win Rate Trend:', fontsize=9, ha='center')
    
    # Simple trend line
    trend_x = [2, 3, 4, 5, 6, 7, 8]
    trend_y = [1.8, 1.85, 1.82, 1.9, 1.88, 1.92, 1.95]
    ax6.plot(trend_x, trend_y, 'b-', linewidth=2)
    ax6.fill_between(trend_x, 1.6, trend_y, alpha=0.3, color='#2196F3')
    
    # Bottom Navigation
    nav_buttons = [
        ('🏠', 'Home'),
        ('🎮', 'Play'),
        ('📊', 'History'),
        ('⚙️', 'Settings')
    ]
    
    button_x = 1.5
    for icon, label in nav_buttons:
        btn_color = '#1976D2' if label == 'History' else '#E0E0E0'
        text_color = 'white' if label == 'History' else '#757575'
        
        btn = Rectangle((button_x, 0.3), 1.5, 0.6, facecolor=btn_color, 
                       edgecolor='#757575', linewidth=1)
        ax6.add_patch(btn)
        ax6.text(button_x+0.75, 0.7, icon, fontsize=14, ha='center', va='center')
        ax6.text(button_x+0.75, 0.4, label, fontsize=7, ha='center', 
                va='center', color=text_color)
        button_x += 2
    
    plt.tight_layout()
    plt.savefig('wireframes.png', dpi=300, bbox_inches='tight', facecolor='white')
    print("✓ Wireframes saved as 'wireframes.png'")
    plt.close()


if __name__ == "__main__":
    draw_use_case_diagram()
    draw_wireframes()