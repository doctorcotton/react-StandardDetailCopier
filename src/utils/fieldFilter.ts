// 字段过滤逻辑
import { FieldType } from '@lark-base-open/js-sdk';

// 不可复制的字段类型
export const SKIP_FIELD_TYPES = [
  FieldType.Formula,        // 公式
  FieldType.Lookup,         // 查找引用
  FieldType.AutoNumber,     // 自动编号
  FieldType.ModifiedTime,   // 修改时间
  FieldType.ModifiedUser,   // 修改人
  FieldType.CreatedTime,    // 创建时间
  FieldType.CreatedUser,    // 创建人
];

// 判断字段是否可复制
export function isFieldCopyable(fieldType: FieldType): boolean {
  return !SKIP_FIELD_TYPES.includes(fieldType);
}

// 过滤可复制的字段
export function filterCopyableFields(fields: any[]): any[] {
  return fields.filter(field => isFieldCopyable(field.type));
}

