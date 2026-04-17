const { google } = require('googleapis');
const db = require('../db');

class GoogleDriveService {
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

  // 上传文件到 Google Drive
  async uploadFile(userId, file, metadata = {}) {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: metadata.name || file.originalname,
      mimeType: file.mimetype,
      parents: metadata.folderId ? [metadata.folderId] : undefined,
      description: metadata.description || ''
    };

    const media = {
      mimeType: file.mimetype,
      body: file.buffer ? require('stream').Readable.from(file.buffer) : require('fs').createReadStream(file.path)
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime'
    });

    // 设置权限
    if (metadata.makePublic) {
      await drive.permissions.create({
        fileId: response.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });
    }

    // 保存上传记录
    await db.query(
      `INSERT INTO google_exports (user_id, competition_id, export_type, file_id, file_name, file_url, status)
       VALUES ($1, $2, 'drive', $3, $4, $5, 'completed')`,
      [
        userId,
        metadata.competitionId || null,
        response.data.id,
        response.data.name,
        response.data.webViewLink
      ]
    );

    return {
      file_id: response.data.id,
      file_name: response.data.name,
      mime_type: response.data.mimeType,
      size: response.data.size,
      web_view_link: response.data.webViewLink,
      web_content_link: response.data.webContentLink,
      created_time: response.data.createdTime
    };
  }

  // 创建文件夹
  async createFolder(userId, folderName, parentFolderId = null) {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentFolderId ? [parentFolderId] : undefined
    };

    const response = await drive.files.create({
      requestBody: fileMetadata,
      fields: 'id, name, webViewLink'
    });

    return {
      folder_id: response.data.id,
      folder_name: response.data.name,
      web_view_link: response.data.webViewLink
    };
  }

  // 列出文件
  async listFiles(userId, options = {}) {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const query = [];
    if (options.folderId) {
      query.push(`'${options.folderId}' in parents`);
    }
    if (options.mimeType) {
      query.push(`mimeType='${options.mimeType}'`);
    }
    query.push('trashed=false');

    const response = await drive.files.list({
      q: query.join(' and '),
      pageSize: options.pageSize || 100,
      fields: 'files(id, name, mimeType, size, webViewLink, createdTime, modifiedTime)',
      orderBy: 'modifiedTime desc'
    });

    return response.data.files;
  }

  // 删除文件
  async deleteFile(userId, fileId) {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    await drive.files.delete({
      fileId: fileId
    });

    // 同时删除数据库记录
    await db.query(
      'DELETE FROM google_exports WHERE user_id = $1 AND file_id = $2',
      [userId, fileId]
    );

    return { success: true };
  }

  // 分享文件给特定用户
  async shareFile(userId, fileId, emailAddress, role = 'reader') {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.permissions.create({
      fileId: fileId,
      requestBody: {
        type: 'user',
        role: role, // 'reader', 'writer', 'commenter'
        emailAddress: emailAddress
      },
      sendNotificationEmail: true
    });

    return {
      permission_id: response.data.id,
      email: emailAddress,
      role: role
    };
  }

  // 获取文件元数据
  async getFileMetadata(userId, fileId) {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get({
      fileId: fileId,
      fields: 'id, name, mimeType, size, webViewLink, webContentLink, createdTime, modifiedTime, owners, permissions'
    });

    return response.data;
  }

  // 下载文件
  async downloadFile(userId, fileId) {
    const auth = await this.getAuthClient(userId);
    const drive = google.drive({ version: 'v3', auth });

    const response = await drive.files.get(
      {
        fileId: fileId,
        alt: 'media'
      },
      { responseType: 'stream' }
    );

    return response.data;
  }
}

module.exports = new GoogleDriveService();
