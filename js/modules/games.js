window.GamesModule = {
    init(containerId) {
        const container = document.getElementById(containerId);
        if (!container) return;
        container.innerHTML = `
            <div class="glass-card">
                <div class="section-title"><i class="fas fa-dice-d6"></i> 游戏世界</div>
                <div class="badge-group">
                    <a href="https://www.minecraft.net/" target="_blank" class="game-bubble"><i class="fas fa-cube"></i> Minecraft</a>
                    <a href="https://anuke.itch.io/mindustry" target="_blank" class="game-bubble"><i class="fas fa-industry"></i> Mindustry</a>
                    <a href="https://deltarune.com/" target="_blank" class="game-bubble"><i class="fas fa-heart"></i> 三角符文</a>
                    <a href="https://aqtk.qq.com/" target="_blank" class="game-bubble"><i class="fas fa-crosshairs"></i> 暗区突围</a>
                    <a href="https://www.half-life.com/" target="_blank" class="game-bubble"><i class="fas fa-vial"></i> 半条命</a>
                    <div class="game-bubble" style="cursor:default;"><i class="fas fa-puzzle-piece"></i> 怀旧 / 策略 / 沙盒</div>
                </div>
                <div style="margin-top: 24px; background: rgba(108,141,255,0.1); border-radius: 20px; padding: 12px;">
                    <i class="fas fa-microphone-alt"></i> "游戏是第九艺术，我热衷在代码和关卡中创造张力。"
                </div>
            </div>
        `;
    }
};