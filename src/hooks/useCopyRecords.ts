// 复制记录逻辑 Hook
import { useState } from 'react';
import { copyRecords, CopyResult } from '../utils/copyHelper';

export function useCopyRecords() {
  const [loading, setLoading] = useState(false);

  const executeCopy = async (
    sourceTableId: string,
    targetTableId: string,
    recordIds: string[]
  ): Promise<CopyResult> => {
    setLoading(true);
    
    try {
      const result = await copyRecords(
        sourceTableId,
        targetTableId,
        recordIds
      );
      
      return result;
    } finally {
      setLoading(false);
    }
  };

  return { 
    executeCopy, 
    loading 
  };
}

