// 关联字段辅助函数
import { bitable, FieldType, IFieldMeta } from '@lark-base-open/js-sdk';

/**
 * 获取记录的所有双向关联字段
 * @param tableId 表ID
 * @returns 双向关联字段列表
 */
export async function getLinkFields(tableId: string): Promise<IFieldMeta[]> {
  try {
    const table = await bitable.base.getTable(tableId);
    const fields = await table.getFieldMetaList();
    
    // 筛选出双向关联字段
    const linkFields = fields.filter(field => 
      field.type === FieldType.DuplexLink
    );
    
    return linkFields;
  } catch (error) {
    console.error('获取关联字段失败:', error);
    return [];
  }
}

/**
 * 获取记录在指定关联字段中关联的记录ID列表
 * @param tableId 表ID
 * @param recordId 记录ID
 * @param fieldId 关联字段ID
 * @returns 关联的记录ID列表
 */
export async function getLinkedRecordIds(
  tableId: string,
  recordId: string,
  fieldId: string
): Promise<{ tableId: string; recordIds: string[] }> {
  try {
    console.log('开始获取关联记录:', { tableId, recordId, fieldId });
    
    const table = await bitable.base.getTable(tableId);
    
    // 获取字段值（关联字段的值是一个包含 recordId 的数组）
    const cellValue = await table.getCellValue(fieldId, recordId);
    console.log('关联字段值:', cellValue);
    
    // 获取关联字段的元数据，找到关联的表ID
    const field = await table.getFieldById(fieldId);
    const fieldMeta = await field.getMeta();
    console.log('关联字段元数据:', fieldMeta);
    
    // 关联字段的 property 中包含 tableId
    const linkedTableId = (fieldMeta as any).property?.tableId;
    console.log('关联表ID:', linkedTableId);
    
    if (!linkedTableId) {
      console.error('无法获取关联表ID，字段元数据:', fieldMeta);
      throw new Error('无法获取关联表ID');
    }
    
    // cellValue 可能是多种格式
    let recordIds: string[] = [];
    
    if (Array.isArray(cellValue)) {
      // 格式1: [{ record_id: 'xxx', text: 'xxx' }]
      // 格式2: [{ recordId: 'xxx', text: 'xxx' }]
      // 格式3: ['record_id1', 'record_id2']
      recordIds = cellValue.map((item: any) => {
        if (typeof item === 'string') {
          return item;
        }
        if (typeof item === 'object' && item !== null) {
          return item.record_id || item.recordId || item.id;
        }
        return null;
      }).filter(Boolean) as string[];
    } else if (cellValue && typeof cellValue === 'object') {
      // 格式4: { recordIds: ['xxx', 'yyy'], text: 'xxx' }
      // 这是关联字段的另一种格式
      if ((cellValue as any).recordIds && Array.isArray((cellValue as any).recordIds)) {
        recordIds = (cellValue as any).recordIds;
      } 
      // 格式5: { record_ids: ['xxx', 'yyy'], text: 'xxx' }
      else if ((cellValue as any).record_ids && Array.isArray((cellValue as any).record_ids)) {
        recordIds = (cellValue as any).record_ids;
      }
      // 格式6: 单个对象 { record_id: 'xxx', text: 'xxx' }
      else {
        const id = (cellValue as any).record_id || (cellValue as any).recordId || (cellValue as any).id;
        if (id) {
          recordIds = [id];
        }
      }
    }
    
    console.log('解析出的记录ID列表:', recordIds);
    
    return {
      tableId: linkedTableId,
      recordIds: recordIds
    };
  } catch (error) {
    console.error('获取关联记录失败:', error);
    return { tableId: '', recordIds: [] };
  }
}

/**
 * 复制关联记录并更新关联关系
 * @param sourceTableId 源表ID（关联记录所在的表，如：原料标准明细表）
 * @param sourceRecordIds 要复制的记录ID列表
 * @param mainTableLinkFieldId 主表中的关联字段ID（如：原料标准管理表中的"原材料标准明细"字段）
 * @param targetRecordId 目标记录ID（新的关联目标）
 * @returns 复制结果
 */
export async function copyLinkedRecords(
  sourceTableId: string,
  sourceRecordIds: string[],
  mainTableLinkFieldId: string,
  targetRecordId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  try {
    console.log('\n========== 🚀 开始复制关联记录 ==========');
    console.log('📋 输入参数:', {
      sourceTableId,
      sourceRecordIds,
      mainTableLinkFieldId,
      targetRecordId
    });
    
    if (!sourceRecordIds || sourceRecordIds.length === 0) {
      console.error('❌ 没有要复制的记录');
      return {
        success: false,
        count: 0,
        error: '没有要复制的记录'
      };
    }

    const sourceTable = await bitable.base.getTable(sourceTableId);
    const sourceTableName = await sourceTable.getName();
    console.log('📊 关联表名称:', sourceTableName);
    
    // 获取所有字段
    const fields = await sourceTable.getFieldMetaList();
    console.log('📝 关联表字段总数:', fields.length);
    
    // 找到关联表中的反向关联字段
    console.log('\n🔍 步骤1: 查找反向关联字段');
    console.log('   主表字段ID:', mainTableLinkFieldId);
    
    let backLinkFieldId: string | null = null;
    let backLinkFieldMeta: any = null;
    
    console.log('   开始遍历关联表的所有双向关联字段:');
    for (const field of fields) {
      if (field.type === FieldType.DuplexLink) {
        const property = (field as any).property;
        console.log('   - 检查字段:', {
          fieldId: field.id,
          fieldName: field.name,
          backFieldId: property?.backFieldId,
          multiple: property?.multiple,
          tableId: property?.tableId
        });
        
        // 如果这个字段的 backFieldId 等于主表的字段ID，说明这就是反向字段
        if (property?.backFieldId === mainTableLinkFieldId) {
          backLinkFieldId = field.id;
          backLinkFieldMeta = field;
          console.log('   ✅ 找到匹配的反向关联字段!');
          break;
        }
      }
    }
    
    if (!backLinkFieldId) {
      console.error('\n❌ 无法找到反向关联字段！');
      console.error('主表字段ID:', mainTableLinkFieldId);
      console.error('关联表所有双向关联字段:', fields.filter(f => f.type === FieldType.DuplexLink).map(f => ({
        id: f.id,
        name: f.name,
        backFieldId: (f as any).property?.backFieldId,
        multiple: (f as any).property?.multiple
      })));
      throw new Error('无法找到反向关联字段，请检查字段配置');
    }
    
    const isMultiple = (backLinkFieldMeta as any)?.property?.multiple;
    const linkedMainTableId = (backLinkFieldMeta as any)?.property?.tableId;
    console.log('\n✅ 步骤1完成: 成功找到反向关联字段');
    console.log('   字段ID:', backLinkFieldId);
    console.log('   字段名称:', backLinkFieldMeta?.name);
    console.log('   是否多选:', isMultiple);
    console.log('   关联的主表ID:', linkedMainTableId);
    console.log('   完整属性:', (backLinkFieldMeta as any)?.property);
    
    // 步骤1.5: 获取主表的主键字段（第一列）及目标记录的主键值
    console.log('\n🔍 步骤1.5: 获取主表的主键字段信息');
    let targetRecordPrimaryValue: string = '';
    try {
      const mainTable = await bitable.base.getTable(linkedMainTableId);
      const mainTableFields = await mainTable.getFieldMetaList();
      
      // 获取第一列作为主键字段
      if (mainTableFields.length > 0) {
        const primaryField = mainTableFields[0];
        console.log('   主表主键字段:', {
          id: primaryField.id,
          name: primaryField.name,
          type: primaryField.type
        });
        
        // 获取目标记录的主键值
        const primaryValue = await mainTable.getCellValue(primaryField.id, targetRecordId);
        targetRecordPrimaryValue = String(primaryValue || '');
        console.log('   目标记录主键值:', targetRecordPrimaryValue);
      }
    } catch (e) {
      console.warn('   ⚠️ 获取主键值失败:', e);
    }
    
    // 获取要复制的记录
    console.log('\n📥 步骤2: 获取要复制的记录');
    const recordList = await sourceTable.getRecords({
      pageSize: 5000,
    });
    
    const selectedRecords = recordList.records.filter(record => 
      sourceRecordIds.includes(record.recordId)
    );
    
    console.log('   要复制的记录数:', selectedRecords.length);
    console.log('   记录ID列表:', selectedRecords.map(r => r.recordId));
    
    // 构建新记录
    console.log('\n🔨 步骤3: 构建新记录');
    const newRecords = selectedRecords.map((record, index) => {
      const newFields: any = {};
      
      console.log(`   处理记录 ${index + 1}/${selectedRecords.length}:`, record.recordId);
      
      Object.entries(record.fields).forEach(([fieldId, value]) => {
        const field = fields.find(f => f.id === fieldId);
        
        if (!field) return;
        
        // 跳过不可复制的字段类型
        const skipTypes = [
          FieldType.Formula,
          FieldType.Lookup,
          FieldType.AutoNumber,
          FieldType.ModifiedTime,
          FieldType.ModifiedUser,
          FieldType.CreatedTime,
          FieldType.CreatedUser,
        ];
        
        if (skipTypes.includes(field.type)) {
          return;
        }
        
          // 如果是反向关联字段，跳过原值（避免拷贝来源主记录的关联）
        if (fieldId === backLinkFieldId) {
          return;
        } else if (value !== null && value !== undefined) {
          newFields[fieldId] = value;
        }
      });
        
        // 明确设置反向关联字段指向目标主记录（由系统自动同步到主表）
        if (backLinkFieldId) {
          // ⚠️ 关键：必须使用完整格式！根据实际数据结构：
          // { recordIds: [...], tableId: '...', text: '...', type: 'text' }
          const linkedTableId = (backLinkFieldMeta as any).property?.tableId;
          
          // 注意：单选和多选都使用 recordIds（数组）！
          newFields[backLinkFieldId] = { 
            recordIds: [targetRecordId],
            tableId: linkedTableId,
            text: targetRecordPrimaryValue || '',
            type: 'text'
          };
          
          console.log(`     - 设置反向关联字段:`, {
            fieldId: backLinkFieldId,
            fieldName: backLinkFieldMeta?.name,
            isMultiple,
            targetRecordId,
            linkedTableId,
            text: targetRecordPrimaryValue,
            '完整值': newFields[backLinkFieldId]
          });
        }
      
      return { fields: newFields };
    });
    
    console.log('\n📝 步骤3完成: 新记录构建完成 (已设置反向关联字段)');
    console.log('   新记录数量:', newRecords.length);
    console.log('   反向关联字段将在创建时由系统自动同步到主表');
    console.log('   示例记录字段:', newRecords[0]?.fields);
    
    // 批量写入
    console.log('\n💾 步骤4: 批量写入新记录（系统将自动建立双向关联）');
    let newRecordIds: string[] = [];
    if (newRecords.length > 0) {
      const addResult = await sourceTable.addRecords(newRecords);
      console.log('   ✅ 写入成功！双向关联已由系统自动建立');
      
      if (addResult && Array.isArray(addResult)) {
        newRecordIds = addResult.map((r: any) => r.recordId || r);
        console.log('   新增记录ID列表:', newRecordIds);
      }
    }
    
    // 验证结果
    if (newRecordIds.length > 0) {
      console.log('\n🔍 步骤5: 验证双向关联结果');
      // 验证主表记录是否包含新的明细ID
      try {
        const mainTableId = (backLinkFieldMeta as any)?.property?.tableId;
        if (mainTableId) {
          const mainTable = await bitable.base.getTable(mainTableId);
          const linkFieldValue = await mainTable.getCellValue(mainTableLinkFieldId, targetRecordId);
          
          console.log('   验证目标主记录:', targetRecordId);
          console.log('   关联字段值:', linkFieldValue);
          
          // 检查是否包含第一个新记录ID
          const firstNewId = newRecordIds[0];
          let found = false;
          
          if (linkFieldValue) {
            let ids: string[] = [];
            if (Array.isArray((linkFieldValue as any).recordIds)) {
              ids = (linkFieldValue as any).recordIds;
            } else if (Array.isArray(linkFieldValue)) {
              ids = linkFieldValue.map((item: any) => {
                if (typeof item === 'string') return item;
                return item.id || item.recordId || item.record_id;
              });
            } else if (typeof linkFieldValue === 'object') {
              const singleId = (linkFieldValue as any).id || (linkFieldValue as any).recordId || (linkFieldValue as any).record_id;
              if (singleId) {
                ids = [singleId];
              }
            }
            
            found = ids.includes(firstNewId);
          }
          
          if (found) {
            console.log('   ✅ 最终验证成功！主记录已包含新明细');
          } else {
            console.warn('   ⚠️ 最终验证失败，主记录未包含新明细');
            console.warn('   期望找到:', firstNewId);
            console.warn('   实际关联列表:', linkFieldValue);
          }
        }
      } catch (e) {
        console.warn('   验证过程出错:', e);
      }
    }
    
    console.log('\n========== ✅ 复制完成 ==========\n');
    
    return {
      success: true,
      count: newRecords.length
    };
  } catch (error: any) {
    console.error('\n========== ❌ 复制失败 ==========');
    console.error('错误信息:', error);
    console.error('错误堆栈:', error?.stack);
    console.error('========================================\n');
    return {
      success: false,
      count: 0,
      error: error?.message || '复制失败'
    };
  }
}

