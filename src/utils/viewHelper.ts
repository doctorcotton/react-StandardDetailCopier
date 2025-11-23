// 视图辅助函数
import { bitable, IRecord } from '@lark-base-open/js-sdk';
import { getFieldValueText } from './recordHelper';

/**
 * 根据视图获取记录的显示名称（前3个字段）
 */
export async function getRecordDisplayNameByView(
  tableId: string,
  viewId: string,
  record: IRecord
): Promise<string> {
  try {
    const table = await bitable.base.getTable(tableId);
    const view = await table.getViewById(viewId);
    
    // 获取视图的字段列表（按视图顺序）
    const viewFields = await view.getFieldMetaList();
    
    console.log('视图字段顺序:', viewFields.map(f => ({ id: f.id, name: f.name })));
    console.log('记录字段值:', record.fields);
    
    // 获取前3个字段的值
    const displayTexts: string[] = [];
    for (let i = 0; i < Math.min(3, viewFields.length); i++) {
      const field = viewFields[i];
      const value = record.fields[field.id];
      const text = getFieldValueText(value);
      
      console.log(`字段${i + 1}:`, {
        fieldId: field.id,
        fieldName: field.name,
        value,
        text
      });
      
      if (text) {
        displayTexts.push(text);
      }
    }

    if (displayTexts.length === 0) {
      return '未命名记录';
    }

    const result = displayTexts.join(' - ');
    console.log('最终显示名称:', result);
    return result;
  } catch (error) {
    console.error('获取记录显示名称失败:', error);
    return '未命名记录';
  }
}

/**
 * 批量获取记录的显示名称（优先使用主字段/第一列）
 */
export async function getRecordsDisplayNames(
  tableId: string,
  viewId: string,
  records: IRecord[]
): Promise<Map<string, string>> {
  const nameMap = new Map<string, string>();
  
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
    
    console.log('主字段信息:', primaryField ? {
      id: primaryField.id,
      name: primaryField.name,
      isPrimary: (primaryField as any).isPrimary
    } : '未找到主字段');
    
    for (const record of records) {
      let displayName = '未命名记录';
      
      // 优先使用主字段的值
      if (primaryField) {
        const value = record.fields[primaryField.id];
        const text = getFieldValueText(value);
        if (text) {
          displayName = text;
        }
      }
      
      // 如果主字段为空，尝试使用记录的第一个字段值
      if (displayName === '未命名记录') {
        const fieldValues = Object.values(record.fields);
        if (fieldValues.length > 0) {
          const firstFieldText = getFieldValueText(fieldValues[0]);
          if (firstFieldText) {
            displayName = firstFieldText;
          }
        }
      }
      
      nameMap.set(record.recordId, displayName);
    }
    
    console.log('记录显示名称映射:', Object.fromEntries(nameMap));
  } catch (error) {
    console.error('批量获取记录显示名称失败:', error);
    // 如果出错，回退到使用记录的第一个字段值
    for (const record of records) {
      const fieldValues = Object.values(record.fields);
      const displayName = fieldValues.length > 0 
        ? getFieldValueText(fieldValues[0]) || '未命名记录'
        : '未命名记录';
      nameMap.set(record.recordId, displayName);
    }
  }
  
  return nameMap;
}

