window.Utils = {
    escapeHtml(str) {
        if (!str) return '';
        return str.replace(/[&<>]/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[m]));
    },
    formatNumber(num) {
        if (num >= 10000) return (num / 10000).toFixed(1) + '万';
        if (num >= 1000) return (num / 1000).toFixed(1) + 'k';
        return num.toString();
    },
    formatDate(dateStr) {
        return new Date(dateStr).toLocaleDateString('zh-CN');
    }
};