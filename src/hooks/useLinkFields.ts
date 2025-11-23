// 关联字段管理 Hook
import { useState, useEffect } from 'react';
import { bitable, IFieldMeta } from '@lark-base-open/js-sdk';
import { getLinkFields, getLinkedRecordIds } from '../utils/linkHelper';

/**
 * 获取表的双向关联字段列表
 * @param tableId 表ID
 * @returns 关联字段列表和加载状态
 */
export function useLinkFields(tableId: string) {
  const [linkFields, setLinkFields] = useState<IFieldMeta[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tableId) {
      setLinkFields([]);
      return;
    }

    const loadLinkFields = async () => {
      try {
        setLoading(true);
        const fields = await getLinkFields(tableId);
        setLinkFields(fields);
      } catch (error) {
        console.error('加载关联字段失败:', error);
        setLinkFields([]);
      } finally {
        setLoading(false);
      }
    };

    loadLinkFields();

    // 监听字段变化
    let unsubscribers: (() => void)[] = [];
    
    const setupListeners = async () => {
      try {
        const table = await bitable.base.getTable(tableId);
        
        // 监听字段添加
        const offFieldAdd = table.onFieldAdd(() => {
          console.log('检测到字段添加，重新加载关联字段列表');
          loadLinkFields();
        });
        
        // 监听字段删除
        const offFieldDelete = table.onFieldDelete(() => {
          console.log('检测到字段删除，重新加载关联字段列表');
          loadLinkFields();
        });
        
        // 监听字段修改
        const offFieldModify = table.onFieldModify(() => {
          console.log('检测到字段修改，重新加载关联字段列表');
          loadLinkFields();
        });
        
        unsubscribers = [offFieldAdd, offFieldDelete, offFieldModify];
      } catch (error) {
        console.error('设置字段监听器失败:', error);
      }
    };

    setupListeners();

    // 清理监听器
    return () => {
      unsubscribers.forEach(unsub => unsub());
    };
  }, [tableId]);

  return {
    linkFields,
    loading
  };
}

/**
 * 获取记录的关联记录信息
 * @param tableId 表ID
 * @param recordId 记录ID
 * @param fieldId 关联字段ID
 * @returns 关联记录信息
 */
export function useLinkedRecords(
  tableId: string,
  recordId: string,
  fieldId: string
) {
  const [linkedInfo, setLinkedInfo] = useState<{
    tableId: string;
    recordIds: string[];
  }>({ tableId: '', recordIds: [] });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tableId || !recordId || !fieldId) {
      setLinkedInfo({ tableId: '', recordIds: [] });
      return;
    }

    const loadLinkedRecords = async () => {
      try {
        setLoading(true);
        const info = await getLinkedRecordIds(tableId, recordId, fieldId);
        setLinkedInfo(info);
      } catch (error) {
        console.error('加载关联记录失败:', error);
        setLinkedInfo({ tableId: '', recordIds: [] });
      } finally {
        setLoading(false);
      }
    };

    loadLinkedRecords();

    // 监听记录修改（包括单元格值变化）
    let offRecordModify: (() => void) | null = null;
    
    const setupListeners = async () => {
      try {
        const table = await bitable.base.getTable(tableId);
        
        // 监听记录修改，当源记录的关联字段值变化时重新加载
        offRecordModify = table.onRecordModify(() => {
          console.log('检测到记录修改，重新加载关联记录');
          loadLinkedRecords();
        });
      } catch (error) {
        console.error('设置记录监听器失败:', error);
      }
    };

    setupListeners();

    // 清理监听器
    return () => {
      if (offRecordModify) {
        offRecordModify();
      }
    };
  }, [tableId, recordId, fieldId]);

  return {
    linkedTableId: linkedInfo.tableId,
    linkedRecordIds: linkedInfo.recordIds,
    loading
  };
}

