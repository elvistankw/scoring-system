const express = require('express');
const router = express.Router();
const googleSheetsService = require('../services/google-sheets-service');
const { authenticate, requireRole } = require('../middleware/auth');
const db = require('../db');

// 导出比赛数据到 Google Sheets
router.post('/export/:competitionId', authenticate, requireRole(['admin', 'judge']), async (req, res, next) => {
  try {
    const { competitionId } = req.params;

    // 获取比赛基本信息
    const competitionResult = await db.query(
      'SELECT * FROM competitions WHERE id = $1',
      [competitionId]
    );

    if (competitionResult.rows.length === 0) {
      return res.status(404).json({
        status: 'error',
        message: '比赛不存在'
      });
    }

    const competition = competitionResult.rows[0];

    // 获取选手数据
    const athletesResult = await db.query(
      `SELECT a.* 
       FROM athletes a
       JOIN competition_athletes ca ON a.id = ca.athlete_id
       WHERE ca.competition_id = $1
       ORDER BY a.name`,
      [competitionId]
    );

    // 获取评分数据
    const scoresResult = await db.query(
      `SELECT 
         s.*,
         a.name as athlete_name,
         u.username as judge_name
       FROM scores s
       JOIN athletes a ON s.athlete_id = a.id
       JOIN users u ON s.judge_id = u.id
       WHERE s.competition_id = $1
       ORDER BY s.created_at DESC`,
      [competitionId]
    );

    // 获取排名数据（根据比赛类型）
    let rankingsQuery;
    if (competition.category_type === 'individual') {
      rankingsQuery = `
        SELECT 
          a.name as athlete_name,
          AVG(s.total_score) as total_score,
          AVG(s.technical_score) as avg_technical,
          AVG(s.artistic_score) as avg_artistic,
          AVG(s.difficulty_score) as avg_difficulty,
          COUNT(s.id) as score_count
        FROM scores s
        JOIN athletes a ON s.athlete_id = a.id
        WHERE s.competition_id = $1
        GROUP BY a.id, a.name
        ORDER BY total_score DESC
      `;
    } else if (competition.category_type === 'duo') {
      rankingsQuery = `
        SELECT 
          a.name as athlete_name,
          AVG(s.total_score) as total_score,
          AVG(s.technical_score) as avg_technical,
          AVG(s.artistic_score) as avg_artistic,
          AVG(s.synchronization_score) as avg_synchronization,
          COUNT(s.id) as score_count
        FROM scores s
        JOIN athletes a ON s.athlete_id = a.id
        WHERE s.competition_id = $1
        GROUP BY a.id, a.name
        ORDER BY total_score DESC
      `;
    } else {
      // challenge
      rankingsQuery = `
        SELECT 
          a.name as athlete_name,
          AVG(s.total_score) as total_score,
          AVG(s.technical_score) as avg_technical,
          AVG(s.creativity_score) as avg_creativity,
          AVG(s.execution_score) as avg_execution,
          COUNT(s.id) as score_count
        FROM scores s
        JOIN athletes a ON s.athlete_id = a.id
        WHERE s.competition_id = $1
        GROUP BY a.id, a.name
        ORDER BY total_score DESC
      `;
    }

    const rankingsResult = await db.query(rankingsQuery, [competitionId]);

    // 导出到 Google Sheets
    const result = await googleSheetsService.exportCompetitionToSheets(
      req.user.id,
      competitionId,
      {
        competitionName: competition.name,
        categoryType: competition.category_type,
        athletes: athletesResult.rows,
        scores: scoresResult.rows,
        rankings: rankingsResult.rows
      }
    );

    res.json({
      status: 'success',
      message: '导出成功',
      data: result
    });
  } catch (error) {
    console.error('Export to Sheets error:', error);
    
    if (error.message.includes('未授权')) {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }

    next(error);
  }
});

// 获取导出历史
router.get('/history', authenticate, async (req, res, next) => {
  try {
    const { competition_id, export_type } = req.query;

    const history = await googleSheetsService.getExportHistory(req.user.id, {
      competitionId: competition_id ? parseInt(competition_id) : undefined,
      exportType: export_type
    });

    res.json({
      status: 'success',
      data: history
    });
  } catch (error) {
    next(error);
  }
});

// 删除导出记录
router.delete('/history/:exportId', authenticate, async (req, res, next) => {
  try {
    const { exportId } = req.params;

    const deleted = await googleSheetsService.deleteExportRecord(req.user.id, exportId);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: '导出记录不存在'
      });
    }

    res.json({
      status: 'success',
      message: '删除成功'
    });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
