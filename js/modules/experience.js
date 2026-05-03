window.ExperienceModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-rocket"></i> 硬核折腾史</div>
                <div class="timeline-item"><i class="fas fa-ubuntu" style="color: #e95420;"></i> 为朋友成功装机 + 部署 lUbuntu，优化开发环境</div>
                <div class="timeline-item"><i class="fas fa-code-branch"></i> 从零搭建个人服务器 · 内网穿透 & Docker 玩法</div>
                <div class="timeline-item"><i class="fas fa-gamepad"></i> 社区中帮助萌新解决问题</div>
                <div class="timeline-item"><i class="fas fa-quote-right"></i> "在失败中成长"</div>
            </div>
        `;
    }
};