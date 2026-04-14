# 比赛类型拆分方案：区分双人赛和团体赛

## 📋 需求

将当前的 `duo_team`（双人/团队）拆分为两个独立的比赛类型：
- `duo` - 双人舞台赛
- `team` - 团体赛

**重要**：两种类型使用**相同的评分标准**（5个维度）

## 🎯 实现方案

### 方案A：完全拆分（推荐）

**优点**：
- 类型明确，不会混淆
- 便于未来扩展（如果评分标准需要区分）
- 数据统计更清晰

**缺点**：
- 需要数据迁移
- 改动较大

### 方案B：保留duo_team，仅UI显示区分

**优点**：
- 改动最小
- 无需数据迁移
- 向后兼容

**缺点**：
- 数据库中仍是duo_team，不够清晰
- 未来如果评分标准需要区分会很麻烦

## ✅ 推荐：方案A（完全拆分）

## 📝 实施步骤

### 1. 数据库迁移

#### 1.1 检查现有数据
```sql
SELECT competition_type, COUNT(*) 
FROM competitions 
WHERE competition_type = 'duo_team'
GROUP BY competition_type;
```

#### 1.2 创建迁移脚本
```sql
-- 方案1: 全部迁移为duo（如果都是双人赛）
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';

-- 方案2: 根据选手数量判断
-- 2人 -> duo, 3人以上 -> team
UPDATE competitions c
SET competition_type = CASE 
  WHEN (SELECT COUNT(*) FROM competition_athletes WHERE competition_id = c.id) <= 2 
  THEN 'duo'
  ELSE 'team'
END
WHERE competition_type = 'duo_team';

-- 方案3: 手动指定（最准确）
-- 需要管理员逐个确认
```

### 2. 更新TypeScript类型定义

**文件**: `interface/competition.ts`
```typescript
export type CompetitionType = 'individual' | 'duo' | 'team' | 'challenge';
```

**文件**: `interface/score.ts`
```typescript
// Duo Competition: 5 dimensions
export interface DuoScores {
  action_difficulty: number;
  stage_artistry: number;
  action_interaction: number;
  action_creativity: number;
  costume_styling: number;
}

// Team Competition: 5 dimensions (same as Duo)
export interface TeamScores {
  action_difficulty: number;
  stage_artistry: number;
  action_interaction: number;
  action_creativity: number;
  costume_styling: number;
}

export type ScoreDimensions = IndividualScores | DuoScores | TeamScores | ChallengeScores;

export type ScoreDimensionsByType<T extends CompetitionType> = 
  T extends 'individual' ? IndividualScores :
  T extends 'duo' ? DuoScores :
  T extends 'team' ? TeamScores :
  T extends 'challenge' ? ChallengeScores :
  never;
```

### 3. 更新后端验证

**文件**: `backend/controllers/competitions.controller.js`
```javascript
const validTypes = ['individual', 'duo', 'team', 'challenge'];
```

### 4. 更新前端组件

需要更新的文件：
- `components/admin/competition-form.tsx`
- `components/admin/competition-list.tsx`
- `components/admin/competition-edit-client.tsx`
- `components/judge/competition-selector.tsx`
- `components/judge/score-input-form.tsx`
- `components/judge/score-summary-client.tsx`
- `components/display/scoreboard-grid.tsx`
- `components/display/ranking-table.tsx`
- `components/display/realtime-score-display.tsx`

### 5. 更新国际化翻译

**文件**: `i18n/locales/zh.json`
```json
{
  "competition": {
    "individual": "个人",
    "duo": "双人",
    "team": "团体",
    "challenge": "挑战",
    "individualType": "个人赛 (Individual)",
    "duoType": "双人舞台赛 (Duo)",
    "teamType": "团体赛 (Team)",
    "challengeType": "挑战赛 (Challenge)"
  }
}
```

**文件**: `i18n/locales/en.json`
```json
{
  "competition": {
    "individual": "Individual",
    "duo": "Duo",
    "team": "Team",
    "challenge": "Challenge",
    "individualType": "Individual Competition",
    "duoType": "Duo Competition",
    "teamType": "Team Competition",
    "challengeType": "Challenge Competition"
  }
}
```

### 6. 更新评分逻辑

**文件**: `components/judge/score-input-form.tsx`

```typescript
// Duo和Team使用相同的评分标准
const getDimensionWeight = (field: string): number => {
  if (competition.competition_type === 'individual') {
    // ... individual logic
  } else if (competition.competition_type === 'duo' || competition.competition_type === 'team') {
    // 双人和团体使用相同的评分标准
    switch (field) {
      case 'action_difficulty': return 35;
      case 'stage_artistry': return 25;
      case 'action_interaction': return 15;
      case 'action_creativity': return 15;
      case 'costume_styling': return 10;
      default: return 0;
    }
  } else if (competition.competition_type === 'challenge') {
    // ... challenge logic
  }
};
```

## 🔄 数据迁移策略

### 选项1：自动迁移（基于选手数量）
```javascript
// backend/migrations/split-duo-team.js
const db = require('../db');

async function migrateDuoTeam() {
  console.log('开始迁移 duo_team 类型...');
  
  // 获取所有 duo_team 比赛
  const competitions = await db.query(`
    SELECT c.id, c.name, COUNT(ca.athlete_id) as athlete_count
    FROM competitions c
    LEFT JOIN competition_athletes ca ON c.id = ca.competition_id
    WHERE c.competition_type = 'duo_team'
    GROUP BY c.id, c.name
  `);
  
  for (const comp of competitions.rows) {
    const newType = comp.athlete_count <= 2 ? 'duo' : 'team';
    await db.query(
      'UPDATE competitions SET competition_type = $1 WHERE id = $2',
      [newType, comp.id]
    );
    console.log(`✅ ${comp.name}: duo_team -> ${newType} (${comp.athlete_count}人)`);
  }
  
  console.log('迁移完成！');
}

migrateDuoTeam();
```

### 选项2：手动迁移（管理员确认）
创建管理界面，让管理员逐个确认每个比赛应该是duo还是team。

### 选项3：默认迁移为duo
```sql
UPDATE competitions 
SET competition_type = 'duo' 
WHERE competition_type = 'duo_team';
```
然后管理员可以手动修改需要改为team的比赛。

## ⚠️ 注意事项

1. **向后兼容**：旧的API请求可能仍使用 `duo_team`，需要处理
2. **缓存清除**：迁移后需要清除Redis缓存
3. **测试数据**：先在测试环境验证
4. **备份数据**：迁移前备份数据库
5. **评分标准**：duo和team使用相同的评分标准，代码中可以合并处理

## 🧪 测试清单

- [ ] 创建duo类型比赛
- [ ] 创建team类型比赛
- [ ] 评分表单显示正确的维度
- [ ] 评分提交成功
- [ ] 大屏幕显示正确
- [ ] 排行榜显示正确
- [ ] 导出Excel功能正常
- [ ] 筛选功能正常
- [ ] 国际化翻译正确

## 📅 实施时间估算

- 数据库迁移：30分钟
- 类型定义更新：15分钟
- 后端验证更新：15分钟
- 前端组件更新：2小时
- 翻译更新：30分钟
- 测试验证：1小时

**总计**：约4-5小时

## 🚀 部署步骤

1. 备份数据库
2. 执行数据迁移脚本
3. 部署新代码
4. 清除Redis缓存
5. 验证功能
6. 通知用户

