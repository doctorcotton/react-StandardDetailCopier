// 记录列表组件（带复选框）
import { Checkbox, Spin } from '@douyinfe/semi-ui';
import { IRecord } from '@lark-base-open/js-sdk';
import { useState, useEffect } from 'react';

interface RecordListProps {
  records: IRecord[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  loading?: boolean;
}

export default function RecordList({
  records,
  selectedIds,
  onSelectionChange,
  loading = false
}: RecordListProps) {
  const [allChecked, setAllChecked] = useState(false);
  const [indeterminate, setIndeterminate] = useState(false);

  // 更新全选状态
  useEffect(() => {
    if (records.length === 0) {
      setAllChecked(false);
      setIndeterminate(false);
      return;
    }

    const checkedCount = selectedIds.length;
    setAllChecked(checkedCount === records.length);
    setIndeterminate(checkedCount > 0 && checkedCount < records.length);
  }, [selectedIds, records]);

  // 处理单个记录的选择
  const handleRecordCheck = (recordId: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, recordId]);
    } else {
      onSelectionChange(selectedIds.filter(id => id !== recordId));
    }
  };

  // 处理全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(records.map(r => r.recordId));
    } else {
      onSelectionChange([]);
    }
  };

  // 获取记录的显示名称（使用第一个字段的值）
  const getRecordName = (record: IRecord): string => {
    const firstField = Object.values(record.fields)[0];
    if (firstField && typeof firstField === 'object' && 'text' in firstField) {
      return (firstField as any).text || '未命名';
    }
    if (typeof firstField === 'string') {
      return firstField || '未命名';
    }
    return '未命名';
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#8f959e' }}>
        暂无记录
      </div>
    );
  }

  return (
    <div className="record-list">
      {/* 全选控制 */}
      <div className="record-list-header">
        <Checkbox
          checked={allChecked}
          indeterminate={indeterminate}
          onChange={(e) => handleSelectAll(e.target.checked ?? false)}
        >
          全选 ({selectedIds.length}/{records.length})
        </Checkbox>
      </div>

      {/* 记录列表 */}
      <div className="record-list-content">
        {records.map(record => (
          <div key={record.recordId} className="record-item">
            <Checkbox
              checked={selectedIds.includes(record.recordId)}
              onChange={(e) => handleRecordCheck(record.recordId, e.target.checked ?? false)}
            >
              {getRecordName(record)}
            </Checkbox>
          </div>
        ))}
      </div>
    </div>
  );
}

