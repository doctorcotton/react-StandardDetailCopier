// 视图管理 Hook
import { useState, useEffect } from 'react';
import { bitable, IViewMeta } from '@lark-base-open/js-sdk';

/**
 * 获取表的视图列表
 */
export function useViews(tableId: string) {
  const [views, setViews] = useState<IViewMeta[]>([]);
  const [activeViewId, setActiveViewId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!tableId) {
      setViews([]);
      setActiveViewId('');
      return;
    }

    const loadViews = async () => {
      try {
        setLoading(true);
        const table = await bitable.base.getTable(tableId);
        
        // 获取所有视图
        const viewList = await table.getViewMetaList();
        setViews(viewList);

        // 获取当前激活的视图
        const activeView = await table.getActiveView();
        const activeViewMeta = await activeView.getMeta();
        setActiveViewId(activeViewMeta.id);
        
        console.log('视图列表:', viewList);
        console.log('当前激活视图:', activeViewMeta);
      } catch (error) {
        console.error('加载视图失败:', error);
        setViews([]);
        setActiveViewId('');
      } finally {
        setLoading(false);
      }
    };

    loadViews();
  }, [tableId]);

  return {
    views,
    activeViewId,
    loading
  };
}

