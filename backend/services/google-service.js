const { google } = require('googleapis');
const { OAuth2Client } = require('google-auth-library');

class GoogleService {
  constructor() {
    // Only initialize OAuth client in development or when all required env vars are present
    const hasRequiredEnvVars = process.env.GOOGLE_CLIENT_ID && 
                               process.env.GOOGLE_CLIENT_SECRET && 
                               process.env.GOOGLE_REDIRECT_URI;
    
    if (process.env.NODE_ENV === 'development' || hasRequiredEnvVars) {
      try {
        this.oauth2Client = new OAuth2Client(
          process.env.GOOGLE_CLIENT_ID,
          process.env.GOOGLE_CLIENT_SECRET,
          process.env.GOOGLE_REDIRECT_URI
        );
        
        this.drive = google.drive({ version: 'v3' });
        this.sheets = google.sheets({ version: 'v4' });
        this.isEnabled = true;
        console.log('✅ Google OAuth service initialized');
      } catch (error) {
        console.error('❌ Google OAuth service initialization failed:', error.message);
        this.oauth2Client = null;
        this.drive = null;
        this.sheets = null;
        this.isEnabled = false;
      }
    } else {
      this.oauth2Client = null;
      this.drive = null;
      this.sheets = null;
      this.isEnabled = false;
      console.log('⚠️ Google OAuth disabled: Missing required environment variables');
    }
  }

  // Check if service is enabled
  _checkEnabled() {
    if (!this.isEnabled) {
      throw new Error('Google OAuth service is disabled');
    }
  }

  // 获取OAuth授权URL
  getAuthUrl(userId) {
    this._checkEnabled();
    
    const scopes = [
      'https://www.googleapis.com/auth/drive.file',
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/userinfo.email'
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: scopes,
      state: userId,
      prompt: 'consent'
    });
  }

  // 处理OAuth回调
  async handleCallback(code) {
    this._checkEnabled();
    const { tokens } = await this.oauth2Client.getAccessToken(code);
    return tokens;
  }

  // 上传文件到Google Drive
  async uploadToDrive(fileBuffer, fileName, mimeType, userTokens, targetEmail) {
    this._checkEnabled();
    this.oauth2Client.setCredentials(userTokens);
    
    const drive = google.drive({ 
      version: 'v3', 
      auth: this.oauth2Client 
    });

    const fileMetadata = {
      name: fileName,
      parents: ['root']
    };

    const media = {
      mimeType: mimeType,
      body: fileBuffer
    };

    const response = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id,name,webViewLink'
    });

    // 如果指定了目标邮箱，共享文件
    if (targetEmail && targetEmail !== userTokens.email) {
      await drive.permissions.create({
        fileId: response.data.id,
        resource: {
          role: 'writer',
          type: 'user',
          emailAddress: targetEmail
        }
      });
    }

    return response.data;
  }

  // 创建Google Sheets
  async createSheet(title, data, userTokens) {
    this._checkEnabled();
    this.oauth2Client.setCredentials(userTokens);
    
    const sheets = google.sheets({ 
      version: 'v4', 
      auth: this.oauth2Client 
    });

    const createResponse = await sheets.spreadsheets.create({
      resource: {
        properties: {
          title: title
        }
      }
    });

    const spreadsheetId = createResponse.data.spreadsheetId;

    if (data && data.length > 0) {
      await sheets.spreadsheets.values.update({
        spreadsheetId: spreadsheetId,
        range: 'A1',
        valueInputOption: 'RAW',
        resource: {
          values: data
        }
      });
    }

    return {
      spreadsheetId: spreadsheetId,
      url: `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`
    };
  }

  // 获取用户信息
  async getUserInfo(userTokens) {
    this._checkEnabled();
    this.oauth2Client.setCredentials(userTokens);
    
    const oauth2 = google.oauth2({ 
      version: 'v2', 
      auth: this.oauth2Client 
    });

    const response = await oauth2.userinfo.get();
    return response.data;
  }
}

module.exports = new GoogleService();