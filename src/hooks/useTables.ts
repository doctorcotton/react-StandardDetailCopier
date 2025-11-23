// 表数据管理 Hook
import { useState, useEffect } from 'react';
import { bitable, ITableMeta } from '@lark-base-open/js-sdk';

export function useTables() {
  const [tables, setTables] = useState<ITableMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTableId, setActiveTableId] = useState<string>('');

  useEffect(() => {
    const loadTables = async () => {
      try {
        setLoading(true);
        // 获取所有表
        const tableList = await bitable.base.getTableMetaList();
        setTables(tableList);

        // 获取当前激活的表
        const selection = await bitable.base.getSelection();
        if (selection?.tableId) {
          setActiveTableId(selection.tableId);
        }
      } catch (error) {
        console.error('加载表列表失败:', error);
      } finally {
        setLoading(false);
      }
    };

    loadTables();

    // 监听表的添加和删除
    const offTableAdd = bitable.base.onTableAdd(() => {
      console.log('检测到新表添加，重新加载表列表');
      loadTables();
    });

    const offTableDelete = bitable.base.onTableDelete(() => {
      console.log('检测到表删除，重新加载表列表');
      loadTables();
    });

    // 监听选中状态变化
    const offSelectionChange = bitable.base.onSelectionChange(async (event) => {
      console.log('选中状态变化:', event);
      if (event.data?.tableId) {
        setActiveTableId(event.data.tableId);
      }
    });

    // 清理监听器
    return () => {
      offTableAdd();
      offTableDelete();
      offSelectionChange();
    };
  }, []);

  return {
    tables,
    activeTableId,
    loading
  };
}

