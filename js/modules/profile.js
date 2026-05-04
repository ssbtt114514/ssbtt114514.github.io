window.ProfileModule = {
    init(containerId) {
        this.container = document.getElementById(containerId);
        if (!this.container) return;
        this.render();
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
            </div>
        `;
        
        // 绑定 badge 跳转
        document.querySelectorAll('.skill-badge[data-url]').forEach(el => {
            el.addEventListener('click', (e) => { 
                e.stopPropagation(); 
                window.open(el.getAttribute('data-url'), '_blank'); 
            });
        });
    },
    
    initAvatar() {
        const avatarDiv = document.getElementById('avatarShake');
        if (avatarDiv) {
            avatarDiv.addEventListener('click', () => {
                avatarDiv.style.transform = `translate(${(Math.random() - 0.5) * 40}px, ${(Math.random() - 0.5) * 30}px) scale(1.02)`;
                setTimeout(() => avatarDiv.style.transform = '', 400);
            });
        }
        const img = document.getElementById('dynamic-qq-avatar');
        if (img) img.src = `https://q.qlogo.cn/headimg_dl?dst_uin=${APP_CONFIG.QQ_NUMBER}&spec=140&t=${Date.now()}`;
    }
};