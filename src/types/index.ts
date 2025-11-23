// 全局类型定义
import { IRecord, ITableMeta, FieldType } from '@lark-base-open/js-sdk';

export interface TableInfo extends ITableMeta {
  id: string;
  name: string;
}

export interface RecordInfo extends IRecord {
  recordId: string;
  fields: Record<string, any>;
}

export interface CopyConfig {
  sourceTableId: string;
  targetTableId: string;
  recordIds: string[];
}

export interface FieldMapping {
  sourceFieldId: string;
  targetFieldId: string;
  fieldName: string;
  fieldType: FieldType;
}

export { FieldType };

