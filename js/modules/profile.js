window.ProfileModule = {
    container: null,
    projects: [],
    isEasterEggActive: false,

    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
        this.initAvatar();
        this.initContact();
        this.loadFeaturedProjects();
    },

    render() {
        this.container.innerHTML = `
            <div class="profile-main">
                <!-- Left: Avatar & Info -->
                <div class="profile-left">
                    <div class="glass-card avatar-card">
                        <div class="avatar-circle-big" id="avatarShake">
                            <img id="dynamic-qq-avatar" class="avatar-img" src="" alt="avatar">
                        </div>
                        <div class="display-name">ssbtt</div>
                        <div class="profile-subtitle"><i class="fas fa-map-pin"></i> 数字漫游者 · 创造不息</div>
                        <div class="profile-bio">
                            ⚡ 全栈爱好者 | 游戏设计探索者 | 开源精神实践者<br>
                            🤔 "俺寻思之力"
                        </div>
                        <div class="profile-social">
                            <div class="skill-badge" data-url="https://github.com/ssbtt114514"><i class="fab fa-github"></i> GitHub</div>
                            <div class="skill-badge" data-url="https://space.bilibili.com/3546557150399113"><i class="fab fa-bilibili"></i> B站</div>
                        </div>
                    </div>
                </div>

                <!-- Right: Famous Projects -->
                <div class="profile-right">
                    <div class="glass-card projects-card">
                        <div class="section-title"><i class="fas fa-star"></i> 著名项目 · Featured</div>
                        <div id="featuredProjectsGrid" class="featured-projects-grid">
                            <div style="grid-column: 1/-1; text-align:center; padding:40px;">
                                <i class="fas fa-spinner fa-pulse" style="font-size:1.5rem;"></i>
                                <div style="margin-top:10px; opacity:0.7;">正在加载项目数据...</div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <!-- Bottom: Contact -->
            <div class="glass-card profile-contact">
                <div class="section-title"><i class="fas fa-paper-plane"></i> 联系方式</div>
                <div class="contact-buttons">
                    <div class="contact-btn" id="ghBtn"><i class="fab fa-github"></i> GitHub</div>
                    <div class="contact-btn" id="biliBtn"><i class="fab fa-bilibili"></i> Bilibili</div>
                    <div class="contact-btn" id="qqBtn"><i class="fab fa-qq"></i> QQ</div>
                    <div class="contact-btn" id="wxBtn"><i class="fab fa-weixin"></i> Wechat</div>
                </div>
                <div class="contact-note">
                    <i class="fas fa-envelope"></i> 合作/交流: 欢迎通过 GitHub issue 或 B站私信~
                </div>
            </div>
        `;

        // Bind social badge clicks
        this.container.querySelectorAll('.skill-badge[data-url]').forEach(el => {
            el.addEventListener('click', (e) => {
                e.stopPropagation();
                window.open(el.getAttribute('data-url'), '_blank');
            });
        });
    },

    initAvatar() {
        const avatarDiv = document.getElementById('avatarShake');
        const img = document.getElementById('dynamic-qq-avatar');
        if (img) img.src = `https://q.qlogo.cn/headimg_dl?dst_uin=${APP_CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`;
        if (!avatarDiv) return;

        // Material Design 触发：Pointer Events 统一鼠标/触摸/手写笔
        let pressTimer = null;
        let longPressTriggered = false;
        const LONG_PRESS_MS = 600;
        const TRIPLE_CLICK_WINDOW = 1000;
        let clickTimes = [];

        const clearPressTimer = () => {
            if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; }
        };

        // Material 按压反馈
        avatarDiv.addEventListener('pointerdown', () => {
            if (this.isEasterEggActive) return;
            longPressTriggered = false;
            avatarDiv.classList.add('avatar-pressing');
            clearPressTimer();
            pressTimer = setTimeout(() => {
                longPressTriggered = true;
                clickTimes = [];
                avatarDiv.classList.remove('avatar-pressing');
                this.triggerEasterEgg(avatarDiv);
            }, LONG_PRESS_MS);
        });

        ['pointerup', 'pointercancel', 'pointerleave'].forEach(type => {
            avatarDiv.addEventListener(type, () => {
                avatarDiv.classList.remove('avatar-pressing');
                clearPressTimer();
            });
        });

        // 点击：Material 抖动 + 1秒内3次触发彩蛋
        avatarDiv.addEventListener('click', () => {
            if (this.isEasterEggActive || longPressTriggered) {
                longPressTriggered = false;
                return;
            }

            const now = Date.now();
            clickTimes = clickTimes.filter(t => now - t <= TRIPLE_CLICK_WINDOW);
            clickTimes.push(now);

            if (clickTimes.length >= 3) {
                clickTimes = [];
                this.triggerEasterEgg(avatarDiv);
                return;
            }

            // Material 风格轻量抖动
            avatarDiv.style.transform = `translate(${(Math.random() - 0.5) * 24}px, ${(Math.random() - 0.5) * 18}px) scale(1.04) rotate(${(Math.random()-0.5)*6}deg)`;
            setTimeout(() => avatarDiv.style.transform = '', 320);
        });

        const closeBtn = document.getElementById('easter-egg-close');
        if (closeBtn) closeBtn.addEventListener('click', () => this.closeEasterEgg());
    },

    triggerEasterEgg(avatarDiv) {
        this.isEasterEggActive = true;
        const circle = document.getElementById('easter-egg-circle');
        const overlay = document.getElementById('easter-egg-overlay');
        const frame = document.getElementById('easter-egg-frame');
        if (!circle || !overlay || !frame) return;

        // Material 时序：摇动 → 变暗 → 圆形揭露 → 内容显现
        avatarDiv.classList.add('avatar-shake');

        // 400ms 后头像变暗（Material fade）
        setTimeout(() => {
            avatarDiv.classList.add('avatar-black');
        }, 400);

        // 600ms 后圆形揭露从头像中心扩散（Material Container Transform）
        setTimeout(() => {
            const rect = avatarDiv.getBoundingClientRect();
            const cx = rect.left + rect.width / 2;
            const cy = rect.top + rect.height / 2;
            const maxR = Math.sqrt(window.innerWidth ** 2 + window.innerHeight ** 2);
            circle.style.left = cx + 'px';
            circle.style.top = cy + 'px';
            circle.style.width = maxR * 2 + 'px';
            circle.style.height = maxR * 2 + 'px';
            void circle.offsetWidth;
            circle.classList.add('expand');
        }, 600);

        // 1100ms 后显示内嵌内容（Material Shared Axis）
        setTimeout(() => {
            frame.src = 'easter-egg.html';
            overlay.classList.add('active');
            document.body.style.overflow = 'hidden';
        }, 1100);
    },

    closeEasterEgg() {
        const overlay = document.getElementById('easter-egg-overlay');
        const frame = document.getElementById('easter-egg-frame');
        const circle = document.getElementById('easter-egg-circle');
        const avatarDiv = document.getElementById('avatarShake');

        if (overlay) overlay.classList.remove('active');
        if (frame) frame.src = 'about:blank';
        if (circle) circle.classList.remove('expand');
        if (avatarDiv) {
            avatarDiv.classList.remove('avatar-shake', 'avatar-black');
            avatarDiv.style.transform = '';
        }
        document.body.style.overflow = '';
        this.isEasterEggActive = false;
    },

    initContact() {
        const ghBtn = document.getElementById('ghBtn');
        const biliBtn = document.getElementById('biliBtn');
        const qqBtn = document.getElementById('qqBtn');
        const wxBtn = document.getElementById('wxBtn');

        ghBtn?.addEventListener('click', () => window.open(APP_CONFIG.GITHUB_HOMEPAGE, '_blank'));
        biliBtn?.addEventListener('click', () => window.open(`${APP_CONFIG.BILI_SPACE_URL}${APP_CONFIG.BILI_UID}`, '_blank'));
        qqBtn?.addEventListener('click', () => this.openQQ());
        wxBtn?.addEventListener('click', () => this.copyWechat());
    },

    openQQ() {
        const qq = APP_CONFIG.QQ_NUMBER;
        const isMobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isMobile) {
            window.location.href = `mqq://card/show_pslcard?uin=${qq}`;
            setTimeout(() => { if (confirm('未唤起QQ，复制QQ号?')) navigator.clipboard.writeText(qq); }, 500);
        } else {
            window.open(`${APP_CONFIG.QQ_ZONE_URL}${qq}`, '_blank');
        }
    },

    copyWechat() {
        navigator.clipboard.writeText(APP_CONFIG.WECHAT_ID)
            .then(() => alert(`微信号 ${APP_CONFIG.WECHAT_ID} 已复制`))
            .catch(() => alert('手动复制：' + APP_CONFIG.WECHAT_ID));
    },

    async loadFeaturedProjects() {
        const grid = document.getElementById('featuredProjectsGrid');
        if (!grid) return;
        try {
            const projectsConfig = await API.fetchProjectsConfig();
            this.projects = [];
            for (let i = 0; i < projectsConfig.length; i++) {
                const proj = projectsConfig[i];
                // 站内应用（StudyMap / ranking 等子目录），无需请求 GitHub API
                if (proj.app) {
                    this.projects.push({
                        name: proj.name,
                        html_url: proj.url,
                        description: proj.description || '暂无描述',
                        stargazers_count: null,
                        forks_count: null,
                        language: proj.language || 'Web App',
                        config: proj,
                        isApp: true
                    });
                    continue;
                }
                try {
                    const urlParts = new URL(proj.url).pathname.split('/').filter(Boolean);
                    if (urlParts.length < 2) continue;
                    const owner = urlParts[0], repo = urlParts[1];
                    const data = await API.fetchRepoDetail(owner, repo);
                    this.projects.push({ ...data, config: proj });
                } catch (e) {
                    console.warn(`加载项目失败: ${proj.url}`, e);
                    // Still show with config info
                    this.projects.push({
                        name: proj.name,
                        html_url: proj.url,
                        description: '项目详情加载中...',
                        stargazers_count: 0,
                        forks_count: 0,
                        language: '—',
                        config: proj
                    });
                }
            }
            this.renderFeaturedProjects();
        } catch (e) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; opacity:0.7;">
                <i class="fas fa-exclamation-triangle"></i> 项目加载失败
            </div>`;
            console.error(e);
        }
    },

    renderFeaturedProjects() {
        const grid = document.getElementById('featuredProjectsGrid');
        if (!grid) return;
        if (this.projects.length === 0) {
            grid.innerHTML = `<div style="grid-column:1/-1; text-align:center; padding:30px; opacity:0.7;">暂无项目</div>`;
            return;
        }
        grid.innerHTML = '';
        this.projects.forEach(p => {
            const card = document.createElement('a');
            card.className = 'featured-project-card' + (p.isApp ? ' is-app' : '');
            card.href = p.html_url;
            // 站内应用同标签页打开，外部仓库新开标签页
            card.target = p.isApp ? '_self' : '_blank';

            const desc = p.description
                ? p.description.substring(0, 80) + (p.description.length > 80 ? '…' : '')
                : '暂无描述';

            let head, meta, footer;
            if (p.isApp) {
                head = `<div class="featured-project-name">
                    <span class="app-icon" style="background:${p.config.color}1f;color:${p.config.color}">
                        <i class="${p.config.icon}"></i>
                    </span>${Utils.escapeHtml(p.name)}</div>`;
                meta = '';
                footer = `<div class="featured-project-meta">
                    <span class="featured-project-lang">${Utils.escapeHtml(p.language)}</span>
                    <span class="app-enter" style="--c:${p.config.color}">进入应用 →</span>
                </div>`;
            } else {
                head = `<div class="featured-project-name"><i class="fab fa-github"></i> ${Utils.escapeHtml(p.name)}</div>`;
                meta = `<div class="featured-project-meta">
                    <span><i class="fas fa-star"></i> ${p.stargazers_count}</span>
                    <span><i class="fas fa-code-branch"></i> ${p.forks_count}</span>
                    <span class="featured-project-lang">${p.language || 'Mixed'}</span>
                </div>`;
                footer = '';
            }

            card.innerHTML = `
                ${head}
                <div class="featured-project-desc">${Utils.escapeHtml(desc)}</div>
                ${meta}${footer}
            `;
            grid.appendChild(card);
        });
    }
};
