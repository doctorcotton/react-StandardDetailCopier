// 表选择器组件
import { Select } from '@douyinfe/semi-ui';
import { ITableMeta } from '@lark-base-open/js-sdk';

interface TableSelectorProps {
  tables: ITableMeta[];
  value?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  excludeTableId?: string; // 排除的表ID（用于目标表选择时排除源表）
  disabled?: boolean;
}

export default function TableSelector({
  tables,
  value,
  onChange,
  placeholder = '请选择表',
  excludeTableId,
  disabled = false
}: TableSelectorProps) {
  // 过滤表列表
  const filteredTables = excludeTableId
    ? tables.filter(table => table.id !== excludeTableId)
    : tables;

  return (
    <Select
      value={value}
      onChange={(val) => onChange(val as string)}
      placeholder={placeholder}
      style={{ width: '100%' }}
      disabled={disabled}
    >
      {filteredTables.map(table => (
        <Select.Option key={table.id} value={table.id}>
          {table.name}
        </Select.Option>
      ))}
    </Select>
  );
}

