// 记录数据管理 Hook
import { useState, useEffect } from 'react';
import { bitable, IRecord } from '@lark-base-open/js-sdk';

export function useRecords(tableId: string) {
  const [records, setRecords] = useState<IRecord[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tableId) {
      setRecords([]);
      return;
    }

    const loadRecords = async () => {
      try {
        setLoading(true);
        const table = await bitable.base.getTable(tableId);
        const recordList = await table.getRecords({
          pageSize: 5000, // 获取最多5000条记录
        });
        setRecords(recordList.records);
      } catch (error) {
        console.error('加载记录失败:', error);
        setRecords([]);
      } finally {
        setLoading(false);
      }
    };

    loadRecords();
  }, [tableId]);

  return {
    records,
    loading
  };
}

