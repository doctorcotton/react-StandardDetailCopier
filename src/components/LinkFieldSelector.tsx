// 关联字段选择器组件
import { Select } from '@douyinfe/semi-ui';
import { IFieldMeta } from '@lark-base-open/js-sdk';

interface LinkFieldSelectorProps {
  fields: IFieldMeta[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

export default function LinkFieldSelector({
  fields,
  value,
  onChange,
  placeholder = '请选择关联字段',
  disabled = false,
  loading = false
}: LinkFieldSelectorProps) {
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
      {fields.map(field => (
        <Select.Option key={field.id} value={field.id}>
          {field.name}
        </Select.Option>
      ))}
    </Select>
  );
}

