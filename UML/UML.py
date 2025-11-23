import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import Ellipse, Circle, FancyBboxPatch
import numpy as np

def draw_use_case_diagram():
    # 创建图形和轴
    fig, ax = plt.subplots(1, 1, figsize=(16, 12))
    ax.set_xlim(0, 16)
    ax.set_ylim(0, 12)
    ax.set_aspect('equal')
    ax.axis('off')  # 隐藏坐标轴
    
    # 设置颜色
    actor_color = '#4CAF50'  # 绿色
    use_case_color = '#2196F3'  # 蓝色
    system_color = '#FF9800'  # 橙色
    line_color = '#757575'  # 灰色
    
    # 绘制系统边界
    system_boundary = patches.Rectangle((2, 1), 12, 10, linewidth=2, 
                                       edgecolor=system_color, facecolor='none', 
                                       linestyle='--')
    ax.add_patch(system_boundary)
    ax.text(8, 11.2, 'Minority Wins Game System', ha='center', va='center', 
            fontsize=14, fontweight='bold', color=system_color)
    
    # 定义参与者和用例的位置
    actors = {
        'Player': (1, 8),
        'Contract Owner': (1, 4)
    }
    
    use_cases = {
        'Connect Wallet': (5, 9),
        'Start Game': (5, 7.5),
        'Commit Bet': (5, 6),
        'Reveal Choice': (5, 4.5),
        'Finalize Game': (5, 3),
        'Claim Reward': (5, 1.5),
        'Get Game Info': (8, 9),
        'Calculate Reward': (8, 7.5),
        'Check Participants': (8, 6)
    }
    
    # 绘制参与者（小人图标）
    for actor, pos in actors.items():
        # 绘制小人
        head = Circle(pos, 0.3, facecolor=actor_color, edgecolor='black')
        body = plt.Line2D([pos[0], pos[0]], [pos[1]-0.3, pos[1]-0.8], color='black', linewidth=2)
        left_arm = plt.Line2D([pos[0], pos[0]-0.3], [pos[1]-0.4, pos[1]-0.6], color='black', linewidth=2)
        right_arm = plt.Line2D([pos[0], pos[0]+0.3], [pos[1]-0.4, pos[1]-0.6], color='black', linewidth=2)
        left_leg = plt.Line2D([pos[0], pos[0]-0.2], [pos[1]-0.8, pos[1]-1.2], color='black', linewidth=2)
        right_leg = plt.Line2D([pos[0], pos[0]+0.2], [pos[1]-0.8, pos[1]-1.2], color='black', linewidth=2)
        
        ax.add_patch(head)
        ax.add_line(body)
        ax.add_line(left_arm)
        ax.add_line(right_arm)
        ax.add_line(left_leg)
        ax.add_line(right_leg)
        
        # 添加参与者标签
        ax.text(pos[0], pos[1]-1.5, actor, ha='center', va='center', 
                fontsize=10, fontweight='bold', color=actor_color)
    
    # 绘制用例（椭圆）
    for use_case, pos in use_cases.items():
        ellipse = Ellipse(pos, 3, 0.8, facecolor=use_case_color, 
                         edgecolor='black', alpha=0.7)
        ax.add_patch(ellipse)
        ax.text(pos[0], pos[1], use_case, ha='center', va='center', 
                fontsize=9, fontweight='bold', color='white')
    
    # 定义关系
    relationships = [
        # (from_actor, to_use_case)
        ('Player', 'Connect Wallet'),
        ('Player', 'Commit Bet'),
        ('Player', 'Reveal Choice'),
        ('Player', 'Claim Reward'),
        ('Player', 'Get Game Info'),
        ('Player', 'Calculate Reward'),
        ('Player', 'Check Participants'),
        ('Contract Owner', 'Start Game'),
        ('Contract Owner', 'Finalize Game'),
        ('Contract Owner', 'Get Game Info'),
    ]
    
    # 绘制关系线
    for from_actor, to_use_case in relationships:
        from_pos = actors[from_actor]
        to_pos = use_cases[to_use_case]
        
        # 调整线条起点和终点，避免与图形重叠
        start_x = from_pos[0] + 0.5
        start_y = from_pos[1]
        end_x = to_pos[0] - 1.5
        end_y = to_pos[1]
        
        # 绘制直线
        line = plt.Line2D([start_x, end_x], [start_y, end_y], 
                         color=line_color, linewidth=1.5)
        ax.add_line(line)
        
        # 添加箭头
        ax.annotate('', xy=(end_x, end_y), xytext=(end_x-0.2, end_y),
                   arrowprops=dict(arrowstyle='->', color=line_color, lw=1.5))
    
    # 添加用例之间的扩展关系
    extend_relationships = [
        ('Commit Bet', 'Reveal Choice'),
        ('Reveal Choice', 'Finalize Game'),
        ('Finalize Game', 'Claim Reward'),
    ]
    
    for from_uc, to_uc in extend_relationships:
        from_pos = use_cases[from_uc]
        to_pos = use_cases[to_uc]
        
        # 绘制虚线表示扩展关系
        line = plt.Line2D([from_pos[0], to_pos[0]], [from_pos[1], to_pos[1]], 
                         color=line_color, linewidth=1.5, linestyle='--')
        ax.add_line(line)
        
        # 添加箭头
        ax.annotate('', xy=(to_pos[0], to_pos[1]), 
                   xytext=(to_pos[0] - 0.2*(to_pos[0]-from_pos[0]), 
                          to_pos[1] - 0.2*(to_pos[1]-from_pos[1])),
                   arrowprops=dict(arrowstyle='->', color=line_color, lw=1.5))
    
    # 添加图例
    legend_elements = [
        plt.Line2D([0], [0], color=actor_color, lw=4, label='Actors'),
        plt.Line2D([0], [0], color=use_case_color, lw=4, label='Use Cases'),
        plt.Line2D([0], [0], color=system_color, lw=2, linestyle='--', label='System Boundary'),
        plt.Line2D([0], [0], color=line_color, lw=2, label='Relationships'),
        plt.Line2D([0], [0], color=line_color, lw=2, linestyle='--', label='Extend Relationships')
    ]
    
    ax.legend(handles=legend_elements, loc='upper right', bbox_to_anchor=(0.98, 0.98))
    
    # 添加标题
    plt.title('Minority Wins Game - Use Case Diagram', fontsize=16, fontweight='bold', pad=20)
    
    # 调整布局并显示
    plt.tight_layout()
    return fig, ax

# 绘制用例图
fig, ax = draw_use_case_diagram()

# 保存图片
plt.savefig('minority_game_use_case_diagram.png', dpi=300, bbox_inches='tight')

# 显示图片
plt.show()