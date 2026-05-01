<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes, viewport-fit=cover">
    <title>名副其实的废物 · 个人主页</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }

        body {
            font-family: 'Segoe UI', 'Roboto', 'Noto Sans', system-ui, -apple-system, 'Helvetica Neue', sans-serif;
            min-height: 100vh;
            display: flex;
            justify-content: center;
            align-items: flex-start;
            padding: 40px 20px;
            background: radial-gradient(circle at 20% 30%, #eef2f9, #cbd5e6);
            transition: background 0.25s ease;
        }

        body.dark {
            background: radial-gradient(circle at 20% 30%, #0f1724, #03060c);
        }

        /* 主容器 - 去掉边框 */
        .glass-container {
            max-width: 680px;
            width: 100%;
            margin: 0 auto;
            background: rgba(245, 248, 255, 0.65);
            backdrop-filter: blur(20px) saturate(180%);
            -webkit-backdrop-filter: blur(20px) saturate(180%);
            border-radius: 48px;
            overflow: hidden;
            display: flex;
            flex-direction: column;
            transition: background 0.25s ease;
        }

        body.dark .glass-container {
            background: rgba(18, 24, 36, 0.7);
        }

        /* 顶部栏 */
        .top-bar {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            padding: 12px 20px;
            background: rgba(255, 255, 255, 0.45);
            backdrop-filter: blur(10px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.08);
            gap: 12px;
            transition: background 0.25s ease, border-color 0.2s ease;
        }

        body.dark .top-bar {
            background: rgba(10, 14, 23, 0.6);
            border-bottom: 1px solid rgba(255, 255, 255, 0.1);
        }

        /* 可收缩目录面板 */
        .directory-wrapper {
            background: rgba(240, 245, 255, 0.6);
            backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(0, 0, 0, 0.06);
            overflow: hidden;
            transition: all 0.3s cubic-bezier(0.2, 0.9, 0.4, 1.1);
        }

        body.dark .directory-wrapper {
            background: rgba(15, 20, 32, 0.7);
            border-bottom: 1px solid rgba(255, 255, 255, 0.08);
        }

        .directory-panel {
            padding: 12px 20px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            align-items: center;
        }

        .directory-toggle {
            background: rgba(108, 141, 255, 0.2);
            border: none;
            border-radius: 40px;
            padding: 6px 16px;
            font-size: 0.8rem;
            font-weight: 500;
            cursor: pointer;
            color: #1f2a3e;
            backdrop-filter: blur(4px);
            display: inline-flex;
            align-items: center;
            gap: 8px;
            transition: 0.2s;
            margin-right: 8px;
        }

        body.dark .directory-toggle {
            background: rgba(108, 141, 255, 0.35);
            color: #eef3ff;
        }

        .directory-toggle:hover {
            background: #6c8dff;
            color: white;
            transform: scale(0.96);
        }

        .dir-chip {
            background: rgba(0, 0, 0, 0.08);
            padding: 6px 16px;
            border-radius: 40px;
            font-size: 0.85rem;
            font-weight: 500;
            cursor: pointer;
            color: #1f2a3e;
            backdrop-filter: blur(4px);
            display: inline-flex;
            align-items: center;
            gap: 6px;
            transition: 0.2s;
        }

        body.dark .dir-chip {
            background: rgba(255, 255, 255, 0.12);
            color: #eef3ff;
        }

        .dir-chip:hover {
            background: #6c8dff;
            color: white;
            transform: translateY(-2px);
        }

        .theme-toggle {
            background: rgba(0, 0, 0, 0.1);
            border: none;
            border-radius: 40px;
            width: 40px;
            height: 40px;
            cursor: pointer;
            font-size: 1.2rem;
            display: flex;
            align-items: center;
            justify-content: center;
            backdrop-filter: blur(4px);
            transition: 0.2s;
        }

        body.dark .theme-toggle {
            background: rgba(255, 255, 255, 0.15);
            color: #ffdf8c;
        }

        /* 滚动区域 */
        .scroll-area {
            padding: 24px 24px 32px;
            max-height: none;
            overflow-y: visible;
            scroll-behavior: smooth;
        }

        /* 头像区域 */
        .avatar-zone {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 28px;
        }

        .avatar-circle {
            width: 140px;
            height: 140px;
            border-radius: 50%;
            background: rgba(210, 225, 255, 0.5);
            backdrop-filter: blur(6px);
            display: flex;
            align-items: center;
            justify-content: center;
            margin-bottom: 18px;
            box-shadow: 0 8px 20px rgba(0, 0, 0, 0.15);
            overflow: hidden;
            transition: background 0.25s ease;
        }

        body.dark .avatar-circle {
            background: rgba(30, 40, 60, 0.6);
        }

        .avatar-img {
            width: 130px;
            height: 130px;
            border-radius: 50%;
            object-fit: cover;
            border: 3px solid rgba(255, 255, 255, 0.6);
        }

        .waste-title {
            font-size: 2.2rem;
            font-weight: 800;
            background: linear-gradient(135deg, #1f2b3c, #2c3e66);
            -webkit-background-clip: text;
            background-clip: text;
            color: transparent;
            letter-spacing: 1px;
            transition: background 0.25s ease;
        }

        body.dark .waste-title {
            background: linear-gradient(135deg, #f5e6d3, #bdd4ff);
            -webkit-background-clip: text;
            background-clip: text;
        }

        .sub {
            background: rgba(0, 0, 0, 0.2);
            backdrop-filter: blur(4px);
            padding: 4px 14px;
            border-radius: 40px;
            font-size: 0.75rem;
            color: #2c3e55;
            margin-top: 8px;
            transition: background 0.25s ease, color 0.2s ease;
        }

        body.dark .sub {
            background: rgba(0, 0, 0, 0.4);
            color: #b9cbff;
        }

        /* 卡片通用样式 */
        .card {
            background: rgba(248, 250, 255, 0.7);
            backdrop-filter: blur(16px);
            border-radius: 32px;
            padding: 20px 22px;
            margin-bottom: 24px;
            border: 1px solid rgba(255, 255, 245, 0.6);
            transition: background 0.25s ease, border-color 0.2s ease;
        }

        body.dark .card {
            background: rgba(20, 26, 40, 0.75);
            border: 1px solid rgba(255, 255, 255, 0.08);
        }

        .card-header {
            font-size: 1.3rem;
            font-weight: 600;
            margin-bottom: 18px;
            display: flex;
            align-items: center;
            gap: 10px;
            border-left: 4px solid #6c8dff;
            padding-left: 14px;
            color: #1e2a44;
            transition: color 0.2s ease;
        }

        body.dark .card-header {
            color: #eef3fc;
        }

        .clickable-badge {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            background: rgba(108, 141, 255, 0.2);
            backdrop-filter: blur(5px);
            padding: 6px 18px;
            border-radius: 40px;
            font-size: 0.9rem;
            font-weight: 500;
            cursor: pointer;
            transition: 0.2s;
            border: 0.5px solid rgba(100, 100, 200, 0.4);
            text-decoration: none;
            color: #1f2b3c;
        }

        body.dark .clickable-badge {
            color: #dee9ff;
            background: rgba(108, 141, 255, 0.25);
        }

        .clickable-badge:hover {
            background: #6c8dff;
            color: white;
            transform: translateY(-2px);
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .skill-group {
            margin-bottom: 20px;
        }

        .skill-label {
            font-weight: 500;
            margin-bottom: 12px;
            color: #2c3e66;
            display: flex;
            align-items: center;
            gap: 10px;
            transition: color 0.2s ease;
        }

        body.dark .skill-label {
            color: #bfd6ff;
        }

        .badge-list {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .game-block {
            margin-top: 6px;
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
        }

        .game-chip {
            background: rgba(0, 0, 0, 0.08);
            padding: 5px 16px;
            border-radius: 32px;
            font-size: 0.85rem;
            cursor: pointer;
            transition: 0.2s;
            color: #2c3e4e;
        }

        body.dark .game-chip {
            background: rgba(255, 255, 245, 0.1);
            color: #cbddf5;
        }

        .game-chip:hover {
            background: #f6ae7a;
            color: #1e2a2f;
            transform: scale(1.02);
        }

        .identity-item {
            display: flex;
            align-items: center;
            gap: 14px;
            margin-bottom: 14px;
            background: rgba(0, 0, 0, 0.04);
            padding: 8px 14px;
            border-radius: 32px;
            transition: background 0.25s ease;
        }

        body.dark .identity-item {
            background: rgba(255, 255, 255, 0.03);
        }

        .contact-row {
            display: flex;
            flex-wrap: wrap;
            gap: 14px;
            margin: 16px 0;
        }

        .contact-btn-link {
            flex: 1 0 auto;
            min-width: 120px;
            background: rgba(255, 255, 245, 0.7);
            backdrop-filter: blur(12px);
            border-radius: 60px;
            padding: 12px 8px;
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 12px;
            font-weight: 600;
            font-size: 1rem;
            text-decoration: none;
            color: #1a2c3f;
            border: 1px solid rgba(0, 0, 0, 0.1);
            transition: 0.2s;
            cursor: pointer;
        }

        body.dark .contact-btn-link {
            background: rgba(30, 38, 56, 0.8);
            color: #eef3ff;
            border-color: rgba(255, 255, 255, 0.2);
        }

        .contact-btn-link:hover {
            background: #6c8dff;
            color: white;
            transform: scale(0.97);
        }

        .flex-info {
            display: flex;
            justify-content: space-between;
            margin-top: 15px;
            background: rgba(0, 0, 0, 0.12);
            border-radius: 36px;
            padding: 12px 18px;
            font-size: 0.8rem;
            gap: 10px;
            flex-wrap: wrap;
            transition: background 0.25s ease;
        }

        body.dark .flex-info {
            background: rgba(0, 0, 0, 0.3);
        }

        .copy-text {
            cursor: pointer;
            font-weight: 500;
        }

        .copy-text:hover {
            color: #6c8dff;
        }

        footer {
            text-align: center;
            font-size: 0.7rem;
            padding: 12px 0 16px;
            opacity: 0.7;
            color: #2c3e55;
            transition: color 0.2s ease;
        }

        body.dark footer {
            color: #8ca0c0;
        }

        .scroll-margin {
            scroll-margin-top: 80px;
        }

        i, .fab, .fas, .far {
            pointer-events: none;
        }

        /* 电脑端适配 */
        @media (min-width: 769px) {
            body {
                padding: 60px 20px;
            }

            .glass-container {
                max-width: 720px;
                border-radius: 52px;
            }

            .scroll-area {
                padding: 32px 36px 40px;
            }

            .avatar-circle {
                width: 160px;
                height: 160px;
            }

            .avatar-img {
                width: 150px;
                height: 150px;
            }

            .waste-title {
                font-size: 2.6rem;
            }

            .card {
                padding: 24px 28px;
                margin-bottom: 28px;
            }

            .card-header {
                font-size: 1.4rem;
            }

            .contact-row {
                gap: 16px;
            }

            .contact-btn-link {
                min-width: 140px;
                padding: 14px 12px;
            }
        }

        /* 手机端适配 */
        @media (max-width: 550px) {
            body {
                padding: 20px 12px;
            }

            .scroll-area {
                padding: 18px;
            }

            .waste-title {
                font-size: 1.6rem;
            }

            .card {
                padding: 16px;
                border-radius: 24px;
            }

            .contact-btn-link {
                min-width: 100px;
                font-size: 0.9rem;
            }

            .avatar-circle {
                width: 120px;
                height: 120px;
            }

            .avatar-img {
                width: 110px;
                height: 110px;
            }
        }
    </style>
</head>
<body>
<div class="glass-container">
    <div class="top-bar">
        <button class="theme-toggle" id="themeSwitch"><i class="fas fa-moon"></i></button>
    </div>

    <!-- 可收缩目录区域 -->
    <div class="directory-wrapper" id="directoryWrapper">
        <div class="directory-panel">
            <button class="directory-toggle" id="toggleDirBtn">
                <i class="fas fa-bars"></i> <span id="toggleDirText">收缩目录</span>
            </button>
            <div class="dir-chip" data-target="head"><i class="fas fa-user"></i> 本人</div>
            <div class="dir-chip" data-target="skillSec"><i class="fas fa-code"></i> 技能/爱好</div>
            <div class="dir-chip" data-target="gameSec"><i class="fas fa-gamepad"></i> 游戏</div>
            <div class="dir-chip" data-target="identitySec"><i class="fas fa-id-card"></i> 身份</div>
            <div class="dir-chip" data-target="contactSec"><i class="fas fa-comment"></i> 联系</div>
        </div>
    </div>

    <div class="scroll-area" id="scrollContainer">
        <!-- 头像区 -->
        <div id="head" class="scroll-margin avatar-zone">
            <div class="avatar-circle">
                <img class="avatar-img" id="userAvatar" src="https://github.com/ssbtt114514/ssbtt114514.github.io/blob/main/avatar.jpg?raw=true" alt="avatar">
            </div>
            <div class="waste-title">名副其实的废物</div>
            <div class="sub"><i class="fas fa-feather-alt"></i> 废土浪漫 · 代码微光</div>
        </div>

        <!-- 技能卡片 -->
        <div id="skillSec" class="scroll-margin card">
            <div class="card-header"><i class="fas fa-laptop"></i> 爱好/技能</div>
            <div class="skill-group">
                <div class="skill-label"><i class="fas fa-terminal"></i> 编程语言</div>
                <div class="badge-list">
                    <span class="clickable-badge" data-url="https://www.java.com/zh-CN/" data-name="Java"><i class="fab fa-java"></i> Java</span>
                    <span class="clickable-badge" data-url="https://www.python.org/" data-name="Python"><i class="fab fa-python"></i> Python</span>
                    <span class="clickable-badge" data-url="https://www.lua.org/" data-name="Lua"><i class="fa-solid fa-code"></i> Lua</span>
                    <span class="clickable-badge" data-url="https://godotengine.org/" data-name="GDScript"><i class="fa-brands fa-godot"></i> GDScript</span>
                </div>
            </div>
            <div class="skill-group">
                <div class="skill-label"><i class="fas fa-egg"></i> 烘焙 · 甜点</div>
                <div class="badge-list">
                    <span class="clickable-badge" data-url="https://www.kingarthurbaking.com/" data-name="烘焙">🍰 烘培（一点点）</span>
                </div>
            </div>
        </div>

        <!-- 游戏区块 -->
        <div id="gameSec" class="scroll-margin card">
            <div class="card-header"><i class="fas fa-dice-d6"></i> 游戏热忱</div>
            <div class="game-block">
                <span class="game-chip" data-url="https://www.minecraft.net/zh-hans" data-name="Minecraft">Minecraft</span>
                <span class="game-chip" data-url="https://aqtw.qq.com/" data-name="暗区突围">暗区突围</span>
                <span class="game-chip" data-url="https://deltaforce.qq.com/" data-name="三角洲行动">三角洲行动</span>
                <span class="game-chip" data-url="https://www.half-life.com/" data-name="半条命系列">半条命系列</span>
                <span class="game-chip" data-url="https://mindustrygame.github.io/" data-name="Mindustry">Mindustry</span>
                <span class="game-chip" data-url="https://www.deltarune.com/" data-name="三角符文">三角符文</span>
                <span class="game-chip" data-url="https://store.steampowered.com/" data-name="更多">……更多独立游戏</span>
            </div>
        </div>

        <!-- 身份卡片 -->
        <div id="identitySec" class="scroll-margin card">
            <div class="card-header"><i class="fas fa-user-shield"></i> 身份·标识</div>
            <div class="identity-item"><i class="fas fa-leaf" style="color:#4caf50;"></i> 中国共青团团员</div>
            <div class="identity-item"><i class="fas fa-chalkboard-user" style="color:#ffb347;"></i> 希沃白板管理员</div>
            <div class="identity-item"><i class="fas fa-school"></i> 数字原住民 · 折腾家</div>
        </div>

        <!-- 联系方式 -->
        <div id="contactSec" class="scroll-margin card">
            <div class="card-header"><i class="fas fa-address-card"></i> 联系 · 社交</div>
            <div class="contact-row">
                <a class="contact-btn-link" id="qqAction"><i class="fab fa-qq"></i> QQ</a>
                <a class="contact-btn-link" id="wechatAction"><i class="fab fa-weixin"></i> 微信</a>
                <a class="contact-btn-link" id="githubAction" href="https://github.com/ssbtt114514" target="_blank"><i class="fab fa-github"></i> GitHub</a>
                <a class="contact-btn-link" id="biliAction" href="https://space.bilibili.com/3546557150399113" target="_blank"><i class="fab fa-bilibili"></i> Bilibili</a>
            </div>
            <div class="flex-info">
                <span class="copy-text" id="copyQQ"><i class="fab fa-qq"></i> QQ: 1973737092</span>
                <span class="copy-text" id="copyWechat"><i class="fab fa-weixin"></i> 微信号: ssbtt114514</span>
            </div>
            <div style="font-size: 0.7rem; text-align: center; margin-top: 10px; background: rgba(0,0,0,0.08); border-radius: 20px; padding: 8px;">
                <i class="fas fa-mobile-alt"></i> 点击微信按钮 → 复制微信号 (平台限制无法直接跳转主页)
            </div>
        </div>
        <footer><i class="fas fa-code-branch"></i> 毛玻璃双主题 · 目录可收缩 | 头像已指定</footer>
    </div>
</div>

<script>
    (function() {
        // ========== 1. 主题切换 ==========
        const themeBtn = document.getElementById('themeSwitch');
        const bodyEl = document.body;
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            bodyEl.classList.add('dark');
            if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
        } else {
            bodyEl.classList.remove('dark');
            if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            if (!savedTheme) localStorage.setItem('theme', 'light');
        }
        function toggleTheme() {
            if (bodyEl.classList.contains('dark')) {
                bodyEl.classList.remove('dark');
                localStorage.setItem('theme', 'light');
                if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-moon"></i>';
            } else {
                bodyEl.classList.add('dark');
                localStorage.setItem('theme', 'dark');
                if (themeBtn) themeBtn.innerHTML = '<i class="fas fa-sun"></i>';
            }
        }
        if (themeBtn) themeBtn.addEventListener('click', toggleTheme);

        // ========== 2. 目录收缩功能 ==========
        const dirWrapper = document.getElementById('directoryWrapper');
        const toggleBtn = document.getElementById('toggleDirBtn');
        const toggleTextSpan = document.getElementById('toggleDirText');
        let isDirCollapsed = false;
        function updateDirCollapse() {
            if (isDirCollapsed) {
                dirWrapper.style.maxHeight = '0px';
                dirWrapper.style.padding = '0';
                dirWrapper.style.borderBottomWidth = '0px';
                if (toggleTextSpan) toggleTextSpan.innerText = '展开目录';
            } else {
                dirWrapper.style.maxHeight = '200px';
                dirWrapper.style.padding = '';
                dirWrapper.style.borderBottomWidth = '1px';
                if (toggleTextSpan) toggleTextSpan.innerText = '收缩目录';
            }
        }
        if (toggleBtn) {
            toggleBtn.addEventListener('click', (e) => {
                e.preventDefault();
                isDirCollapsed = !isDirCollapsed;
                updateDirCollapse();
                localStorage.setItem('dirCollapsed', isDirCollapsed ? 'true' : 'false');
            });
        }
        const savedCollapse = localStorage.getItem('dirCollapsed');
        if (savedCollapse === 'true') {
            isDirCollapsed = true;
            updateDirCollapse();
        } else {
            isDirCollapsed = false;
            updateDirCollapse();
        }

        // ========== 3. 平滑滚动 ==========
        const scrollDiv = document.getElementById('scrollContainer');
        function scrollToElementId(id) {
            const target = document.getElementById(id);
            if (target && scrollDiv) {
                const offsetTop = target.offsetTop - scrollDiv.offsetTop - 25;
                scrollDiv.scrollTo({ top: Math.max(0, offsetTop), behavior: 'smooth' });
            } else if (target) {
                target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
        }
        document.querySelectorAll('.dir-chip').forEach(chip => {
            chip.addEventListener('click', (e) => {
                const targetId = chip.getAttribute('data-target');
                if (targetId) scrollToElementId(targetId);
            });
        });

        // ========== 4. 可点击标签跳转 ==========
        document.querySelectorAll('.clickable-badge').forEach(badge => {
            badge.addEventListener('click', (e) => {
                e.stopPropagation();
                const url = badge.getAttribute('data-url');
                if (url) window.open(url, '_blank');
                else alert('暂无跳转链接');
            });
        });
        document.querySelectorAll('.game-chip').forEach(game => {
            game.addEventListener('click', (e) => {
                const url = game.getAttribute('data-url');
                if (url) window.open(url, '_blank');
                else alert(`了解更多 ${game.innerText}`);
            });
        });

        // ========== 5. QQ / 微信 ==========
        const qqNumber = '1973737092';
        const wechatId = 'ssbtt114514';
        const qqBtn = document.getElementById('qqAction');
        const wechatBtn = document.getElementById('wechatAction');
        if (qqBtn) {
            qqBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
                if (isMobile) {
                    window.location.href = `mqq://card/show_pslcard?src_type=internal&version=1&uin=${qqNumber}`;
                    setTimeout(() => alert(`若无法跳转，请手动添加QQ：${qqNumber}`), 500);
                } else {
                    window.open(`https://user.qzone.qq.com/${qqNumber}`, '_blank');
                }
            });
        }
        if (wechatBtn) {
            wechatBtn.addEventListener('click', (e) => {
                e.preventDefault();
                const copyWx = () => {
                    if (navigator.clipboard && navigator.clipboard.writeText) {
                        navigator.clipboard.writeText(wechatId).then(() => alert(`微信号 ${wechatId} 已复制！请打开微信搜索添加`))
                        .catch(() => fallbackCopy());
                    } else { fallbackCopy(); }
                };
                const fallbackCopy = () => {
                    const textarea = document.createElement('textarea');
                    textarea.value = wechatId;
                    document.body.appendChild(textarea);
                    textarea.select();
                    document.execCommand('copy');
                    document.body.removeChild(textarea);
                    alert(`微信号 ${wechatId} 已复制！请前往微信添加`);
                };
                copyWx();
            });
        }
        // 复制文本
        const copyQQSpan = document.getElementById('copyQQ');
        const copyWechatSpan = document.getElementById('copyWechat');
        if (copyQQSpan) copyQQSpan.addEventListener('click', () => navigator.clipboard.writeText(qqNumber).then(() => alert('QQ号已复制')).catch(()=>alert('手动复制')));
        if (copyWechatSpan) copyWechatSpan.addEventListener('click', () => navigator.clipboard.writeText(wechatId).then(() => alert('微信号已复制')).catch(()=>alert('手动复制')));
    })();
</script>
</body>
</html>