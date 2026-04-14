# ⚡ 立即执行 - 2分钟完成

## 🎯 当前状态

✅ 所有代码已完成  
⚠️ 需要执行数据库迁移

## 📋 执行步骤

### 步骤1: 打开数据库工具

选择以下任一工具：
- pgAdmin
- DBeaver
- TablePlus
- psql命令行

### 步骤2: 连接数据库

```
数据库: scoring
用户: postgres
密码: etkw1234
主机: localhost
端口: 5432
```

### 步骤3: 复制粘贴SQL

```sql
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

### 步骤4: 执行

点击"执行"或"运行"按钮

### 步骤5: 完成！

✅ 数据库迁移完成  
✅ 可以创建双人赛和团体赛  
✅ 评审控制台显示选手数量  
✅ 评分汇总有返回按钮

## 🚀 启动项目

```bash
# 终端1: 后端
cd backend
npm start

# 终端2: 前端
npm run dev
```

访问: http://localhost:3000

## 🧪 测试功能

1. 管理员登录
2. 创建比赛 → 选择"双人"或"团体"
3. 评审登录
4. 查看比赛列表 → 看到选手数量
5. 评分汇总 → 点击返回按钮

## 📁 相关文件

- `COPY_PASTE_THIS.txt` - 只有SQL
- `PROJECT_STATUS_FINAL.md` - 完整状态报告
- `CURRENT_STATUS.md` - 详细说明

## ❓ 常见问题

**Q: 执行SQL会丢失数据吗？**  
A: 不会，只是更新约束和迁移类型名称

**Q: 需要重启服务器吗？**  
A: 不需要，执行后立即生效

**Q: 如果出错怎么办？**  
A: SQL是安全的，可以重复执行

**Q: 必须现在执行吗？**  
A: 是的，否则无法创建双人赛和团体赛

## 🎉 执行后的效果

### 之前
```
比赛类型:
○ 个人
○ 双人/团体  ← 混在一起
○ 挑战
```

### 之后
```
比赛类型:
○ 个人
○ 双人      ← 分开了
○ 团体      ← 分开了
○ 挑战
```

---

**下一步**: 复制SQL → 执行 → 开始使用！
