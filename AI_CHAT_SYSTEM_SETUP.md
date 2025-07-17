# AI聊天系统部署指南

## 概述
本指南将帮助你在Supabase数据库中设置AI聊天系统，包括聊天日志记录、用户偏好存储和使用次数限制功能。

## 步骤

### 1. 执行初始化脚本
首先执行完整的初始化脚本，这将创建所有必要的表和功能：

```sql
-- 在Supabase SQL Editor中执行
-- 文件: scripts/init-ai-chat-system.sql
```

这个脚本会创建：
- `chat_logs` 表（聊天日志）
- `user_preferences` 表（用户偏好）
- 所有必要的索引和触发器
- 使用次数跟踪函数
- RLS安全策略

### 2. 验证安装
执行测试脚本来验证所有组件是否正确安装：

```sql
-- 在Supabase SQL Editor中执行
-- 文件: scripts/test-ai-chat-system.sql
```

### 3. 如果chat_logs表已存在
如果chat_logs表已经存在，只需要添加使用次数跟踪功能：

```sql
-- 在Supabase SQL Editor中执行
-- 文件: scripts/create-ai-usage-tracking.sql
```

## 功能说明

### 表结构

#### chat_logs 表
- `id`: 主键
- `user_id`: 用户ID（关联auth.users）
- `message`: 用户消息
- `response`: AI回复
- `user_type`: 用户类型（free/premium）
- `conversation_id`: 对话ID
- `usage_date`: 使用日期（用于统计）
- `created_at`: 创建时间
- `updated_at`: 更新时间

#### user_preferences 表
- `id`: 主键
- `user_id`: 用户ID
- `preferred_activities`: 用户喜欢的活动
- `main_concerns`: 用户主要关注的问题
- `goals`: 用户的目标
- `personality_type`: 性格类型
- `communication_style`: 沟通风格偏好

### 核心函数

#### get_user_daily_ai_usage(user_uuid)
获取用户今日已使用的AI消息次数

#### can_user_send_ai_message(user_uuid, user_type)
检查用户是否可以发送AI消息，返回：
- `can_send`: 是否可以发送
- `current_usage`: 当前使用次数
- `max_usage`: 最大使用次数
- `remaining_count`: 剩余次数
- `user_type`: 用户类型

#### get_user_ai_usage_stats(user_uuid)
获取用户AI使用统计信息，返回：
- `today_usage`: 今日使用次数
- `total_usage`: 总使用次数
- `weekly_usage`: 本周使用次数
- `monthly_usage`: 本月使用次数
- `user_type`: 用户类型
- `max_daily_usage`: 每日最大使用次数

#### get_user_memory(user_uuid)
获取用户记忆信息，包括：
- 用户档案信息
- 最近的对话历史
- 用户偏好设置

## 使用限制

### 免费用户
- 每日最多5条AI消息
- 基础功能访问

### 付费用户（pro/premium）
- 无限制AI消息
- 所有功能访问

## API端点

### POST /api/chat
发送消息给AI助教
- 自动检查使用限制
- 记录聊天日志
- 返回AI回复和使用统计

### GET /api/ai-usage
获取用户使用统计信息
- 返回详细的使用数据
- 包含剩余次数信息

## 安全特性

- Row Level Security (RLS) 启用
- 用户只能访问自己的数据
- 自动权限检查
- 安全的函数调用

## 故障排除

### 常见问题

1. **函数调用失败**
   - 检查用户ID是否有效
   - 确认RLS策略正确设置

2. **使用次数不准确**
   - 检查usage_date字段是否正确设置
   - 验证触发器是否正常工作

3. **权限错误**
   - 确认用户已登录
   - 检查RLS策略配置

### 调试命令

```sql
-- 检查用户今日使用次数
SELECT get_user_daily_ai_usage('your-user-id');

-- 检查用户是否可以发送消息
SELECT can_user_send_ai_message('your-user-id', 'free');

-- 获取用户统计信息
SELECT get_user_ai_usage_stats('your-user-id');
```

## 维护

### 定期清理
建议定期清理旧的聊天记录以节省存储空间：

```sql
-- 删除30天前的聊天记录
DELETE FROM chat_logs 
WHERE created_at < NOW() - INTERVAL '30 days';
```

### 性能优化
- 定期更新表统计信息
- 监控索引使用情况
- 根据需要调整RLS策略

## 联系支持
如果在部署过程中遇到问题，请检查：
1. Supabase项目设置
2. 数据库权限配置
3. API密钥设置
4. 环境变量配置 