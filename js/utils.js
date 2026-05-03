// 通用工具函数
function escapeHtml(str) {
    if (!str) return '';
    return str.replace(/[&<>]/g, m => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[m]));
}

function formatNumber(num) {
    if (num >= 10000) return (num / 10000).toFixed(1) + '万';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
    return num.toString();
}

function formatDuration(seconds) {
    if (typeof seconds === 'string') return seconds;
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
}

function inferTag(title, desc) {
    const text = (title + ' ' + desc).toLowerCase();
    if (text.includes('教程') || text.includes('指南') || text.includes('入门')) return 'tutorial';
    if (text.includes('游戏') || text.includes('mc') || text.includes('minecraft') || text.includes('godot')) return 'game';
    if (text.includes('vlog') || text.includes('日常') || text.includes('生活')) return 'life';
    return 'tech';
}

const LEVEL_EXP_TABLE = [0, 200, 1500, 4500, 10800, 28800, 0];
const MOCK_BILI_USER = { level: 5, current_exp: 18500, coins: 234, videos_count: 24, next_level_exp: 28800 };