// 记录列表选择器组件（竖向显示，支持视图选择）
import { Radio, RadioGroup, Button, Select, Spin, Modal, Space } from '@douyinfe/semi-ui';
import { IconEyeOpened } from '@douyinfe/semi-icons';
import { IRecord } from '@lark-base-open/js-sdk';
import { useState, useEffect } from 'react';
import { getRecordDetails } from '../utils/recordHelper';
import { getRecordsDisplayNames } from '../utils/viewHelper';
import { useViews } from '../hooks/useViews';

interface RecordListSelectorProps {
  records: IRecord[];
  value?: string;
  onChange: (value: string) => void;
  tableId: string;
  disabled?: boolean;
  loading?: boolean;
  excludeRecordId?: string;
}

export default function RecordListSelector({
  records,
  value,
  onChange,
  tableId,
  disabled = false,
  loading = false,
  excludeRecordId
}: RecordListSelectorProps) {
  const [detailsVisible, setDetailsVisible] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [currentDetails, setCurrentDetails] = useState<{ fieldName: string; fieldValue: string }[]>([]);
  const [currentRecordName, setCurrentRecordName] = useState('');
  
  // 获取视图列表
  const { views, activeViewId, loading: viewsLoading } = useViews(tableId);
  const [selectedViewId, setSelectedViewId] = useState<string>('');
  
  // 记录显示名称映射
  const [recordNames, setRecordNames] = useState<Map<string, string>>(new Map());
  const [namesLoading, setNamesLoading] = useState(false);

  // 初始化选中的视图
  useEffect(() => {
    if (!selectedViewId) {
      if (activeViewId) {
        setSelectedViewId(activeViewId);
      } else if (views.length > 0) {
        setSelectedViewId(views[0].id);
      }
    }
  }, [activeViewId, views, selectedViewId]);

  // 当视图或记录变化时，重新获取显示名称
  useEffect(() => {
    if (!selectedViewId || records.length === 0) {
      setRecordNames(new Map());
      return;
    }

    const loadNames = async () => {
      setNamesLoading(true);
      try {
        const names = await getRecordsDisplayNames(tableId, selectedViewId, records);
        setRecordNames(names);
      } catch (error) {
        console.error('加载记录名称失败:', error);
      } finally {
        setNamesLoading(false);
      }
    };

    loadNames();
  }, [selectedViewId, records, tableId]);

  // 过滤记录
  const filteredRecords = excludeRecordId
    ? records.filter(r => r.recordId !== excludeRecordId)
    : records;

  // 查看详情
  const handleViewDetails = async (record: IRecord) => {
    const displayName = recordNames.get(record.recordId) || '未命名记录';
    setCurrentRecordName(displayName);
    setDetailsVisible(true);
    setDetailsLoading(true);

    try {
      const details = await getRecordDetails(tableId, record.recordId);
      setCurrentDetails(details);
    } catch (error) {
      console.error('获取详情失败:', error);
    } finally {
      setDetailsLoading(false);
    }
  };

  if (loading || viewsLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
      </div>
    );
  }

  if (filteredRecords.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#8f959e' }}>
        暂无可选记录
      </div>
    );
  }

  return (
    <>
      {/* 视图选择器 */}
      {views.length > 0 && (
        <div style={{ marginBottom: '12px' }}>
        <Select
          value={selectedViewId}
          onChange={(value) => setSelectedViewId(value as string)}
          placeholder="选择视图"
          style={{ width: '100%' }}
          prefix="视图："
        >
            {views.map(view => (
              <Select.Option key={view.id} value={view.id}>
                {view.name}
              </Select.Option>
            ))}
          </Select>
        </div>
      )}

      {/* 记录列表 - 竖向显示 */}
      <div className="record-list-selector">
        {namesLoading ? (
          <div style={{ textAlign: 'center', padding: '20px' }}>
            <Spin size="small" />
          </div>
        ) : (
          <RadioGroup
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: '8px' }}
          >
            {filteredRecords.map(record => {
              const displayName = recordNames.get(record.recordId) || '未命名记录';
              return (
                <div 
                  key={record.recordId} 
                  className="record-list-item"
                  onClick={() => !disabled && onChange(record.recordId)}
                  style={{ 
                    cursor: disabled ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center'
                  }}
                >
                  <Radio 
                    value={record.recordId} 
                    style={{ flex: 1, pointerEvents: 'none' }}
                  >
                    {displayName}
                  </Radio>
                  <Button
                    icon={<IconEyeOpened />}
                    size="small"
                    type="tertiary"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleViewDetails(record);
                    }}
                  >
                    详情
                  </Button>
                </div>
              );
            })}
          </RadioGroup>
        )}
      </div>

      {/* 详情弹窗 */}
      <Modal
        title={`记录详情: ${currentRecordName}`}
        visible={detailsVisible}
        onCancel={() => setDetailsVisible(false)}
        footer={
          <Button onClick={() => setDetailsVisible(false)}>
            关闭
          </Button>
        }
        width={600}
      >
        {detailsLoading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <Spin />
          </div>
        ) : (
          <div className="record-details">
            {currentDetails.map((detail, index) => (
              <div key={index} className="detail-row">
                <div className="detail-label">{detail.fieldName}:</div>
                <div className="detail-value">{detail.fieldValue}</div>
              </div>
            ))}
          </div>
        )}
      </Modal>
    </>
  );
}
