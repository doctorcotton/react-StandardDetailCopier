import React, { useState, useEffect } from 'react';
import { Checkbox, Space, Spin, Typography, Button, Card, Table, Select } from '@douyinfe/semi-ui';
import { IconEyeOpened } from '@douyinfe/semi-icons';
import { bitable, IRecord, IFieldMeta, FieldType } from '@lark-base-open/js-sdk';

const { Text } = Typography;

interface LinkedRecordSelectorProps {
  tableId: string;
  recordIds: string[];
  value: string[];
  onChange: (selectedIds: string[]) => void;
  loading?: boolean;
}

export default function LinkedRecordSelector({
  tableId,
  recordIds,
  value,
  onChange,
  loading = false
}: LinkedRecordSelectorProps) {
  const [records, setRecords] = useState<IRecord[]>([]);
  const [fields, setFields] = useState<IFieldMeta[]>([]);
  const [displayFields, setDisplayFields] = useState<string[]>([]);
  const [fetchLoading, setFetchLoading] = useState(false);

  // 格式化字段值
  const formatFieldValue = (value: any, fieldType: FieldType): string => {
    if (value === null || value === undefined) {
      return '';
    }

    switch (fieldType) {
      case FieldType.Text:
      case FieldType.Number:
      case FieldType.Phone:
      case FieldType.Url:
      case FieldType.Email:
        return String(value);
      
      case FieldType.SingleSelect:
        return value?.text || String(value);
      
      case FieldType.MultiSelect:
        if (Array.isArray(value)) {
          return value.map((item: any) => item?.text || String(item)).join(', ');
        }
        return String(value);
      
      case FieldType.DateTime:
        return value ? new Date(value).toLocaleString('zh-CN') : '';
      
      case FieldType.Checkbox:
        return value ? '是' : '否';
      
      case FieldType.User:
        if (Array.isArray(value)) {
          return value.map((item: any) => item?.name || String(item)).join(', ');
        }
        return value?.name || String(value);
      
      case FieldType.Attachment:
        if (Array.isArray(value)) {
          return `${value.length} 个附件`;
        }
        return '';
      
      case FieldType.SingleLink:
      case FieldType.DuplexLink:
        if (Array.isArray(value)) {
          return value.map((item: any) => item?.text || '').filter(Boolean).join(', ');
        } else if (value && typeof value === 'object') {
          return value.text || '';
        }
        return '';
      
      default:
        return String(value);
    }
  };

  // 获取记录详情
  useEffect(() => {
    if (!tableId || recordIds.length === 0) {
      setRecords([]);
      return;
    }

    const fetchRecords = async () => {
      try {
        setFetchLoading(true);
        const table = await bitable.base.getTable(tableId);
        
        // 获取字段列表
        const fieldList = await table.getFieldMetaList();
        setFields(fieldList);
        
        // 尝试获取第一个视图的字段顺序
        let visibleFields: string[] = [];
        try {
          const views = await table.getViewMetaList();
          if (views.length > 0) {
            const view = await table.getViewById(views[0].id);
            const viewFields = await view.getFieldMetaList();
            
            visibleFields = viewFields
              .filter(f => ![
                FieldType.Formula,
                FieldType.Lookup,
                FieldType.ModifiedTime,
                FieldType.ModifiedUser,
                FieldType.CreatedTime,
                FieldType.CreatedUser,
                FieldType.AutoNumber
              ].includes(f.type))
              .slice(0, 5)
              .map(f => f.id);
          }
        } catch (error) {
          console.warn('获取视图字段顺序失败，使用默认顺序', error);
        }
        
        // 如果获取视图失败，回退到默认顺序
        if (visibleFields.length === 0) {
          visibleFields = fieldList
            .filter(f => ![
              FieldType.Formula,
              FieldType.Lookup,
              FieldType.ModifiedTime,
              FieldType.ModifiedUser,
              FieldType.CreatedTime,
              FieldType.CreatedUser,
              FieldType.AutoNumber
            ].includes(f.type))
            .slice(0, 5)
            .map(f => f.id);
        }
        
        setDisplayFields(visibleFields);
        
        // 获取记录
        const recordList = await table.getRecords({
          pageSize: 5000
        });

        const filteredRecords = recordList.records.filter(r =>
          recordIds.includes(r.recordId)
        );

        setRecords(filteredRecords);
      } catch (error) {
        console.error('获取关联记录失败:', error);
      } finally {
        setFetchLoading(false);
      }
    };

    fetchRecords();
  }, [tableId, recordIds]);

  // 全选/取消全选
  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onChange(recordIds);
    } else {
      onChange([]);
    }
  };

  // 单个选择
  const handleSelectOne = (recordId: string, checked: boolean) => {
    if (checked) {
      onChange([...value, recordId]);
    } else {
      onChange(value.filter(id => id !== recordId));
    }
  };

  // 构建表格列
  const columns = [
    {
      title: (
        <Checkbox
          checked={value.length === recordIds.length}
          indeterminate={value.length > 0 && value.length < recordIds.length}
          onChange={(e) => handleSelectAll(e.target.checked ?? false)}
        />
      ),
      dataIndex: 'select',
      width: 50,
      fixed: 'left' as const,
      render: (_: any, record: IRecord) => (
        <Checkbox
          checked={value.includes(record.recordId)}
          onChange={(e) => handleSelectOne(record.recordId, e.target.checked ?? false)}
        />
      )
    },
    ...displayFields.map(fieldId => {
      const field = fields.find(f => f.id === fieldId);
      if (!field) return null;
      
      return {
        title: field.name,
        dataIndex: fieldId,
        width: 150,
        render: (_: any, record: IRecord) => {
          const value = record.fields[fieldId];
          const formattedValue = formatFieldValue(value, field.type);
          return (
            <div style={{
              maxWidth: '200px',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }} title={formattedValue}>
              {formattedValue || '-'}
            </div>
          );
        }
      };
    }).filter(Boolean)
  ];

  if (loading || fetchLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '20px' }}>
        <Spin />
        <Text type="tertiary" size="small" style={{ display: 'block', marginTop: '8px' }}>
          加载关联记录中...
        </Text>
      </div>
    );
  }

  if (records.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '20px', color: '#8f959e' }}>
        没有关联记录
      </div>
    );
  }

  // 可选择的字段列表（排除不适合显示的字段）
  const selectableFields = fields.filter(f => ![
    FieldType.Formula,
    FieldType.Lookup,
    FieldType.ModifiedTime,
    FieldType.ModifiedUser,
    FieldType.CreatedTime,
    FieldType.CreatedUser,
    FieldType.AutoNumber
  ].includes(f.type));

  // 应用预设模板
  const applyTemplate = (templateName: string) => {
    let fieldNames: string[] = [];
    
    switch (templateName) {
      case 'standard':
        // 标准模板：标准章节、检测项目、检测方法
        fieldNames = ['标准章节', '检测项目', '检测方法'];
        break;
      case 'all':
        // 全部字段
        setDisplayFields(selectableFields.map(f => f.id));
        return;
      case 'first5':
        // 前5个字段
        setDisplayFields(selectableFields.slice(0, 5).map(f => f.id));
        return;
      default:
        return;
    }
    
    // 根据字段名称查找字段ID
    const fieldIds = fieldNames
      .map(name => fields.find(f => f.name === name)?.id)
      .filter(Boolean) as string[];
    
    if (fieldIds.length > 0) {
      setDisplayFields(fieldIds);
    }
  };

  return (
    <div>
      {/* 字段选择器 */}
      <div style={{ marginBottom: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <Text strong>显示列：</Text>
          <Select
            multiple
            value={displayFields}
            onChange={(v) => setDisplayFields(v as string[])}
            style={{ flex: 1 }}
            placeholder="选择要显示的字段"
            maxTagCount={3}
          >
            {selectableFields.map(field => (
              <Select.Option key={field.id} value={field.id}>
                {field.name}
              </Select.Option>
            ))}
          </Select>
          <Text type="tertiary" size="small">
            已选 {value.length}/{recordIds.length} 条
          </Text>
        </div>
        
        {/* 快速模板 */}
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Text type="tertiary" size="small">快速选择：</Text>
          <Button 
            size="small" 
            type="tertiary"
            onClick={() => applyTemplate('standard')}
          >
            标准模板（章节+项目+方法）
          </Button>
          <Button 
            size="small" 
            type="tertiary"
            onClick={() => applyTemplate('first5')}
          >
            前5列
          </Button>
          <Button 
            size="small" 
            type="tertiary"
            onClick={() => applyTemplate('all')}
          >
            全部列
          </Button>
        </div>
      </div>

      {/* 记录表格 */}
      <div style={{
        border: '1px solid var(--semi-color-border)',
        borderRadius: '6px',
        overflow: 'hidden'
      }}>
        <Table
          columns={columns as any}
          dataSource={records}
          rowKey="recordId"
          pagination={false}
          size="small"
          scroll={{ y: 400 }}
          style={{ width: '100%' }}
          onRow={(record) => ({
            onClick: () => {
              if (record) {
                const isSelected = value.includes(record.recordId);
                handleSelectOne(record.recordId, !isSelected);
              }
            },
            style: {
              cursor: 'pointer'
            }
          })}
        />
      </div>
    </div>
  );
}

