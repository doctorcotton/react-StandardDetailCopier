// 记录辅助函数
import { IRecord, IFieldMeta, bitable } from '@lark-base-open/js-sdk';

/**
 * 获取字段值的文本表示
 */
export function getFieldValueText(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  // 处理对象类型
  if (typeof value === 'object' && value !== null) {
    // 处理包含 text 属性的对象
    if ('text' in value) {
      return value.text || '';
    }

    // 处理数组类型
    if (Array.isArray(value)) {
      if (value.length === 0) return '';
      
      // 如果数组元素是对象且有 text 属性
      const texts = value
        .map(item => {
          if (typeof item === 'object' && item !== null && 'text' in item) {
            return item.text;
          }
          if (typeof item === 'string') {
            return item;
          }
          return String(item);
        })
        .filter(Boolean);
      
      return texts.join(', ');
    }

    // 其他对象类型，尝试转换为字符串
    return JSON.stringify(value);
  }

  // 处理字符串
  if (typeof value === 'string') {
    return value;
  }

  // 处理数字
  if (typeof value === 'number') {
    return String(value);
  }

  // 处理布尔值
  if (typeof value === 'boolean') {
    return value ? '是' : '否';
  }

  return String(value);
}

/**
 * 获取记录的显示名称（使用主字段，即第一列）
 */
export function getRecordDisplayName(record: IRecord, maxFields: number = 1): string {
  const fieldValues = Object.values(record.fields);
  
  if (fieldValues.length === 0) {
    return '未命名记录';
  }

  // 优先使用第一个字段（主字段/第一列）
  const firstFieldText = getFieldValueText(fieldValues[0]);
  if (firstFieldText) {
    return firstFieldText;
  }

  // 如果第一个字段为空，尝试其他字段
  const displayTexts: string[] = [];
  for (let i = 1; i < Math.min(maxFields + 1, fieldValues.length); i++) {
    const text = getFieldValueText(fieldValues[i]);
    if (text) {
      displayTexts.push(text);
    }
  }

  if (displayTexts.length === 0) {
    return '未命名记录';
  }

  return displayTexts.join(' - ');
}

/**
 * 获取记录的主字段值（第一列）
 */
export function getRecordPrimaryValue(record: IRecord): string {
  const fieldValues = Object.values(record.fields);
  if (fieldValues.length === 0) {
    return '未命名记录';
  }
  
  const primaryText = getFieldValueText(fieldValues[0]);
  return primaryText || '未命名记录';
}

/**
 * 异步获取记录的主字段值（使用表格的主字段）
 */
export async function getRecordPrimaryValueAsync(
  tableId: string,
  recordId: string
): Promise<string> {
  try {
    const table = await bitable.base.getTable(tableId);
    
    // 获取表格的所有字段元数据
    const tableFields = await table.getFieldMetaList();
    
    // 优先查找主字段（isPrimary: true），如果没有则使用第一个字段
    let primaryField = tableFields.find(f => (f as any).isPrimary === true);
    if (!primaryField && tableFields.length > 0) {
      // 如果没有主字段标记，使用第一个字段（通常是第一列）
      primaryField = tableFields[0];
    }
    
    if (!primaryField) {
      return '未命名记录';
    }
    
    // 获取记录
    const record = await table.getRecordById(recordId);
    
    // 获取主字段的值
    const value = record.fields[primaryField.id];
    const text = getFieldValueText(value);
    
    if (text) {
      return text;
    }
    
    // 如果主字段值为空，尝试使用记录的第一个字段值
    const fieldValues = Object.values(record.fields);
    if (fieldValues.length > 0) {
      const firstFieldText = getFieldValueText(fieldValues[0]);
      if (firstFieldText) {
        return firstFieldText;
      }
    }
    
    return '未命名记录';
  } catch (error) {
    console.error('获取记录主字段值失败:', error);
    return '未命名记录';
  }
}

/**
 * 获取记录的完整字段信息（用于详情展示）
 * 使用当前视图的字段顺序
 */
export async function getRecordDetails(
  tableId: string,
  recordId: string
): Promise<{ fieldName: string; fieldValue: string }[]> {
  try {
    const table = await bitable.base.getTable(tableId);
    const record = await table.getRecordById(recordId);

    // 获取当前视图
    const view = await table.getActiveView();
    
    // 获取视图中的字段列表（这个顺序就是用户看到的顺序）
    const viewFields = await view.getFieldMetaList();
    
    console.log('视图字段顺序:', viewFields.map(f => f.name));

    const details: { fieldName: string; fieldValue: string }[] = [];

    // 按照视图字段顺序显示
    viewFields.forEach(field => {
      const value = record.fields[field.id];
      const valueText = getFieldValueText(value);
      
      details.push({
        fieldName: field.name,
        fieldValue: valueText || '-'
      });
    });

    return details;
  } catch (error) {
    console.error('获取记录详情失败:', error);
    return [];
  }
}

