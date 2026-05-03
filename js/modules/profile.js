window.ProfileModule = {
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
        this.loadBiliData();
        this.initAvatar();
    },
    render() {
        this.container.innerHTML = `
            <div class="glass-card" style="text-align: center;">
                <div class="avatar-modern">
                    <div class="avatar-circle-big" id="avatarShake">
                        <img id="dynamic-qq-avatar" class="avatar-img" src="" alt="avatar">
                    </div>
                    <div class="display-name">ssbtt</div>
                    <p style="margin-top: 6px;"><i class="fas fa-map-pin"></i> 数字漫游者 · 创造不息</p>
                </div>
                <div style="margin-top: 20px;">
                    <p style="font-size: 1rem; max-width: 480px; margin: 0 auto;">⚡ 全栈爱好者 | 游戏设计探索者 | 开源精神实践者<br>🤔 "按寻思之力"</p>
                </div>
                <div class="badge-group" style="justify-content: center; margin-top: 28px;">
                    <div class="skill-badge" data-url="https://github.com/ssbtt114514"><i class="fab fa-github"></i> GitHub</div>
                    <div class="skill-badge" data-url="https://space.bilibili.com/3546557150399113"><i class="fab fa-bilibili"></i> B站创作</div>
                </div>
                <div class="bili-profile-section" id="biliProfileSection">
                    <div class="section-title" style="font-size: 1.3rem; justify-content: center;">
                        <i class="fab fa-bilibili" style="color: #00a1d6;"></i> Bilibili 数据面板
                    </div>
                    <div class="bili-stats-grid" id="biliStatsGrid">
                        <div class="bili-stat-card"><div class="bili-stat-value" id="biliLevel">--</div><div class="bili-stat-label">等级</div></div>
                        <div class="bili-stat-card"><div class="bili-stat-value" id="biliExp">--</div><div class="bili-stat-label">当前经验</div></div>
                        <div class="bili-stat-card"><div class="bili-stat-value" id="biliCoins">--</div><div class="bili-stat-label">硬币数</div></div>
                        <div class="bili-stat-card"><div class="bili-stat-value" id="biliVideos">--</div><div class="bili-stat-label">投稿视频</div></div>
                    </div>
                    <div class="level-section">
                        <div class="level-header"><span class="level-badge" id="levelBadge">LV --</span><span style="font-size: 0.85rem; opacity: 0.7;" id="expText">-- / --</span></div>
                        <div class="level-progress-bg"><div class="level-progress-fill" id="levelProgress" style="width: 0%;"></div></div>
                        <p style="margin-top: 8px; font-size: 0.8rem; opacity: 0.6;" id="nextLevelText">距离下一级还需 -- 经验</p>
                    </div>
                </div>
            </div>
        `;
        // 重新绑定 badge 跳转
        document.querySelectorAll('.skill-badge[data-url]').forEach(el => {
            el.addEventListener('click', (e) => { e.stopPropagation(); window.open(el.getAttribute('data-url'), '_blank'); });
        });
    },
    async loadBiliData() {
        try {
            const info = await API.fetchBiliUserInfo();
            this.renderBiliProfile(info);
        } catch(e) {
            // Mock 数据作为降级
            const mock = { level: 5, current_exp: 18500, coins: 234, videos_count: 24, next_level_exp: 28800 };
            this.renderBiliProfile(mock);
        }
    },
    renderBiliProfile(info) {
        const levelEl = document.getElementById('biliLevel');
        if (levelEl) levelEl.textContent = `LV${info.level}`;
        const expEl = document.getElementById('biliExp');
        if (expEl) expEl.textContent = info.current_exp.toLocaleString();
        const coinsEl = document.getElementById('biliCoins');
        if (coinsEl) coinsEl.textContent = info.coins.toLocaleString();
        const videosEl = document.getElementById('biliVideos');
        if (videosEl) videosEl.textContent = info.videos_count;
        const badgeEl = document.getElementById('levelBadge');
        if (badgeEl) badgeEl.textContent = `LV ${info.level}`;
        const nextExp = info.next_level_exp || APP_CONFIG.LEVEL_EXP_TABLE[info.level] || 0;
        const prevExp = APP_CONFIG.LEVEL_EXP_TABLE[info.level-1] || 0;
        const totalNeed = nextExp - prevExp;
        const currentInLevel = info.current_exp - prevExp;
        const progress = totalNeed > 0 ? Math.min(100, (currentInLevel / totalNeed) * 100) : 100;
        const expTextEl = document.getElementById('expText');
        if (expTextEl) expTextEl.textContent = `${info.current_exp.toLocaleString()} / ${nextExp.toLocaleString()}`;
        const progressEl = document.getElementById('levelProgress');
        if (progressEl) progressEl.style.width = `${progress}%`;
        const nextLevelTextEl = document.getElementById('nextLevelText');
        if (nextLevelTextEl) {
            nextLevelTextEl.textContent = info.level >= 6 ? '已达到最高等级！' : `距离 LV${info.level+1} 还需 ${(nextExp - info.current_exp).toLocaleString()} 经验`;
        }
    },
    initAvatar() {
        const avatarDiv = document.getElementById('avatarShake');
        if (avatarDiv) {
            avatarDiv.addEventListener('click', () => {
                avatarDiv.style.transform = `translate(${(Math.random()-0.5)*40}px, ${(Math.random()-0.5)*30}px) scale(1.02)`;
                setTimeout(() => avatarDiv.style.transform = '', 400);
            });
        }
        const img = document.getElementById('dynamic-qq-avatar');
        if (img) img.src = `https://q.qlogo.cn/headimg_dl?dst_uin=${APP_CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`;
    }
};