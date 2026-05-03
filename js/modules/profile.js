// 主页模块
function renderProfile() {
    return `
        <div class="glass-card" style="text-align: center;">
            <div class="avatar-modern">
                <div class="avatar-circle-big" id="avatarShake">
                    <img id="dynamic-qq-avatar" class="avatar-img" src="" alt="avatar">
                </div>
                <div class="display-name">ssbtt</div>
                <p style="margin-top: 6px;"><i class="fas fa-map-pin"></i> 数字漫游者 · 创造不息</p>
            </div>
            <div style="margin-top: 20px;">
                <p>⚡ 全栈爱好者 | 游戏设计探索者 | 开源精神实践者<br>✨ "每一个像素都值得跳动"</p>
            </div>
            <div class="badge-group" style="justify-content: center; margin-top: 28px;">
                <div class="skill-badge" data-url="https://github.com/ssbtt114514"><i class="fab fa-github"></i> GitHub</div>
                <div class="skill-badge" data-url="https://space.bilibili.com/${CONFIG.BILI_UID}"><i class="fab fa-bilibili"></i> B站创作</div>
            </div>
            <div class="bili-profile-section">
                <div class="section-title" style="font-size: 1.3rem; justify-content: center;">
                    <i class="fab fa-bilibili"></i> Bilibili 数据面板
                </div>
                <div class="bili-stats-grid">
                    <div class="bili-stat-card"><div class="bili-stat-value" id="biliLevel">--</div><div class="bili-stat-label">等级</div></div>
                    <div class="bili-stat-card"><div class="bili-stat-value" id="biliExp">--</div><div class="bili-stat-label">当前经验</div></div>
                    <div class="bili-stat-card"><div class="bili-stat-value" id="biliCoins">--</div><div class="bili-stat-label">硬币数</div></div>
                    <div class="bili-stat-card"><div class="bili-stat-value" id="biliVideos">--</div><div class="bili-stat-label">投稿视频</div></div>
                </div>
                <div class="level-section">
                    <div class="level-header"><span class="level-badge" id="levelBadge">LV --</span><span id="expText">-- / --</span></div>
                    <div class="level-progress-bg"><div class="level-progress-fill" id="levelProgress" style="width:0%"></div></div>
                    <p id="nextLevelText" style="margin-top:8px; font-size:0.8rem; opacity:0.6;">距离下一级还需 -- 经验</p>
                </div>
            </div>
        </div>
    `;
}

function initProfile() {
    const img = document.getElementById('dynamic-qq-avatar');
    if (img) img.src = `https://q.qlogo.cn/headimg_dl?dst_uin=${CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`;
    
    const avatarDiv = document.getElementById('avatarShake');
    if (avatarDiv) {
        avatarDiv.addEventListener('click', () => {
            avatarDiv.style.transform = `translate(${(Math.random()-0.5)*40}px, ${(Math.random()-0.5)*30}px) scale(1.02)`;
            setTimeout(() => avatarDiv.style.transform = '', 400);
        });
    }
}