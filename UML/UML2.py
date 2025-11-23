# generate_uml.py
import subprocess
import os

def generate_use_case_diagram():
    # PlantUML 代码
    plantuml_code = """@startuml
left to right direction

skinparam ActorBorderColor black
skinparam UseCaseBorderColor black
skinparam RectangleBorderColor orange
skinparam ArrowColor #757575

actor Player #4CAF50
actor "Contract Owner" as Owner #4CAF50

rectangle "Minority Wins Game System" #FF9800 {
  usecase "Connect Wallet" as UC1 #2196F3
  usecase "Start Game" as UC2 #2196F3
  usecase "Commit Bet" as UC3 #2196F3
  usecase "Reveal Choice" as UC4 #2196F3
  usecase "Finalize Game" as UC5 #2196F3
  usecase "Claim Reward" as UC6 #2196F3
  usecase "Get Game Info" as UC7 #2196F3
  usecase "Calculate Reward" as UC8 #2196F3
  usecase "Check Participants" as UC9 #2196F3
}

Player --> UC1
Player --> UC3
Player --> UC4
Player --> UC6
Player --> UC7
Player --> UC8
Player --> UC9

Owner --> UC2
Owner --> UC5
Owner --> UC7

UC3 ..> UC4 : <<extend>>
UC4 ..> UC5 : <<extend>>
UC5 ..> UC6 : <<extend>>
@enduml
"""
    
    # 写入文件
    with open('use_case_diagram.puml', 'w') as f:
        f.write(plantuml_code)
    
    print("✅ PlantUML 文件已创建: use_case_diagram.puml")
    
    # 尝试使用 plantuml 命令
    try:
        result = subprocess.run(['plantuml', 'use_case_diagram.puml'], 
                              capture_output=True, text=True)
        if result.returncode == 0:
            print("✅ 用例图已生成: use_case_diagram.png")
        else:
            print("❌ PlantUML 命令执行失败")
            print("错误信息:", result.stderr)
            suggest_alternative_methods()
    except FileNotFoundError:
        print("❌ 未找到 plantuml 命令")
        suggest_alternative_methods()

def suggest_alternative_methods():
    print("\n🔧 替代方案:")
    print("1. 使用在线 PlantUML 工具: http://www.plantuml.com/plantuml/")
    print("2. 安装 Graphviz: brew install graphviz (Mac) 或 apt-get install graphviz (Linux)")
    print("3. 使用 Docker: docker run -v $(pwd):/data plantuml/plantuml use_case_diagram.puml")
    print("4. 使用我之前提供的 matplotlib 代码生成图片")

def generate_enhanced_use_case_diagram():
    """生成包含改进功能的增强版用例图"""
    plantuml_code = """@startuml
left to right direction

title Minority Wins Game - Enhanced Use Case Diagram

skinparam ActorBorderColor black
skinparam UseCaseBorderColor black
skinparam RectangleBorderColor orange
skinparam ArrowColor #757575

actor Player #4CAF50
actor "Contract Owner" as Owner #4CAF50
actor "Oracle Service" as Oracle #9C27B0

rectangle "Minority Wins Game System" #FF9800 {
  ' Core Game Functions
  usecase "Connect Wallet" as UC1 #2196F3
  usecase "Start Game" as UC2 #2196F3
  usecase "Commit Bet" as UC3 #2196F3
  usecase "Reveal Choice" as UC4 #2196F3
  usecase "Finalize Game" as UC5 #2196F3
  usecase "Claim Reward" as UC6 #2196F3
  
  ' Enhanced Features
  usecase "View Game History" as UC7 #FF5722
  usecase "Use Reward Calculator" as UC8 #FF5722
  usecase "Multi-Option Betting" as UC9 #FF5722
  usecase "NFT Reward System" as UC10 #FF5722
  usecase "Tiered Game Rooms" as UC11 #FF5722
  
  ' Admin Functions
  usecase "Manage Deposit Distribution" as UC12 #795548
  usecase "Configure Game Parameters" as UC13 #795548
}

' Player interactions
Player --> UC1
Player --> UC3
Player --> UC4
Player --> UC6
Player --> UC7
Player --> UC8
Player --> UC9
Player --> UC10

' Owner interactions
Owner --> UC2
Owner --> UC5
Owner --> UC12
Owner --> UC13

' Oracle integration
Oracle --> UC5 : provides random data

' Extension relationships
UC3 ..> UC4 : <<extend>>
UC4 ..> UC5 : <<extend>>
UC5 ..> UC6 : <<extend>>
UC9 ..|> UC3 : <<include>>
UC11 ..|> UC2 : <<include>>

legend
  | Color Legend |
  Blue = Core Functions |
  Orange = Enhanced Features |
  Brown = Admin Functions |
  Purple = External Services
endlegend
@enduml
"""
    
    with open('enhanced_use_case_diagram.puml', 'w') as f:
        f.write(plantuml_code)
    
    print("✅ 增强版用例图文件已创建: enhanced_use_case_diagram.puml")

if __name__ == "__main__":
    generate_use_case_diagram()
    generate_enhanced_use_case_diagram()
    
    print("\n📋 下一步:")
    print("如果 plantuml 命令不可用，请复制 .puml 文件内容到: http://www.plantuml.com/plantuml/")