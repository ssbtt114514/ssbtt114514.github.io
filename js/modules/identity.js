window.IdentityModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-fingerprint"></i> 身份光谱</div>
                <ul style="list-style: none; line-height: 2.4;">
                    <li><i class="fas fa-leaf" style="color: #4caf50; width: 32px;"></i> 中国共青团团员 · 青年先锋</li>
                    <li><i class="fas fa-desktop" style="color: #ff9800;"></i> 希沃白板管理员 · 智慧教育实践者</li>
                    <li><i class="fas fa-video" style="color: #e1306c;"></i> 视频创作者 · 记录技术生活</li>
                    <li><i class="fas fa-hand-sparkles"></i> 开源贡献者、独立开发者</li>
                </ul>
            </div>
        `;
    }
};