# HeartBridge 测试框架

本目录包含 HeartBridge 项目的所有测试文件。

## 测试结构

```
tests/
├── unit/              # 单元测试
├── integration/       # 集成测试
├── e2e/              # 端到端测试
└── fixtures/         # 测试数据
```

## 运行测试

### 单元测试
```bash
npm run test:unit
```

### 集成测试
```bash
npm run test:integration
```

### 端到端测试
```bash
npm run test:e2e
```

### 所有测试
```bash
npm test
```

## 测试覆盖率

查看测试覆盖率报告：
```bash
npm run test:coverage
```

## 编写测试

1. 单元测试：测试单个函数或组件
2. 集成测试：测试多个模块之间的交互
3. 端到端测试：测试完整的用户流程
