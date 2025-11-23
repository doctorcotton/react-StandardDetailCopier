// 记录选择器组件
import { Select } from '@douyinfe/semi-ui';
import { IRecord } from '@lark-base-open/js-sdk';

interface RecordSelectorProps {
  records: IRecord[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

/**
 * 获取记录的显示名称（使用第一个字段的值）
 */
function getRecordDisplayName(record: IRecord): string {
  const firstField = Object.values(record.fields)[0];
  
  if (!firstField) {
    return '未命名记录';
  }
  
  // 处理不同类型的字段值
  if (typeof firstField === 'object' && firstField !== null) {
    if ('text' in firstField) {
      return (firstField as any).text || '未命名记录';
    }
    if (Array.isArray(firstField) && firstField.length > 0) {
      const first = firstField[0];
      if (typeof first === 'object' && 'text' in first) {
        return first.text || '未命名记录';
      }
    }
  }
  
  if (typeof firstField === 'string') {
    return firstField || '未命名记录';
  }
  
  if (typeof firstField === 'number') {
    return String(firstField);
  }
  
  return '未命名记录';
}

export default function RecordSelector({
  records,
  value,
  onChange,
  placeholder = '请选择记录',
  disabled = false,
  loading = false
}: RecordSelectorProps) {
  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as string)}
      placeholder={placeholder}
      style={{ width: '100%' }}
      disabled={disabled}
      loading={loading}
      filter
      showClear
    >
      {records.map(record => (
        <Select.Option key={record.recordId} value={record.recordId}>
          {getRecordDisplayName(record)}
        </Select.Option>
      ))}
    </Select>
  );
}

