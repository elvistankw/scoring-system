import useSWR from 'swr';
import { toast } from 'sonner';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';

// Google 授权相关
export function useGoogleAuth() {
  const { data, error, mutate } = useSWR(`${API_BASE_URL}/auth/google/status`, async (url) => {
    const token = localStorage.getItem('auth_token'); // 使用正确的 token key
    if (!token) return null;

    const response = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` }
    });

    if (!response.ok) throw new Error('获取授权状态失败');
    return response.json();
  });

  const authorize = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/auth/google/auth-url`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      const result = await response.json();

      if (result.status === 'success') {
        // 打开授权窗口
        const authWindow = window.open(
          result.data.auth_url,
          'Google Authorization',
          'width=600,height=700,left=200,top=100'
        );

        // 监听授权完成
        const checkAuth = setInterval(() => {
          if (authWindow?.closed) {
            clearInterval(checkAuth);
            mutate(); // 刷新授权状态
            toast.success('授权成功！');
          }
        }, 1000);
      } else {
        toast.error(result.message || '获取授权链接失败');
      }
    } catch (error) {
      console.error('Authorization error:', error);
      toast.error('授权失败');
    }
  };

  return {
    isAuthorized: data?.data?.is_authorized || false,
    googleEmail: data?.data?.google_email,
    expiresAt: data?.data?.expires_at,
    isLoading: !data && !error,
    authorize,
    refresh: mutate
  };
}

// Google Sheets 导出
export function useGoogleSheets() {
  const exportToSheets = async (competitionId: number) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        throw new Error('未登录');
      }

      toast.loading('正在导出到 Google Sheets...', { id: 'export-sheets' });

      const response = await fetch(
        `${API_BASE_URL}/google/sheets/export/${competitionId}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      const result = await response.json();

      if (result.status === 'success') {
        toast.success('导出成功！', { id: 'export-sheets' });
        
        // 打开 Google Sheets
        window.open(result.data.spreadsheet_url, '_blank');
        
        return result.data;
      } else {
        if (result.code === 'GOOGLE_AUTH_REQUIRED') {
          toast.error('请先授权 Google 访问', { id: 'export-sheets' });
        } else {
          toast.error(result.message || '导出失败', { id: 'export-sheets' });
        }
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Export to Sheets error:', error);
      toast.error('导出失败', { id: 'export-sheets' });
      throw error;
    }
  };

  return { exportToSheets };
}

// Google Drive 上传
export function useGoogleDrive() {
  const uploadToDrive = async (
    file: File,
    options: {
      competitionId?: number;
      makePublic?: boolean;
      folderId?: string;
      description?: string;
    } = {}
  ) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        throw new Error('未登录');
      }

      toast.loading('正在上传到 Google Drive...', { id: 'upload-drive' });

      const formData = new FormData();
      formData.append('file', file);
      if (options.competitionId) {
        formData.append('competition_id', String(options.competitionId));
      }
      if (options.makePublic) {
        formData.append('make_public', 'true');
      }
      if (options.folderId) {
        formData.append('folder_id', options.folderId);
      }
      if (options.description) {
        formData.append('description', options.description);
      }

      const response = await fetch(`${API_BASE_URL}/google/drive/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: formData
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast.success('上传成功！', { id: 'upload-drive' });
        return result.data;
      } else {
        if (result.code === 'GOOGLE_AUTH_REQUIRED') {
          toast.error('请先授权 Google 访问', { id: 'upload-drive' });
        } else {
          toast.error(result.message || '上传失败', { id: 'upload-drive' });
        }
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Upload to Drive error:', error);
      toast.error('上传失败', { id: 'upload-drive' });
      throw error;
    }
  };

  const createFolder = async (folderName: string, parentFolderId?: string) => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        toast.error('请先登录');
        throw new Error('未登录');
      }

      const response = await fetch(`${API_BASE_URL}/google/drive/folder`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          folder_name: folderName,
          parent_folder_id: parentFolderId
        })
      });

      const result = await response.json();

      if (result.status === 'success') {
        toast.success('文件夹创建成功！');
        return result.data;
      } else {
        toast.error(result.message || '创建失败');
        throw new Error(result.message);
      }
    } catch (error) {
      console.error('Create folder error:', error);
      toast.error('创建文件夹失败');
      throw error;
    }
  };

  return { uploadToDrive, createFolder };
}

// 导出历史
export function useExportHistory(competitionId?: number, exportType?: 'sheet' | 'drive') {
  const params = new URLSearchParams();
  if (competitionId) params.append('competition_id', String(competitionId));
  if (exportType) params.append('export_type', exportType);

  const { data, error, mutate } = useSWR(
    `${API_BASE_URL}/google/sheets/history?${params.toString()}`,
    async (url) => {
      const token = localStorage.getItem('token');
      if (!token) return null;

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!response.ok) throw new Error('获取导出历史失败');
      return response.json();
    }
  );

  return {
    history: data?.data || [],
    isLoading: !data && !error,
    error,
    refresh: mutate
  };
}
