import React, { useMemo, useState } from 'react';
import { ChevronRight, HelpCircle, Plus, RefreshCw, Settings as SettingsIcon, X } from 'lucide-react';
import PlatformLogo from '../components/common/PlatformLogo.jsx';
import { useToast } from '../components/common/Toast.jsx';
import { settings } from '../data/mockData.js';

const platformCards = [
  { platform: 'Amazon', status: '已连接', note: '最后同步：1分钟前' },
  { platform: 'TikTok Shop', status: '已连接', note: '最后同步：3分钟前' },
  { platform: 'Shopee', status: '已连接', note: '最后同步：3分钟前' },
  { platform: 'eBay', status: '已断开', note: '断开连接' },
  { platform: 'Shopify', status: '待授权', note: '未授权' },
];

const slaRules = [
  { rule: '缺货导致订单取消', threshold: '>5单/日', severity: '高', responseLimit: '30分钟' },
  { rule: '物流延误', threshold: '>48小时', severity: '中', responseLimit: '2小时' },
  { rule: '地址异常', threshold: '>10单/日', severity: '中', responseLimit: '2小时' },
  { rule: '退款处理超时', threshold: '>24小时', severity: '低', responseLimit: '8小时' },
];

const aiSettingRows = [
  { key: 'enableSuggestion', title: '启用AI建议', description: 'AI将基于历史数据生成处理建议' },
  { key: 'requireManualConfirmForHighRisk', title: '高风险操作需人工确认', description: '涉及库存、价格、退款等操作需人工审核' },
  { key: 'lowConfidencePromptOnly', title: '低置信度仅提示不执行', description: '置信度低于阈值时仅给出提示不自动执行' },
];

const notificationRows = [
  { key: 'email', title: '邮件通知', description: '异常报警、任务提醒等邮件通知' },
  { key: 'systemMessage', title: '系统消息', description: '站内消息提醒' },
];

function SettingsCard({ title, action, children, className = '' }) {
  return (
    <section className={`overflow-hidden rounded-[14px] border border-[#E3E9F3] bg-white shadow-[var(--shadow-card)] ${className}`}>
      <div className="flex h-[72px] items-center justify-between px-5">
        <h2 className="text-[20px] font-semibold text-[#111827]">{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}

function statusClasses(status) {
  if (status === '已连接') return 'bg-[#DDFBF0] text-[#16B989]';
  if (status === '已断开') return 'bg-[#FFE7E7] text-[#F04438]';
  return 'bg-[#FFF3E3] text-[#FF7A00]';
}

function dotClasses(status) {
  if (status === '已连接' || status === '成功') return 'bg-[#25C39A]';
  if (status === '已断开') return 'bg-[#FF2E2E]';
  return 'bg-[#FF7A00]';
}

function severityClasses(severity) {
  if (severity === '高') return 'bg-[#FFE7EA] text-[#F04438]';
  if (severity === '中') return 'bg-[#FFF2E8] text-[#FF7A00]';
  return 'bg-[#DDFBF0] text-[#16B989]';
}

function Toggle({ checked, onChange, label }) {
  return (
    <button
      aria-label={label}
      aria-pressed={checked}
      className={`relative shrink-0 rounded-full transition-colors ${checked ? 'bg-[#2F7BFF]' : 'bg-[#D7DEE9]'}`}
      style={{ width: 54, height: 28 }}
      onClick={onChange}
      type="button"
    >
      <span
        className="absolute rounded-full bg-white shadow-[0_2px_6px_rgba(28,39,71,0.18)] transition-transform"
        style={{ width: 22, height: 22, top: 3, left: 3, transform: checked ? 'translateX(26px)' : 'translateX(0)' }}
      />
    </button>
  );
}

function ConnectModal({ onClose }) {
  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-[#12203A]/30">
      <div className="w-[420px] rounded-[14px] bg-white p-5 shadow-[0_20px_60px_rgba(20,33,61,0.18)]">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[#1D273B]">新增平台连接</h3>
            <p className="mt-1 text-sm text-[#8A98B3]">选择平台后将进入授权流程。</p>
          </div>
          <button aria-label="关闭弹窗" className="rounded-[8px] p-1.5 text-[#8A98B3] hover:bg-[#F3F6FB]" onClick={onClose} type="button">
            <X className="h-5 w-5" />
          </button>
        </div>
        <div className="space-y-2">
          {['Amazon', 'TikTok Shop', 'Shopee', 'eBay', 'Shopify'].map((platform) => (
            <button
              className="flex h-12 w-full items-center justify-between rounded-[10px] border border-[#E6EAF2] px-3 text-left hover:border-[#2F7BFF] hover:bg-[#F5F9FF]"
              key={platform}
              onClick={onClose}
              type="button"
            >
              <PlatformLogo platform={platform} />
              <ChevronRight className="h-4 w-4 text-[#8A98B3]" />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function Settings() {
  const { showToast } = useToast();
  const [connections, setConnections] = useState(platformCards);
  const [aiSettings, setAiSettings] = useState({
    enableSuggestion: settings.aiSettings.enableSuggestion,
    requireManualConfirmForHighRisk: settings.aiSettings.requireManualConfirmForHighRisk,
    lowConfidencePromptOnly: settings.aiSettings.lowConfidencePromptOnly,
  });
  const [notificationSettings, setNotificationSettings] = useState({
    email: settings.notificationSettings.email,
    systemMessage: settings.notificationSettings.systemMessage,
  });
  const [showConnectModal, setShowConnectModal] = useState(false);
  const stores = useMemo(() => settings.storeSyncStatus.slice(0, 7), []);

  const authorizeShopify = () => {
    setConnections((current) =>
      current.map((item) =>
        item.platform === 'Shopify' ? { ...item, status: '已连接', note: '最后同步：刚刚' } : item,
      ),
    );
    showToast({ message: 'Shopify 已连接' });
  };

  const showActionToast = (action) => {
    showToast({ message: `${action}操作已触发`, type: 'info' });
  };

  return (
    <div className="flex h-[calc(100vh-104px)] min-h-[720px] flex-col gap-4 overflow-hidden">
      <div className="flex shrink-0 items-center justify-between">
        <h1 className="text-[24px] font-semibold tracking-[-0.01em] text-[#111827]">系统设置</h1>
        <button
          className="flex h-10 items-center gap-2 rounded-[8px] bg-[#2F7BFF] px-5 text-sm font-medium text-white shadow-[0_8px_16px_rgba(47,123,255,0.22)]"
          onClick={() => showToast({ message: '设置已保存' })}
          type="button"
        >
          <SettingsIcon className="h-4 w-4" />
          保存设置
        </button>
      </div>

      <div className="flex min-h-0 flex-1 gap-4">
        <div className="grid min-h-0 min-w-0 grid-rows-[400px_1fr] gap-4" style={{ flex: '0 0 62%' }}>
          <SettingsCard
            title="平台连接"
            action={
              <div className="flex items-center gap-3">
                <button className="flex h-10 items-center gap-2 rounded-[8px] bg-[#2F7BFF] px-4 text-sm font-medium text-white" onClick={() => setShowConnectModal(true)} type="button">
                  <Plus className="h-4 w-4" />
                  新增连接
                </button>
                <button className="flex items-center gap-1 text-sm font-medium text-[#2F7BFF]" type="button">
                  <HelpCircle className="h-4 w-4" />
                  连接帮助
                </button>
              </div>
            }
          >
            <div className="px-5 pb-5">
              <p className="-mt-2 mb-5 text-sm text-[#8A98B3]">管理并连接您的电商平台</p>
              <div className="grid grid-cols-5 gap-3">
                {connections.map((item) => (
                  <article className="flex h-[246px] flex-col items-center rounded-[12px] border border-[#E1E6EF] bg-white px-4 py-5" key={item.platform}>
                    <PlatformLogo platform={item.platform} showName={false} size="lg" />
                    <div className="mt-3 text-sm font-semibold text-[#1D273B]">{item.platform}</div>
                    <div className="mt-3 flex items-center gap-2">
                      <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(item.status)}`} />
                      <span className={`rounded-full px-3 py-1 text-xs font-medium ${statusClasses(item.status)}`}>{item.status}</span>
                    </div>
                    <div className="mt-4 h-5 whitespace-nowrap text-xs text-[#7A879B]">{item.note}</div>
                    <button
                      className={`mt-auto h-10 w-full rounded-[10px] border text-sm font-medium ${
                        item.platform === 'Shopify' && item.status !== '已连接'
                          ? 'border-[#2F7BFF] text-[#2F7BFF]'
                          : 'border-[#9AA5B5] text-[#5F6B7A]'
                      }`}
                      onClick={item.platform === 'Shopify' && item.status !== '已连接' ? authorizeShopify : () => showActionToast('查看详情')}
                      type="button"
                    >
                      {item.platform === 'Shopify' && item.status !== '已连接' ? '去授权' : '查看详情'}
                    </button>
                  </article>
                ))}
              </div>
            </div>
          </SettingsCard>

          <SettingsCard
            title="已连接店铺"
            action={
              <button className="flex h-10 items-center gap-2 rounded-[8px] bg-[#2F7BFF] px-4 text-sm font-medium text-white" onClick={() => showToast({ message: '同步数据已刷新', type: 'info' })} type="button">
                <RefreshCw className="h-4 w-4" />
                刷新数据
              </button>
            }
            className="min-h-0"
          >
            <div className="min-h-0 overflow-hidden">
              <table className="w-full text-left">
                <thead className="bg-[#FAFBFD] text-sm font-semibold text-[#6F7F98]">
                  <tr>
                    <th className="px-5 py-4">店铺名称</th>
                    <th className="px-4 py-4">平台</th>
                    <th className="px-4 py-4">区域</th>
                    <th className="px-4 py-4">同步状态</th>
                    <th className="px-4 py-4">最近同步时间</th>
                    <th className="px-4 py-4">操作</th>
                  </tr>
                </thead>
                <tbody className="text-sm text-[#263246]">
                  {stores.map((store) => (
                    <tr className="h-[52px] border-t border-[#E3E9F3]" key={`${store.storeName}-${store.platform}`}>
                      <td className="px-5 font-medium">{store.storeName}</td>
                      <td className="px-4"><PlatformLogo platform={store.platform} showName={false} size="sm" /></td>
                      <td className="px-4">{store.region}</td>
                      <td className="px-4">
                        <span className="inline-flex items-center gap-2">
                          <span className={`h-2.5 w-2.5 rounded-full ${dotClasses(store.syncStatus)}`} />
                          <span className={store.syncStatus === '延迟' ? 'text-[#FF7A00]' : 'text-[#16B989]'}>{store.syncStatus}</span>
                        </span>
                      </td>
                      <td className="px-4">{store.lastSyncAt}</td>
                      <td className="px-4">
                        <div className="flex gap-5 text-[#2F7BFF]">
                          <button onClick={() => showActionToast('查看')} type="button">查看</button>
                          <button onClick={() => showActionToast('编辑')} type="button">编辑</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="flex items-center justify-end gap-5 border-t border-[#E3E9F3] px-5 py-3 text-sm text-[#7889A8]">
                <span>共 12 条</span>
                <button className="text-[#8A98B3]" type="button">‹</button>
                <button className="h-8 w-8 rounded-[8px] bg-[#2F7BFF] text-white" type="button">1</button>
                <button className="h-8 w-8 rounded-[8px] text-[#5F6B7A]" type="button">2</button>
                <button className="text-[#1D273B]" type="button">›</button>
              </div>
            </div>
          </SettingsCard>
        </div>

        <div className="grid min-h-0 min-w-0 flex-1 grid-rows-[270px_1fr_1fr] gap-4">
          <SettingsCard title="SLA规则" action={<button className="text-sm font-medium text-[#2F7BFF]" onClick={() => showActionToast('编辑')} type="button">编辑</button>}>
            <table className="w-full text-left">
              <thead className="bg-[#FAFBFD] text-sm font-semibold text-[#6F7F98]">
                <tr>
                  <th className="px-5 py-4">规则项</th>
                  <th className="px-3 py-4">阈值</th>
                  <th className="px-3 py-4">严重级别</th>
                  <th className="px-5 py-4">响应时限</th>
                </tr>
              </thead>
              <tbody className="text-sm text-[#263246]">
                {slaRules.map((rule) => (
                  <tr className="h-[52px] border-t border-[#E3E9F3]" key={rule.rule}>
                    <td className="px-5">{rule.rule}</td>
                    <td className="px-3">{rule.threshold}</td>
                    <td className="px-3"><span className={`inline-flex min-w-[52px] justify-center rounded-[8px] px-3 py-1 text-sm font-medium ${severityClasses(rule.severity)}`}>{rule.severity}</span></td>
                    <td className="px-5">{rule.responseLimit}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </SettingsCard>

          <SettingsCard title="AI设置" action={<button className="text-sm font-medium text-[#2F7BFF]" onClick={() => showActionToast('编辑')} type="button">编辑</button>}>
            <div className="space-y-5 px-5 pb-5">
              {aiSettingRows.map((item) => (
                <div className="flex items-center justify-between gap-5" key={item.key}>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1D273B]">{item.title}</div>
                    <p className="mt-1 text-sm text-[#8A98B3]">{item.description}</p>
                  </div>
                  <Toggle checked={aiSettings[item.key]} label={item.title} onChange={() => setAiSettings((current) => ({ ...current, [item.key]: !current[item.key] }))} />
                </div>
              ))}
            </div>
          </SettingsCard>

          <SettingsCard title="通知设置" action={<button className="text-sm font-medium text-[#2F7BFF]" onClick={() => showActionToast('编辑')} type="button">编辑</button>}>
            <div className="space-y-6 px-5 pb-5">
              {notificationRows.map((item) => (
                <div className="flex items-center justify-between gap-5" key={item.key}>
                  <div>
                    <div className="text-[15px] font-semibold text-[#1D273B]">{item.title}</div>
                    <p className="mt-1 text-sm text-[#8A98B3]">{item.description}</p>
                  </div>
                  <Toggle checked={notificationSettings[item.key]} label={item.title} onChange={() => setNotificationSettings((current) => ({ ...current, [item.key]: !current[item.key] }))} />
                </div>
              ))}
            </div>
          </SettingsCard>
        </div>
      </div>

      {showConnectModal ? <ConnectModal onClose={() => setShowConnectModal(false)} /> : null}
    </div>
  );
}
