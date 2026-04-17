const { google } = require('googleapis');
const db = require('../db');

class GoogleSheetsService {
  constructor() {
    this.oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );
  }

  // 获取用户的认证客户端
  async getAuthClient(userId) {
    const result = await db.query(
      'SELECT access_token, refresh_token, expires_at FROM user_google_tokens WHERE user_id = $1',
      [userId]
    );

    if (result.rows.length === 0) {
      throw new Error('用户未授权 Google 访问，请先完成授权');
    }

    const { access_token, refresh_token, expires_at } = result.rows[0];

    this.oauth2Client.setCredentials({
      access_token,
      refresh_token,
      expiry_date: new Date(expires_at).getTime()
    });

    // 自动刷新令牌
    this.oauth2Client.on('tokens', async (tokens) => {
      if (tokens.refresh_token) {
        await db.query(
          `UPDATE user_google_tokens 
           SET access_token = $1, refresh_token = $2, expires_at = $3, updated_at = CURRENT_TIMESTAMP
           WHERE user_id = $4`,
          [
            tokens.access_token,
            tokens.refresh_token,
            new Date(tokens.expiry_date),
            userId
          ]
        );
      }
    });

    return this.oauth2Client;
  }

  // 导出比赛数据到 Google Sheets
  async exportCompetitionToSheets(userId, competitionId, data) {
    const auth = await this.getAuthClient(userId);
    const sheets = google.sheets({ version: 'v4', auth });

    // 创建新的 Spreadsheet
    const timestamp = new Date().toISOString().split('T')[0];
    const title = `${data.competitionName}_比赛数据_${timestamp}`;

    const createResponse = await sheets.spreadsheets.create({
      requestBody: {
        properties: {
          title,
          locale: 'zh_CN',
          timeZone: 'Asia/Shanghai'
        },
        sheets: [
          {
            properties: {
              title: '选手信息',
              gridProperties: { frozenRowCount: 1 }
            }
          },
          {
            properties: {
              title: '评分记录',
              gridProperties: { frozenRowCount: 1 }
            }
          },
          {
            properties: {
              title: '排名统计',
              gridProperties: { frozenRowCount: 1 }
            }
          }
        ]
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;
    const spreadsheetUrl = createResponse.data.spreadsheetUrl;

    // 填充数据
    await this.populateSheetData(sheets, spreadsheetId, data);

    // 应用格式化
    await this.formatSpreadsheet(sheets, spreadsheetId);

    // 保存导出记录
    await db.query(
      `INSERT INTO google_exports (user_id, competition_id, export_type, file_id, file_name, file_url, status)
       VALUES ($1, $2, 'sheet', $3, $4, $5, 'completed')`,
      [userId, competitionId, spreadsheetId, title, spreadsheetUrl]
    );

    return {
      spreadsheet_id: spreadsheetId,
      spreadsheet_url: spreadsheetUrl,
      file_name: title
    };
  }

  // 填充 Sheet 数据
  async populateSheetData(sheets, spreadsheetId, data) {
    const updates = [];

    // 1. 选手信息表
    if (data.athletes && data.athletes.length > 0) {
      const athleteHeaders = [['选手ID', '姓名', '性别', '年龄', '级别', '注册时间']];
      const athleteRows = data.athletes.map(a => [
        a.id,
        a.name,
        a.gender === 'male' ? '男' : '女',
        a.age || '-',
        a.level || '-',
        new Date(a.created_at).toLocaleString('zh-CN')
      ]);

      updates.push({
        range: '选手信息!A1',
        values: [...athleteHeaders, ...athleteRows]
      });
    }

    // 2. 评分记录表
    if (data.scores && data.scores.length > 0) {
      const scoreHeaders = [['评分ID', '选手姓名', '评委', '技术分', '艺术分', '难度分', '总分', '评分时间']];
      const scoreRows = data.scores.map(s => [
        s.id,
        s.athlete_name,
        s.judge_name,
        s.technical_score || 0,
        s.artistic_score || 0,
        s.difficulty_score || 0,
        s.total_score || 0,
        new Date(s.created_at).toLocaleString('zh-CN')
      ]);

      updates.push({
        range: '评分记录!A1',
        values: [...scoreHeaders, ...scoreRows]
      });
    }

    // 3. 排名统计表
    if (data.rankings && data.rankings.length > 0) {
      const rankHeaders = [['排名', '选手姓名', '总分', '平均技术分', '平均艺术分', '平均难度分', '评分次数']];
      const rankRows = data.rankings.map((r, idx) => [
        idx + 1,
        r.athlete_name,
        parseFloat(r.total_score).toFixed(2),
        parseFloat(r.avg_technical).toFixed(2),
        parseFloat(r.avg_artistic).toFixed(2),
        parseFloat(r.avg_difficulty).toFixed(2),
        r.score_count || 0
      ]);

      updates.push({
        range: '排名统计!A1',
        values: [...rankHeaders, ...rankRows]
      });
    }

    // 批量更新数据
    if (updates.length > 0) {
      await sheets.spreadsheets.values.batchUpdate({
        spreadsheetId,
        requestBody: {
          valueInputOption: 'USER_ENTERED',
          data: updates
        }
      });
    }
  }

  // 格式化 Spreadsheet
  async formatSpreadsheet(sheets, spreadsheetId) {
    const requests = [
      // 设置表头样式（粗体、背景色）
      {
        repeatCell: {
          range: {
            sheetId: 0,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.86 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 1,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.86 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      },
      {
        repeatCell: {
          range: {
            sheetId: 2,
            startRowIndex: 0,
            endRowIndex: 1
          },
          cell: {
            userEnteredFormat: {
              backgroundColor: { red: 0.2, green: 0.6, blue: 0.86 },
              textFormat: { bold: true, foregroundColor: { red: 1, green: 1, blue: 1 } },
              horizontalAlignment: 'CENTER'
            }
          },
          fields: 'userEnteredFormat(backgroundColor,textFormat,horizontalAlignment)'
        }
      },
      // 自动调整列宽
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: 0,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 6
          }
        }
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: 1,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 8
          }
        }
      },
      {
        autoResizeDimensions: {
          dimensions: {
            sheetId: 2,
            dimension: 'COLUMNS',
            startIndex: 0,
            endIndex: 7
          }
        }
      }
    ];

    await sheets.spreadsheets.batchUpdate({
      spreadsheetId,
      requestBody: { requests }
    });
  }

  // 获取导出历史
  async getExportHistory(userId, filters = {}) {
    let query = 'SELECT * FROM google_exports WHERE user_id = $1';
    const params = [userId];

    if (filters.competitionId) {
      query += ' AND competition_id = $2';
      params.push(filters.competitionId);
    }

    if (filters.exportType) {
      query += ` AND export_type = $${params.length + 1}`;
      params.push(filters.exportType);
    }

    query += ' ORDER BY created_at DESC LIMIT 50';

    const result = await db.query(query, params);
    return result.rows;
  }

  // 删除导出记录（仅删除数据库记录，不删除 Google 文件）
  async deleteExportRecord(userId, exportId) {
    const result = await db.query(
      'DELETE FROM google_exports WHERE id = $1 AND user_id = $2 RETURNING *',
      [exportId, userId]
    );

    return result.rows[0];
  }
}

module.exports = new GoogleSheetsService();
