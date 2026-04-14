# ⚠️ 重要：立即执行

## 🎯 当前状态

所有代码更改已完成！但需要执行**一个简单的数据库更新**才能正常使用。

## 🔴 必须执行（2分钟）

### 数据库迁移

打开 `COPY_PASTE_THIS.txt` 文件，复制里面的3行SQL，在数据库工具中执行。

或者直接复制这里的：

```sql
ALTER TABLE competitions DROP CONSTRAINT IF EXISTS competitions_competition_type_check;

ALTER TABLE competitions ADD CONSTRAINT competitions_competition_type_check CHECK (competition_type IN ('individual', 'duo', 'team', 'challenge'));

UPDATE competitions SET competition_type = 'duo' WHERE competition_type = 'duo_team';
```

**执行方式**：
1. 打开pgAdmin/DBeaver/TablePlus等数据库工具
2. 连接到数据库 `scoring`
3. 粘贴上面3行SQL
4. 执行

**完成！** 🎉

## ✅ 完成后可以做什么

1. **创建双人舞台赛**（duo）- 明确区分
2. **创建团体赛**（team）- 不再混淆
3. **查看选手数量** - 评审控制台显示
4. **正常评分** - 两种类型使用相同标准

## 📚 相关文档

- `CURRENT_STATUS.md` - 完整项目状态
- `QUICK_FIX_GUIDE.md` - 2分钟快速指南
- `HOW_TO_FIX_DATABASE.md` - 详细步骤
- `DOCKER_ISSUE.md` - Docker相关说明

## 🚀 启动项目

```bash
# 后端
cd backend
npm start

# 前端（新终端）
npm run dev
```

## 💡 关于Docker

Docker构建失败是因为：
1. Docker Desktop未运行
2. 可能有TypeScript错误

**建议**：开发环境不需要Docker，直接使用 `npm run dev` 即可。

详见：`DOCKER_ISSUE.md`

## 📊 数据库信息

- 数据库：`scoring`
- 用户：`postgres`
- 密码：`etkw1234`

## ❓ 需要帮助？

所有SQL命令和详细步骤都在这些文件中：
- `COPY_PASTE_THIS.txt` ⭐
- `QUICK_FIX_GUIDE.md` ⭐
- `HOW_TO_FIX_DATABASE.md`

---

**下一步**：执行3条SQL → 刷新页面 → 开始使用！

