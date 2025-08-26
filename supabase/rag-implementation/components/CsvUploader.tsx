import { useState } from 'react';
import { parseCsvToJson } from '../utils/csvParser';

interface KnowledgeUnit {
  content: string;
  category?: string;
  importance?: string;
  labels?: string[];
  keywords?: string[];
}

interface CsvUploaderProps {
  onUploadComplete: () => void;
}

export default function CsvUploader({ onUploadComplete }: CsvUploaderProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      alert('请选择要上传的 CSV 文件');
      return;
    }

    setIsLoading(true);
    
    try {
      // 解析CSV文件
      const knowledgeUnits = await parseCsvToJson<KnowledgeUnit>(file);
      const batchSize = 50;
      let successCount = 0;
      let errorCount = 0;

      // 批量处理知识单元
      for (let i = 0; i < knowledgeUnits.length; i += batchSize) {
        const batch = knowledgeUnits.slice(i, i + batchSize);
        
        try {
          // 这里需要替换为你的API调用
          const response = await fetch('/api/knowledge-units/batch', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(batch),
          });

          if (!response.ok) {
            throw new Error('批量插入失败');
          }

          successCount += batch.length;
        } catch (error) {
          console.error('批量插入知识单元失败:', error);
          errorCount += batch.length;
        }
      }

      alert(`上传完成！成功: ${successCount}, 失败: ${errorCount}`);
      onUploadComplete();
      
      // 重置表单
      setFile(null);
      const fileInput = document.getElementById('csv-upload-input') as HTMLInputElement;
      if (fileInput) fileInput.value = '';

    } catch (error: any) {
      console.error('CSV 解析失败:', error);
      alert(error.message || '文件格式不正确，请确保文件为 UTF-8 编码的 CSV 格式');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      <h2>CSV知识库上传</h2>
      <p>上传包含知识内容的CSV文件，系统将自动处理并生成向量表示。</p>
      
      <div>
        <p>CSV文件要求：</p>
        <ul>
          <li>UTF-8编码</li>
          <li>必须包含 "content" 列（知识内容）</li>
          <li>可选列：category（类别）, importance（重要性）, labels（标签）, keywords（关键词）</li>
        </ul>
      </div>

      <div style={{ marginTop: '1rem' }}>
        <input
          id="csv-upload-input"
          type="file"
          accept=".csv"
          onChange={handleFileChange}
          style={{ marginRight: '1rem' }}
        />
        <button
          onClick={handleUpload}
          disabled={!file || isLoading}
        >
          {isLoading ? '处理中...' : '上传CSV文件'}
        </button>
      </div>
    </div>
  );
}
