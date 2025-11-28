# @ldesign/git 系统架构图

## 整体架构

```mermaid
graph TB
    subgraph 用户层
        A[CLI 命令行工具]
        B[Web UI 浏览器界面]
    end
    
    subgraph API服务层
        C[Express Server]
        D[WebSocket Server]
        E[RESTful API]
    end
    
    subgraph 业务逻辑层
        F[Git Service]
        G[File Service]
        H[核心管理器集合]
    end
    
    subgraph 核心管理器
        I[BranchManager]
        J[TagManager]
        K[CommitAnalyzer]
        L[MergeManager]
        M[StashManager]
        N[RemoteManager]
        O[DiffManager]
        P[ConfigManager]
        Q[WorktreeManager]
        R[LFSManager]
        S[MonorepoManager]
    end
    
    subgraph Git底层
        T[simple-git]
        U[Git 命令行]
    end
    
    A --> H
    B --> C
    B --> D
    C --> E
    E --> F
    E --> G
    D --> F
    F --> H
    G --> H
    H --> I
    H --> J
    H --> K
    H --> L
    H --> M
    H --> N
    H --> O
    H --> P
    H --> Q
    H --> R
    H --> S
    I --> T
    J --> T
    K --> T
    L --> T
    M --> T
    N --> T
    O --> T
    P --> T
    Q --> T
    R --> T
    S --> T
    T --> U
```

## Web UI 页面流程

```mermaid
graph LR
    A[仓库状态页] --> B[分支管理]
    A --> C[提交历史]
    A --> D[文件变更]
    
    B --> B1[创建分支]
    B --> B2[删除分支]
    B --> B3[切换分支]
    B --> B4[合并分支]
    
    C --> C1[查看详情]
    C --> C2[比较提交]
    C --> C3[Cherry-pick]
    
    D --> D1[暂存文件]
    D --> D2[查看Diff]
    D --> D3[提交变更]
    
    A --> E[同步操作]
    E --> E1[推送Push]
    E --> E2[拉取Pull]
    E --> E3[获取Fetch]
    
    A --> F[其他功能]
    F --> F1[Tag管理]
    F --> F2[Stash管理]
    F --> F3[Remote管理]
    F --> F4[冲突解决]
```

## API 请求流程

```mermaid
sequenceDiagram
    participant UI as Web UI
    participant API as API Server
    participant Service as Git Service
    participant Manager as Core Manager
    participant Git as simple-git
    
    UI->>API: HTTP Request
    API->>Service: 调用服务方法
    Service->>Manager: 调用管理器
    Manager->>Git: 执行 Git 操作
    Git-->>Manager: 返回结果
    Manager-->>Service: 处理数据
    Service-->>API: 返回响应
    API-->>UI: JSON Response
    
    Note over API,UI: WebSocket 实时推送
    Git->>Manager: 状态变更
    Manager->>Service: 通知事件
    Service->>API: 触发事件
    API->>UI: WebSocket Push
```

## 数据流向

```mermaid
graph LR
    A[用户操作] --> B{操作类型}
    B -->|CLI| C[CLI Commands]
    B -->|Web UI| D[Web UI]
    
    C --> E[Core Managers]
    D --> F[HTTP/WebSocket]
    F --> G[API Routes]
    G --> H[Services]
    H --> E
    
    E --> I[simple-git]
    I --> J[Git Operations]
    J --> K[本地仓库]
    
    K -->|状态变更| L[Event Emitter]
    L -->|实时推送| M[WebSocket]
    M --> D
```

## 组件关系图

```mermaid
graph TB
    subgraph Web UI Components
        Layout[MainLayout]
        Layout --> Sidebar[Sidebar]
        Layout --> Content[Content Area]
        
        Content --> Status[Status Page]
        Content --> Branch[Branch Page]
        Content --> Commit[Commit Page]
        Content --> Files[Files Page]
        Content --> Sync[Sync Page]
        
        Status --> StatusCard[Status Card]
        Status --> QuickAction[Quick Actions]
        
        Branch --> BranchList[Branch List]
        Branch --> BranchOps[Branch Operations]
        
        Commit --> CommitList[Commit List]
        Commit --> CommitDetail[Commit Detail]
        
        Files --> FileTree[File Tree]
        Files --> DiffViewer[Diff Viewer]
    end
    
    subgraph State Management
        Store[Zustand Store]
        Store --> RepoState[Repo State]
        Store --> BranchState[Branch State]
        Store --> FileState[File State]
    end
    
    subgraph Services
        API[API Service]
        WS[WebSocket Service]
    end
    
    Layout --> Store
    Status --> Store
    Branch --> Store
    Commit --> Store
    Files --> Store
    
    Store --> API
    Store --> WS