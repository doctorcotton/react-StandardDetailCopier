import './App.css';
import { useState, useEffect } from 'react';
import { Button, Card, Toast, Divider, Typography, Space, Tag } from '@douyinfe/semi-ui';
import { IconCopy, IconArrowRight, IconLink, IconCheckList } from '@douyinfe/semi-icons';
import { useTables } from './hooks/useTables';
import { useTableRecords } from './hooks/useTableRecords';
import { useLinkFields, useLinkedRecords } from './hooks/useLinkFields';
import TableSelector from './components/TableSelector';
import RecordListSelector from './components/RecordListSelector';
import LinkFieldSelector from './components/LinkFieldSelector';
import LinkedRecordSelector from './components/LinkedRecordSelector';
import EmptyState from './components/EmptyState';
import { copyLinkedRecords } from './utils/linkHelper';
import { getRecordDisplayName, getRecordPrimaryValueAsync } from './utils/recordHelper';

const { Title, Text } = Typography;

export default function App() {
  // 获取所有表列表
  const { tables, activeTableId, loading: tablesLoading } = useTables();
  
  // 主表ID（原料标准管理表）
  const [mainTableId, setMainTableId] = useState<string>('');
  
  // 源记录ID（要复制关联记录的源记录）
  const [sourceRecordId, setSourceRecordId] = useState<string>('');
  
  // 选中的关联字段ID
  const [linkFieldId, setLinkFieldId] = useState<string>('');
  
  // 目标记录ID（要复制到的目标记录）
  const [targetRecordId, setTargetRecordId] = useState<string>('');
  
  // 选中的关联记录ID列表（用于多选）
  const [selectedLinkedRecordIds, setSelectedLinkedRecordIds] = useState<string[]>([]);
  
  // 复制状态
  const [copying, setCopying] = useState(false);
  
  // 源记录名称
  const [sourceRecordName, setSourceRecordName] = useState<string>('');

  // 获取主表的记录列表
  const { records: mainTableRecords, loading: recordsLoading } = useTableRecords(mainTableId);
  
  // 获取主表的关联字段列表
  const { linkFields, loading: linkFieldsLoading } = useLinkFields(mainTableId);
  
  // 获取源记录的关联记录信息
  const { linkedTableId, linkedRecordIds, loading: linkedRecordsLoading } = useLinkedRecords(
    mainTableId,
    sourceRecordId,
    linkFieldId
  );

  // 初始化主表为当前激活的表
  useEffect(() => {
    if (activeTableId && !mainTableId) {
      setMainTableId(activeTableId);
    }
  }, [activeTableId, mainTableId]);

  // 处理主表变化
  const handleMainTableChange = (tableId: string) => {
    setMainTableId(tableId);
    // 重置所有选择
    setSourceRecordId('');
    setLinkFieldId('');
    setTargetRecordId('');
  };

  // 处理源记录变化
  const handleSourceRecordChange = (recordId: string) => {
    setSourceRecordId(recordId);
    // 重置关联字段和目标记录
    setLinkFieldId('');
    setTargetRecordId('');
    // 重置源记录名称
    setSourceRecordName('');
  };

  // 处理关联字段变化
  const handleLinkFieldChange = (fieldId: string) => {
    setLinkFieldId(fieldId);
    // 重置目标记录和选中的关联记录
    setTargetRecordId('');
    setSelectedLinkedRecordIds([]);
  };

  // 当关联记录加载完成后，默认全选
  useEffect(() => {
    if (linkedRecordIds.length > 0 && selectedLinkedRecordIds.length === 0) {
      setSelectedLinkedRecordIds(linkedRecordIds);
    }
  }, [linkedRecordIds]);

  // 获取源记录名称
  useEffect(() => {
    if (!mainTableId || !sourceRecordId) {
      setSourceRecordName('');
      return;
    }

    const loadRecordName = async () => {
      try {
        const name = await getRecordPrimaryValueAsync(mainTableId, sourceRecordId);
        setSourceRecordName(name);
      } catch (error) {
        console.error('获取源记录名称失败:', error);
        setSourceRecordName('未命名记录');
      }
    };

    loadRecordName();
  }, [mainTableId, sourceRecordId]);

  // 执行复制
  const handleCopy = async () => {
    if (!mainTableId) {
      Toast.warning('请选择主表');
      return;
    }
    if (!sourceRecordId) {
      Toast.warning('请选择源记录');
      return;
    }
    if (!linkFieldId) {
      Toast.warning('请选择关联字段');
      return;
    }
    if (!targetRecordId) {
      Toast.warning('请选择目标记录');
      return;
    }
    if (!linkedTableId || linkedRecordIds.length === 0) {
      Toast.warning('源记录没有关联记录可复制');
      return;
    }
    if (selectedLinkedRecordIds.length === 0) {
      Toast.warning('请至少选择一条要复制的记录');
      return;
    }

    try {
      setCopying(true);
      
      const result = await copyLinkedRecords(
        linkedTableId,
        selectedLinkedRecordIds,  // 使用选中的记录ID列表
        linkFieldId,
        targetRecordId
      );
      
      if (result.success) {
        Toast.success(`成功复制 ${result.count} 条关联记录！`);
        // 重置选择
        setSourceRecordId('');
        setLinkFieldId('');
        setTargetRecordId('');
      } else {
        Toast.error(`复制失败: ${result.error || '未知错误'}`);
      }
    } catch (error: any) {
      Toast.error(`复制失败: ${error?.message || '未知错误'}`);
    } finally {
      setCopying(false);
    }
  };

  // 获取源记录的显示名称（使用主字段）
  const getRecordName = (recordId: string) => {
    // 如果是源记录，使用已获取的名称
    if (recordId === sourceRecordId && sourceRecordName) {
      return sourceRecordName;
    }
    // 其他记录使用同步方法
    const record = mainTableRecords.find(r => r.recordId === recordId);
    if (!record) return '';
    return getRecordDisplayName(record, 1);
  };

  // 获取关联字段名称
  const getLinkFieldName = (fieldId: string) => {
    const field = linkFields.find(f => f.id === fieldId);
    return field?.name || '';
  };

  return (
    <main className="app-container">
      {/* 标题区 */}
      <div className="app-header">
        <div className="header-icon-wrapper">
          <IconCopy />
        </div>
        <div className="header-content">
          <Title heading={4} style={{ margin: 0 }}>
            双向关联记录一键复制
          </Title>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 6 }}>
            <Text type="tertiary" size="small">
              高效复制记录并维持双向关联关系
            </Text>
            <Divider layout="vertical" margin="8px" />
            <Text type="tertiary" size="small">
              开发者 @史海鹏
            </Text>
          </div>
        </div>
      </div>

      {/* 步骤1: 选择主表 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="step-icon">1</span>
            <span>选择主表</span>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: '24px' }}
        style={{ marginBottom: '36px' }}
      >
        <div className="section-content">
          <div className="form-item">
            <Text strong>选择主表（如：原料标准管理）</Text>
            <TableSelector
              tables={tables}
              value={mainTableId}
              onChange={handleMainTableChange}
              placeholder="请选择主表"
              disabled={tablesLoading}
            />
          </div>
        </div>
      </Card>

      {/* 步骤2: 选择源记录 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="step-icon">2</span>
            <span>选择源记录</span>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: '24px' }}
        style={{ marginBottom: '36px' }}
      >
        <div className="section-content">
          {mainTableId ? (
            <div className="form-item">
              <Text strong>选择要复制关联记录的源记录</Text>
              <RecordListSelector
                records={mainTableRecords}
                value={sourceRecordId}
                onChange={handleSourceRecordChange}
                tableId={mainTableId}
                disabled={recordsLoading || !mainTableId}
                loading={recordsLoading}
              />
            </div>
          ) : (
            <EmptyState 
              title="请先选择主表"
              description="选择主表后才能选择记录"
            />
          )}
        </div>
      </Card>

      {/* 步骤3: 选择关联字段 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="step-icon">3</span>
            <span>选择关联字段</span>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: '24px' }}
        style={{ marginBottom: '36px' }}
      >
        <div className="section-content">
          {sourceRecordId ? (
            <>
              {linkFields.length > 0 ? (
                <>
                  <div className="form-item">
                    <Text strong>选择要复制的双向关联字段</Text>
                    <LinkFieldSelector
                      fields={linkFields}
                      value={linkFieldId}
                      onChange={handleLinkFieldChange}
                      placeholder="请选择关联字段（如：原材料标准明细）"
                      disabled={linkFieldsLoading || !sourceRecordId}
                      loading={linkFieldsLoading}
                    />
                  </div>

                   {linkFieldId && linkedRecordIds.length > 0 && (
                    <>
                      <div className="info-tip">
                        <Space>
                          <Text type="tertiary" size="small">
                            💡 检测到 <Tag color="blue">{linkedRecordIds.length}</Tag> 条关联记录，默认全选
                          </Text>
                        </Space>
                      </div>

                      <div className="form-item" style={{ marginTop: '16px' }}>
                        <Text strong>选择要复制的记录（默认全选）</Text>
                        <LinkedRecordSelector
                          tableId={linkedTableId}
                          recordIds={linkedRecordIds}
                          value={selectedLinkedRecordIds}
                          onChange={setSelectedLinkedRecordIds}
                          loading={linkedRecordsLoading}
                        />
                      </div>
                    </>
                  )}

                  {linkFieldId && linkedRecordIds.length === 0 && (
                    <div className="info-tip" style={{ borderLeftColor: '#ff7d00' }}>
                      <Text type="warning" size="small">
                        ⚠️ 源记录在该关联字段中没有关联记录（0条）
                      </Text>
                    </div>
                  )}
                </>
              ) : (
                <div className="info-tip" style={{ borderLeftColor: '#ff7d00' }}>
                  <Text type="warning" size="small">
                    ⚠️ 该表没有双向关联字段，无法使用此功能
                  </Text>
                </div>
              )}
            </>
          ) : (
            <EmptyState 
              title="请先选择源记录"
              description="选择源记录后才能选择关联字段"
            />
          )}
        </div>
      </Card>

      {/* 步骤4: 选择目标记录 */}
      <Card 
        title={
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span className="step-icon">4</span>
            <span>选择目标记录</span>
          </div>
        }
        bordered={false}
        bodyStyle={{ padding: '24px' }}
        style={{ marginBottom: '36px' }}
      >
        <div className="section-content">
          {linkFieldId ? (
            <>
              <div className="form-item">
                <Text strong>选择要复制到的目标记录</Text>
                <RecordListSelector
                  records={mainTableRecords}
                  value={targetRecordId}
                  onChange={setTargetRecordId}
                  tableId={mainTableId}
                  excludeRecordId={sourceRecordId}
                  disabled={recordsLoading}
                  loading={recordsLoading}
                />
              </div>

               {selectedLinkedRecordIds.length > 0 && (
                <div className="info-tip">
                  <Text type="tertiary" size="small">
                    💡 将从 <strong>{getRecordName(sourceRecordId)}</strong> 的 
                    <strong> {getLinkFieldName(linkFieldId)} </strong> 
                    复制 <Tag color="blue">{selectedLinkedRecordIds.length}</Tag> 条记录（共{linkedRecordIds.length}条），
                    新记录的关联将指向目标记录
                  </Text>
          </div>
              )}
            </>
          ) : (
            <EmptyState 
              title="请先选择关联字段"
              description="选择关联字段后才能选择目标记录"
            />
          )}
          </div>
      </Card>

      {/* 操作区 */}
      <div className="action-buttons">
        <Button
          theme="solid"
          type="primary"
          size="large"
          icon={<IconArrowRight />}
          iconPosition="right"
          onClick={handleCopy}
          loading={copying}
          style={{ borderRadius: '24px' }}
           disabled={
            !mainTableId || 
            !sourceRecordId || 
            !linkFieldId || 
            !targetRecordId || 
            selectedLinkedRecordIds.length === 0
          }
        >
          开始复制 {selectedLinkedRecordIds.length > 0 && `(${selectedLinkedRecordIds.length} 条)`}
        </Button>
      </div>
    </main>
  );
}
