// 获取表的记录列表 Hook
import { useState, useEffect } from 'react';
import { bitable, IRecord } from '@lark-base-open/js-sdk';

/**
 * 获取指定表的所有记录
 * @param tableId 表ID
 * @returns 记录列表和加载状态
 */
export function useTableRecords(tableId: string) {
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
          pageSize: 5000,
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

    // 监听记录变化
    let unsubscribers: (() => void)[] = [];
    
    const setupListeners = async () => {
      try {
        const table = await bitable.base.getTable(tableId);
        
        // 监听记录添加
        const offRecordAdd = table.onRecordAdd(() => {
          console.log('检测到记录添加，重新加载记录列表');
          loadRecords();
        });
        
        // 监听记录删除
        const offRecordDelete = table.onRecordDelete(() => {
          console.log('检测到记录删除，重新加载记录列表');
          loadRecords();
        });
        
        // 监听记录修改
        const offRecordModify = table.onRecordModify(() => {
          console.log('检测到记录修改，重新加载记录列表');
          loadRecords();
        });
        
        unsubscribers = [offRecordAdd, offRecordDelete, offRecordModify];
      } catch (error) {
        console.error('设置记录监听器失败:', error);
      }
    };

    setupListeners();

    // 清理监听器
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [tableId]);

  return {
    records,
    loading
  };
}

