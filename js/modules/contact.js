window.ContactModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-paper-plane"></i> 联系方式</div>
                <div class="contact-buttons">
                    <div class="contact-btn" id="ghBtn"><i class="fab fa-github"></i> GitHub</div>
                    <div class="contact-btn" id="biliBtn"><i class="fab fa-bilibili"></i> Bilibili</div>
                    <div class="contact-btn" id="qqBtn"><i class="fab fa-qq"></i> QQ</div>
                    <div class="contact-btn" id="wxBtn"><i class="fab fa-weixin"></i> Wechat</div>
                </div>
                <div style="margin-top: 28px; text-align: center; background: rgba(0,0,0,0.03); border-radius: 28px; padding: 15px;">
                    <i class="fas fa-envelope"></i> 合作/交流: 欢迎通过 GitHub issue 或 B站私信~
                </div>
            </div>
        `;
        document.getElementById('ghBtn')?.addEventListener('click', () => window.open(APP_CONFIG.GITHUB_HOMEPAGE, '_blank'));
        document.getElementById('biliBtn')?.addEventListener('click', () => window.open(`${APP_CONFIG.BILI_SPACE_URL}${APP_CONFIG.BILI_UID}`, '_blank'));
        document.getElementById('qqBtn')?.addEventListener('click', () => this.openQQ());
        document.getElementById('wxBtn')?.addEventListener('click', () => this.copyWechat());
    },
    openQQ() {
        const qq = APP_CONFIG.QQ_NUMBER;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if(isMobile) {
            window.location.href = `mqq://card/show_pslcard?uin=${qq}`;
            setTimeout(() => { if(confirm('未唤起QQ，复制QQ号?')) navigator.clipboard.writeText(qq); }, 500);
        } else {
            window.open(`${APP_CONFIG.QQ_ZONE_URL}${qq}`, '_blank');
        }
    },
    copyWechat() {
        navigator.clipboard.writeText(APP_CONFIG.WECHAT_ID).then(() => alert(`微信号 ${APP_CONFIG.WECHAT_ID} 已复制`)).catch(() => alert('手动复制：'+APP_CONFIG.WECHAT_ID));
    }
};