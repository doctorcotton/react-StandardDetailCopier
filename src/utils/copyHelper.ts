// 复制记录辅助函数
import { bitable } from '@lark-base-open/js-sdk';
import { isFieldCopyable } from './fieldFilter';

export interface CopyResult {
  success: boolean;
  count: number;
  error?: string;
}

/**
 * 复制记录从源表到目标表
 * @param sourceTableId 源表ID
 * @param targetTableId 目标表ID
 * @param recordIds 要复制的记录ID列表
 * @returns 复制结果
 */
export async function copyRecords(
  sourceTableId: string,
  targetTableId: string,
  recordIds: string[]
): Promise<CopyResult> {
  try {
    if (!recordIds || recordIds.length === 0) {
      return {
        success: false,
        count: 0,
        error: '没有选择要复制的记录'
      };
    }

    // 1. 获取源表和目标表
    const sourceTable = await bitable.base.getTable(sourceTableId);
    const targetTable = await bitable.base.getTable(targetTableId);

    // 2. 获取源表字段信息
    const sourceFields = await sourceTable.getFieldMetaList();
    
    // 3. 获取目标表字段信息
    const targetFields = await targetTable.getFieldMetaList();
    
    // 4. 建立字段映射（按字段名称匹配）
    const fieldMapping = new Map<string, string>();
    sourceFields.forEach(sourceField => {
      // 跳过不可复制的字段
      if (!isFieldCopyable(sourceField.type)) return;
      
      // 在目标表中查找同名且可复制的字段
      const targetField = targetFields.find(
        tf => tf.name === sourceField.name && isFieldCopyable(tf.type)
      );
      
      if (targetField) {
        fieldMapping.set(sourceField.id, targetField.id);
      }
    });

    console.log('字段映射:', fieldMapping);

    // 5. 批量读取源记录
    const recordList = await sourceTable.getRecords({
      pageSize: recordIds.length,
    });

    // 过滤出选中的记录
    const selectedRecords = recordList.records.filter(record => 
      recordIds.includes(record.recordId)
    );

    // 6. 转换记录数据
    const newRecords = selectedRecords.map(record => {
      const newFields: any = {};
      
      Object.entries(record.fields).forEach(([fieldId, value]) => {
        const targetFieldId = fieldMapping.get(fieldId);
        if (targetFieldId && value !== null && value !== undefined) {
          newFields[targetFieldId] = value;
        }
      });
      
      return { fields: newFields };
    });

    console.log('准备复制的记录:', newRecords);

    // 7. 批量写入目标表
    if (newRecords.length > 0) {
      await targetTable.addRecords(newRecords);
    }

    return {
      success: true,
      count: newRecords.length
    };
  } catch (error: any) {
    console.error('复制记录失败:', error);
    return {
      success: false,
      count: 0,
      error: error?.message || '复制失败'
    };
  }
}

