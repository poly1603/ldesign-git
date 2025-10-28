import { defineConfig } from 'vitepress'

export default defineConfig({
  title: '@ldesign/git',
  description: '功能强大的 Git 操作工具库',
  lang: 'zh-CN',
  
  themeConfig: {
    logo: '/logo.svg',
    
    nav: [
      { text: '指南', link: '/guide/' },
      { text: 'API', link: '/api/' },
      { text: '示例', link: '/examples/' },
      { text: '更新日志', link: '/changelog' },
    ],
    
    sidebar: {
      '/guide/': [
        {
          text: '开始',
          items: [
            { text: '介绍', link: '/guide/' },
            { text: '快速开始', link: '/guide/getting-started' },
            { text: '安装', link: '/guide/installation' },
          ]
        },
        {
          text: '核心功能',
          items: [
            { text: '基础操作', link: '/guide/basic-operations' },
            { text: '分支管理', link: '/guide/branch-management' },
            { text: '标签管理', link: '/guide/tag-management' },
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: '性能监控', link: '/guide/performance-monitor' },
            { text: 'Git LFS', link: '/guide/lfs' },
            { text: 'Monorepo', link: '/guide/monorepo' },
            { text: 'Reflog', link: '/guide/reflog' },
            { text: 'Bisect', link: '/guide/bisect' },
            { text: 'Blame分析', link: '/guide/blame' },
            { text: 'GPG签名', link: '/guide/sign' },
            { text: 'Git Notes', link: '/guide/notes' },
          ]
        },
        {
          text: '自动化',
          items: [
            { text: '智能提交', link: '/guide/smart-commit' },
            { text: '工作流', link: '/guide/workflow' },
            { text: '批量操作', link: '/guide/batch-operations' },
          ]
        },
      ],
      
      '/api/': [
        {
          text: 'API 参考',
          items: [
            { text: '概览', link: '/api/' },
          ]
        },
        {
          text: '核心管理器',
          items: [
            { text: 'GitManager', link: '/api/git-manager' },
            { text: 'BranchManager', link: '/api/branch-manager' },
            { text: 'TagManager', link: '/api/tag-manager' },
            { text: 'StashManager', link: '/api/stash-manager' },
            { text: 'MergeManager', link: '/api/merge-manager' },
          ]
        },
        {
          text: '高级功能',
          items: [
            { text: 'PerformanceMonitor', link: '/api/performance-monitor' },
            { text: 'LFSManager', link: '/api/lfs-manager' },
            { text: 'MonorepoManager', link: '/api/monorepo-manager' },
            { text: 'ReflogManager', link: '/api/reflog-manager' },
            { text: 'BisectManager', link: '/api/bisect-manager' },
            { text: 'BlameAnalyzer', link: '/api/blame-analyzer' },
            { text: 'SignManager', link: '/api/sign-manager' },
            { text: 'NotesManager', link: '/api/notes-manager' },
          ]
        },
        {
          text: '自动化',
          items: [
            { text: 'SmartCommit', link: '/api/smart-commit' },
            { text: 'WorkflowAutomation', link: '/api/workflow-automation' },
            { text: 'BatchOperations', link: '/api/batch-operations' },
          ]
        },
      ],
      
      '/examples/': [
        {
          text: '示例',
          items: [
            { text: '概览', link: '/examples/' },
            { text: '基础示例', link: '/examples/basic' },
            { text: '性能优化', link: '/examples/performance' },
            { text: 'Monorepo发布', link: '/examples/monorepo' },
            { text: '问题定位', link: '/examples/debugging' },
            { text: '代码审查', link: '/examples/code-review' },
          ]
        }
      ],
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/your-org/ldesign-git' }
    ],
    
    footer: {
      message: 'Released under the MIT License.',
      copyright: 'Copyright © 2025 LDesign Team'
    },
    
    search: {
      provider: 'local'
    },
    
    editLink: {
      pattern: 'https://github.com/your-org/ldesign-git/edit/main/docs/:path',
      text: '在 GitHub 上编辑此页'
    },
    
    lastUpdated: {
      text: '最后更新',
      formatOptions: {
        dateStyle: 'short',
        timeStyle: 'short'
      }
    }
  }
})
