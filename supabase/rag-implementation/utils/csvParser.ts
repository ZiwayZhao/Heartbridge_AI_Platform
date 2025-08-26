import * as XLSX from 'xlsx';

// 通用CSV解析函数
export const parseCsvToJson = <T extends Record<string, any>>(file: File): Promise<T[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        
        const jsonData = XLSX.utils.sheet_to_json<T>(worksheet);

        resolve(jsonData);
      } catch (error) {
        reject(error instanceof Error ? error : new Error(String(error)));
      }
    };

    reader.onerror = (error) => {
      console.error("FileReader error:", error);
      reject(new Error("读取文件时发生错误。"));
    };

    reader.readAsArrayBuffer(file);
  });
};
