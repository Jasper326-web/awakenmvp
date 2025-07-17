# AI助教使用统计功能

## 功能概述

AI助教使用统计功能提供了准确的每日、每周、每月使用情况，包括剩余次数计算和用户类型判断。

## 数据库存储过程

### get_user_ai_usage_stats(user_uuid UUID)

返回用户的完整AI使用统计信息：

```json
{
  "today_usage": 3,           // 今日使用次数
  "total_usage": 25,          // 总使用次数
  "weekly_usage": 8,          // 本周使用次数（周一到今天）
  "monthly_usage": 15,        // 本月使用次数（本月1号到今天）
  "user_type": "free",        // 用户类型：free/premium/pro
  "max_daily_usage": 5,       // 每日最大使用次数
  "remaining_today": 2,       // 今日剩余次数
  "week_start": "2025-07-01", // 本周开始日期
  "month_start": "2025-07-01", // 本月开始日期
  "can_send_today": true      // 今日是否可以发送消息
}
```

## 时间范围计算

### 本周统计
- 从周一开始计算到当前日期
- 使用 `EXTRACT(DOW FROM CURRENT_DATE)` 计算本周开始日期

### 本月统计  
- 从本月1号开始计算到当前日期
- 使用 `DATE_TRUNC('month', CURRENT_DATE)` 计算本月开始日期

## 用户类型判断

### 免费用户
- 每日限制：5条消息
- 剩余次数：`max_daily_usage - today_usage`
- 可发送：`remaining_today > 0`

### 会员用户
- 每日限制：999999条消息（无限制）
- 剩余次数：999999
- 可发送：始终为true

## 前端集成

### API端点
- `/api/ai-usage` - 获取用户使用统计
- `/api/test-ai-usage` - 测试API（包含调试信息）

### 组件更新
- `ChatWidget.tsx` - 使用新的剩余次数显示
- `profile-new.tsx` - 显示详细的使用统计

### 显示内容
1. **今日使用** - 显示今日使用次数和剩余次数
2. **本周使用** - 显示本周累计使用次数和时间范围
3. **本月使用** - 显示本月累计使用次数和时间范围  
4. **总使用次数** - 显示累计使用次数
5. **使用限制** - 显示用户类型和限制说明

## 测试方法

### 1. 访问测试API
```
GET /api/test-ai-usage
```

### 2. 检查返回数据
```json
{
  "usage": {
    "today_usage": 3,
    "remaining_today": 2,
    "can_send_today": true,
    // ... 其他字段
  },
  "debug": {
    "user_id": "xxx",
    "chat_logs": [...],
    "current_date": "2025-07-05T..."
  }
}
```

### 3. 验证统计准确性
- 检查 `today_usage` 是否与 `chat_logs` 表中今日记录数一致
- 检查 `remaining_today` 计算是否正确
- 检查 `can_send_today` 逻辑是否正确

## 常见问题

### Q: 统计显示为0或"-"
**A:** 可能原因：
1. chat_logs表无数据
2. usage_date字段未正确写入
3. RLS策略限制访问
4. API层user_id获取失败

### Q: 剩余次数计算错误
**A:** 检查：
1. 用户类型判断是否正确
2. max_daily_usage设置是否正确
3. today_usage统计是否准确

### Q: 时间范围不准确
**A:** 验证：
1. 周统计是否从周一开始
2. 月统计是否从1号开始
3. 时区设置是否正确

## 部署步骤

1. 执行SQL脚本更新存储过程：
```sql
-- 在Supabase SQL编辑器中执行
\i scripts/create-ai-usage-tracking.sql
```

2. 重启应用服务器

3. 测试API功能：
```bash
curl -H "Authorization: Bearer YOUR_TOKEN" \
     http://localhost:3000/api/test-ai-usage
```

4. 验证前端显示是否正确

## 更新日志

- 2025-07-05: 添加准确的每日、每周、每月使用统计
- 2025-07-05: 添加剩余次数计算和用户类型判断
- 2025-07-05: 优化时间范围计算逻辑
- 2025-07-05: 更新前端显示组件
- 2025-07-05: 修复字段名错误（plan → subscription_type）

## 已知问题修复

### 字段名错误修复
**问题：** `user_subscriptions` 表中字段名为 `subscription_type`，但存储过程中使用了 `plan`
**修复：** 更新 `get_user_ai_usage_stats` 函数，使用正确的字段名 `subscription_type`

**修复脚本：**
```sql
-- 执行修复脚本
\i scripts/fix-ai-usage-stats.sql
```

**验证脚本：**
```sql
-- 验证修复结果
\i scripts/test-fixed-ai-usage.sql
``` 