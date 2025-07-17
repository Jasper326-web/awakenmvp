# 从 relapsed 字段迁移到 status 字段的完整指南

## 概述

本指南将帮助你安全地将 `daily_checkins` 表从使用 `relapsed` 布尔字段迁移到使用 `status` 字符串字段。这个迁移将提供更清晰的逻辑和更好的扩展性。

## 迁移目标

- 将 `relapsed` 布尔字段替换为 `status` 字符串字段
- `status` 字段支持三个值：`'pending'`、`'success'`、`'failed'`
- 自动计算并存储最大连续天数和总成功天数
- 更新所有相关的函数、触发器和索引
- 保持数据完整性和一致性

## 迁移步骤

### 第一步：备份数据（推荐）

在开始迁移之前，建议备份你的数据库：

```sql
-- 创建备份表
CREATE TABLE daily_checkins_backup AS 
SELECT *, NOW() as backup_created_at 
FROM daily_checkins;

-- 创建备份索引
CREATE INDEX idx_daily_checkins_backup_user_date 
ON daily_checkins_backup(user_id, date);
```

### 第二步：运行迁移脚本

执行主要的迁移脚本：

```sql
-- 运行迁移脚本
\i scripts/migrate-to-status-field.sql
```

这个脚本会：
1. 检查当前表结构
2. 添加 `status` 字段
3. 迁移现有数据（`relapsed = true` → `status = 'failed'`，`relapsed = false` → `status = 'success'`）
4. 创建新的函数和触发器
5. 更新所有用户的统计数据
6. 验证迁移结果

### 第三步：验证迁移

运行验证脚本检查迁移是否成功：

```sql
-- 验证迁移结果
\i scripts/verify-migration.sql
```

验证脚本会检查：
- 表结构是否正确
- 数据是否已正确迁移
- 函数和触发器是否正常工作
- 统计字段是否正确填充

### 第四步：更新前端代码

前端代码已经更新为使用 `status` 字段。主要更改包括：

1. **daily-checkin.tsx**：
   - 查询时使用 `status` 而不是 `relapsed`
   - 保存时使用 `status` 字段
   - 数据转换逻辑已更新

2. **checkin-modal.tsx**：
   - 已经使用 `status` 字段
   - 支持 `'success'` 和 `'failed'` 状态

### 第五步：清理旧字段（可选）

确认迁移成功后，可以安全地移除旧的 `relapsed` 字段：

```sql
-- 清理旧字段（谨慎操作）
\i scripts/cleanup-after-migration.sql
```

## 字段映射

| 旧字段 (relapsed) | 新字段 (status) | 说明 |
|------------------|----------------|------|
| `true` | `'failed'` | 破戒/失败 |
| `false` | `'success'` | 守戒成功 |
| `NULL` | `'pending'` | 待处理 |

## 新增功能

### 1. 自动统计计算

迁移后，系统会自动计算并存储：
- `max_streak`：最大连续成功天数
- `total_days`：总成功天数

### 2. 新的函数

- `calculate_streak(user_id)`：计算用户的连续天数和统计数据
- `update_user_stats(user_id)`：更新用户的统计数据
- `refresh_all_user_stats()`：批量更新所有用户的统计数据
- `get_user_current_streak(user_id)`：获取用户当前连续天数
- `get_leaderboard(limit)`：获取排行榜数据

### 3. 自动触发器

- `update_checkin_stats_trigger`：在插入或更新打卡记录时自动更新统计数据

## 数据验证

迁移完成后，你可以运行以下查询来验证数据：

```sql
-- 检查数据分布
SELECT 
    status,
    COUNT(*) as count,
    ROUND(COUNT(*) * 100.0 / SUM(COUNT(*)) OVER (), 2) as percentage
FROM daily_checkins 
GROUP BY status
ORDER BY status;

-- 检查统计字段
SELECT 
    COUNT(*) as total_records,
    COUNT(CASE WHEN max_streak IS NOT NULL THEN 1 END) as records_with_max_streak,
    COUNT(CASE WHEN total_days IS NOT NULL THEN 1 END) as records_with_total_days
FROM daily_checkins;
```

## 回滚计划

如果迁移出现问题，可以按以下步骤回滚：

1. **恢复数据**：
```sql
-- 从备份恢复数据
DROP TABLE daily_checkins;
CREATE TABLE daily_checkins AS SELECT * FROM daily_checkins_backup;
```

2. **恢复索引和约束**：
```sql
-- 重新创建必要的索引
CREATE INDEX idx_daily_checkins_user_date ON daily_checkins(user_id, date);
CREATE INDEX idx_daily_checkins_user_date_relapsed ON daily_checkins(user_id, date, relapsed);
```

3. **恢复函数和触发器**：
```sql
-- 重新运行原始的函数和触发器脚本
\i scripts/05-create-triggers.sql
```

## 注意事项

1. **备份重要**：在迁移前务必备份数据
2. **测试环境**：建议先在测试环境运行迁移
3. **停机时间**：迁移过程中可能需要短暂的停机时间
4. **数据一致性**：迁移后检查数据一致性
5. **前端兼容**：确保前端代码已更新

## 故障排除

### 常见问题

1. **迁移失败**：
   - 检查数据库连接
   - 确认有足够的权限
   - 查看错误日志

2. **数据不一致**：
   - 运行验证脚本
   - 检查约束和索引
   - 手动修复异常数据

3. **函数错误**：
   - 检查函数参数
   - 确认数据类型匹配
   - 查看函数定义

### 获取帮助

如果遇到问题，可以：
1. 查看数据库日志
2. 运行验证脚本
3. 检查数据一致性
4. 联系技术支持

## 完成确认

迁移完成后，确认以下项目：

- [ ] 数据已正确迁移
- [ ] 函数正常工作
- [ ] 触发器正常触发
- [ ] 前端功能正常
- [ ] 统计数据正确
- [ ] 性能没有明显下降

## 总结

这个迁移将显著改善你的戒色打卡应用的数据结构和功能。新的 `status` 字段提供了更好的语义化，自动统计功能减少了手动计算的需求，整体提升了系统的可维护性和扩展性。

如果在迁移过程中遇到任何问题，请参考故障排除部分或联系技术支持。 