window.SkillsModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-crown"></i> 爱好 & 技术栈</div>
                <div class="badge-group">
                    <div class="skill-badge" data-url="https://www.java.com/"><i class="fab fa-java"></i> Java (Spring生态)</div>
                    <div class="skill-badge" data-url="https://www.python.org/"><i class="fab fa-python"></i> Python / 自动化</div>
                    <div class="skill-badge" data-url="https://www.lua.org/"><i class="fas fa-code"></i> Lua · 游戏脚本</div>
                    <div class="skill-badge" data-url="https://godotengine.org/"><i class="fas fa-play-circle"></i> GDScript · Godot</div>
                    <div class="skill-badge" data-url="https://developer.mozilla.org/"><i class="fab fa-js"></i> JavaScript / 前端魔法</div>
                </div>
                <div style="margin-top: 24px;"><p><i class="fas fa-tools"></i> 最近痴迷: 系统调优 · 独立游戏开发 · 跨端工具链</p></div>
            </div>
        `;
        // 绑定跳转
        container.querySelectorAll('.skill-badge[data-url]').forEach(el => {
            el.addEventListener('click', (e) => { e.stopPropagation(); window.open(el.getAttribute('data-url'), '_blank'); });
        });
    }
};