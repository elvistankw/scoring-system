const express = require('express');
const router = express.Router();
const multer = require('multer');
const googleDriveService = require('../services/google-drive-service');
const { authenticate, requireRole } = require('../middleware/auth');

// 配置 multer（内存存储）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB
  },
  fileFilter: (req, file, cb) => {
    // 允许的文件类型
    const allowedMimes = [
      'application/pdf',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/csv'
    ];

    if (allowedMimes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('不支持的文件类型'));
    }
  }
});

// 上传文件到 Google Drive
router.post('/upload', authenticate, requireRole(['admin']), upload.single('file'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        status: 'error',
        message: '请选择文件'
      });
    }

    const { competition_id, make_public, folder_id, description } = req.body;

    const result = await googleDriveService.uploadFile(req.user.id, req.file, {
      competitionId: competition_id ? parseInt(competition_id) : null,
      makePublic: make_public === 'true',
      folderId: folder_id,
      description: description
    });

    res.json({
      status: 'success',
      message: '上传成功',
      data: result
    });
  } catch (error) {
    console.error('Upload to Drive error:', error);

    if (error.message.includes('未授权')) {
      return res.status(401).json({
        status: 'error',
        message: error.message,
        code: 'GOOGLE_AUTH_REQUIRED'
      });
    }

    if (error.message.includes('不支持的文件类型')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }

    next(error);
  }
});

// 创建文件夹
router.post('/folder', authenticate, requireRole(['admin']), async (req, res, next) => {
  try {
    const { folder_name, parent_folder_id } = req.body;

    if (!folder_name) {
      return res.status(400).json({
        status: 'error',
        message: '请提供文件夹名称'
      });
    }

    const result = await googleDriveService.createFolder(
      req.user.id,
      folder_name,
      parent_folder_id
    );

    res.json({
      status: 'success',
      message: '文件夹创建成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 列出文件
router.get('/files', authenticate, async (req, res, next) => {
  try {
    const { folder_id, mime_type, page_size } = req.query;

    const files = await googleDriveService.listFiles(req.user.id, {
      folderId: folder_id,
      mimeType: mime_type,
      pageSize: page_size ? parseInt(page_size) : 100
    });

    res.json({
      status: 'success',
      data: files
    });
  } catch (error) {
    next(error);
  }
});

// 删除文件
router.delete('/files/:fileId', authenticate, requireRole(['admin']), async (req, res, next) => {
  try {
    const { fileId } = req.params;

    await googleDriveService.deleteFile(req.user.id, fileId);

    res.json({
      status: 'success',
      message: '文件删除成功'
    });
  } catch (error) {
    next(error);
  }
});

// 分享文件
router.post('/files/:fileId/share', authenticate, requireRole(['admin']), async (req, res, next) => {
  try {
    const { fileId } = req.params;
    const { email, role } = req.body;

    if (!email) {
      return res.status(400).json({
        status: 'error',
        message: '请提供邮箱地址'
      });
    }

    const result = await googleDriveService.shareFile(
      req.user.id,
      fileId,
      email,
      role || 'reader'
    );

    res.json({
      status: 'success',
      message: '分享成功',
      data: result
    });
  } catch (error) {
    next(error);
  }
});

// 获取文件元数据
router.get('/files/:fileId/metadata', authenticate, async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const metadata = await googleDriveService.getFileMetadata(req.user.id, fileId);

    res.json({
      status: 'success',
      data: metadata
    });
  } catch (error) {
    next(error);
  }
});

// 下载文件
router.get('/files/:fileId/download', authenticate, async (req, res, next) => {
  try {
    const { fileId } = req.params;

    const stream = await googleDriveService.downloadFile(req.user.id, fileId);

    // 设置响应头
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Content-Disposition', 'attachment');

    // 将流传输到响应
    stream.pipe(res);
  } catch (error) {
    next(error);
  }
});

module.exports = router;
