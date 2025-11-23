// 空状态组件
import { IllustrationNoContent, IllustrationNoContentDark } from '@douyinfe/semi-illustrations';
import { Empty } from '@douyinfe/semi-ui';

interface EmptyStateProps {
  title?: string;
  description?: string;
  darkMode?: boolean;
}

export default function EmptyState({
  title = '暂无数据',
  description = '请先选择表和记录',
  darkMode = false
}: EmptyStateProps) {
  return (
    <Empty
      image={darkMode ? <IllustrationNoContentDark /> : <IllustrationNoContent />}
      title={title}
      description={description}
      style={{ padding: '40px 0' }}
    />
  );
}

