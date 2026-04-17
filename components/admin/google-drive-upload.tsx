'use client';

import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Upload, Loader2, CheckCircle2, X } from 'lucide-react';
import { useGoogleAuth, useGoogleDrive } from '@/hooks/use-google-integration';
import { toast } from 'sonner';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';

interface GoogleDriveUploadProps {
  competitionId?: number;
  onUploadSuccess?: (fileData: any) => void;
}

export function GoogleDriveUpload({ competitionId, onUploadSuccess }: GoogleDriveUploadProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [makePublic, setMakePublic] = useState(false);
  const [description, setDescription] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { isAuthorized, authorize, isLoading: authLoading } = useGoogleAuth();
  const { uploadToDrive } = useGoogleDrive();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 检查文件大小（50MB）
      if (file.size > 50 * 1024 * 1024) {
        toast.error('文件大小不能超过 50MB');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('请选择文件');
      return;
    }

    if (!isAuthorized) {
      toast.info('请先授权 Google 访问');
      authorize();
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadToDrive(selectedFile, {
        competitionId,
        makePublic,
        description
      });

      // 重置表单
      setSelectedFile(null);
      setDescription('');
      setMakePublic(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      // 关闭对话框
      setIsOpen(false);

      // 回调
      onUploadSuccess?.(result);
    } catch (error) {
      // 错误已在 hook 中处理
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="gap-2">
          <Upload className="h-4 w-4" />
          上传到 Google Drive
          {isAuthorized && <CheckCircle2 className="h-3 w-3 text-green-500" />}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>上传文件到 Google Drive</DialogTitle>
          <DialogDescription>
            选择文件并配置上传选项（最大 50MB）
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* 文件选择 */}
          <div className="space-y-2">
            <Label htmlFor="file">选择文件</Label>
            <Input
              id="file"
              ref={fileInputRef}
              type="file"
              onChange={handleFileSelect}
              accept=".pdf,.xlsx,.xls,.doc,.docx,.jpg,.jpeg,.png,.gif,.csv"
              disabled={isUploading}
            />
            {selectedFile && (
              <div className="flex items-center justify-between p-2 bg-muted rounded-md">
                <span className="text-sm truncate flex-1">{selectedFile.name}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveFile}
                  disabled={isUploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>

          {/* 描述 */}
          <div className="space-y-2">
            <Label htmlFor="description">描述（可选）</Label>
            <Input
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="文件描述..."
              disabled={isUploading}
            />
          </div>

          {/* 公开选项 */}
          <div className="flex items-center space-x-2">
            <Checkbox
              id="makePublic"
              checked={makePublic}
              onCheckedChange={(checked) => setMakePublic(checked as boolean)}
              disabled={isUploading}
            />
            <Label
              htmlFor="makePublic"
              className="text-sm font-normal cursor-pointer"
            >
              设为公开（任何人都可以查看）
            </Label>
          </div>

          {/* 授权提示 */}
          {!isAuthorized && !authLoading && (
            <div className="p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                首次使用需要授权 Google Drive 访问权限
              </p>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end gap-2">
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isUploading}
          >
            取消
          </Button>
          <Button
            onClick={handleUpload}
            disabled={!selectedFile || isUploading || authLoading}
          >
            {isUploading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                上传中...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                上传
              </>
            )}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
