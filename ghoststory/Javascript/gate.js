/**
 * 靈界之門：天與地 (電影級高清影片穿梭 + 雙界震撼音效管理)
 * 核心機制：
 * 1. 站內入口點擊轉場 (在 services 頁點擊進入時觸發，100% 手勢授權保證有聲播放，結束後跳轉)
 * 2. 外部直接進入 ghoststory (自動輪播天門/地門，sessionStorage 防止重複)
 * 3. 陰陽輪替：天門與地門每次交替出現
 */
(function() {
    const SESSION_KEY = 'spirit_gate_opened';
    const REALM_KEY = 'spirit_gate_last_realm';

    // 取得當前陣營（天界 / 地獄），交替輪播記錄
    function getNextRealm() {
        const lastRealm = localStorage.getItem(REALM_KEY);
        const nextRealm = (lastRealm === 'heaven') ? 'hell' : 'heaven';
        localStorage.setItem(REALM_KEY, nextRealm);
        return nextRealm;
    }

    /**
     * 核心開門函式
     * @param {Object} options
     * @param {string} [options.redirectUrl] 若提供跳轉網址，播放結束後導向該頁面 (入口轉場模式)
     * @param {boolean} [options.mustSound] 是否為使用者點擊觸發 (若是，瀏覽器保證允許有聲播放)
     */
    function playGateAnimation(options = {}) {
        const { redirectUrl = null, mustSound = false } = options;

        const realm = getNextRealm();
        const isHeaven = (realm === 'heaven');
        const videoSrc = isHeaven ? '/ghoststory/video/gate-heaven.mp4' : '/ghoststory/video/gate-hell.mp4';
        const hintText = isHeaven 
            ? '穿過雲海 · 步入天界 (點擊可略過)' 
            : '穿破黑霧 · 踏入幽冥 (點擊可略過)';

        const overlay = document.createElement('div');
        overlay.id = 'spirit-gate-overlay';
        overlay.innerHTML = `
            <video 
                class="gate-video-player" 
                playsinline 
                webkit-playsinline 
                preload="auto"
                aria-label="靈界之門入場動畫"
            >
                <source src="${videoSrc}" type="video/mp4">
            </video>
            
            <div class="gate-controls-group">
                <button class="gate-control-btn gate-sound-btn" type="button" aria-label="切換音效">🔊 靜音</button>
                <button class="gate-control-btn gate-skip-btn" type="button" aria-label="略過動畫">略過 ✕</button>
            </div>

            <div class="gate-enter-hint">${hintText}</div>
        `;

        document.body.appendChild(overlay);

        // 標記本次會話已開過門，目標頁面絕不重複彈出
        sessionStorage.setItem(SESSION_KEY, 'true');

        const video = overlay.querySelector('.gate-video-player');
        const soundBtn = overlay.querySelector('.gate-sound-btn');
        const skipBtn = overlay.querySelector('.gate-skip-btn');
        let isFinished = false;

        function finish() {
            if (isFinished) return;
            isFinished = true;
            overlay.classList.add('fade-out');

            setTimeout(() => {
                if (video) {
                    video.pause();
                    video.src = '';
                }
                if (overlay.parentNode) {
                    overlay.parentNode.removeChild(overlay);
                }
                if (redirectUrl) {
                    window.location.href = redirectUrl;
                }
            }, redirectUrl ? 300 : 700);
        }

        function unmuteSound() {
            if (!video) return;
            video.muted = false;
            video.volume = 1.0;
            if (soundBtn) {
                soundBtn.innerHTML = '🔊 靜音';
                soundBtn.classList.remove('pulse');
            }
        }

        function muteSound() {
            if (!video) return;
            video.muted = true;
            if (soundBtn) {
                soundBtn.innerHTML = '🔇 開啟聲音';
            }
        }

        // 略過按鈕
        if (skipBtn) {
            skipBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                finish();
            });
        }

        // 音效開關按鈕
        if (soundBtn) {
            soundBtn.addEventListener('click', (e) => {
                e.stopPropagation();
                if (video && video.muted) {
                    unmuteSound();
                } else {
                    muteSound();
                }
            });
        }

        // 點擊畫面任意處：若靜音則解鎖聲音，若已出聲則略過進站
        overlay.addEventListener('click', () => {
            if (video && video.muted) {
                unmuteSound();
            } else {
                finish();
            }
        });

        if (video) {
            video.addEventListener('ended', finish);

            video.addEventListener('timeupdate', () => {
                if (video.duration && video.currentTime >= video.duration - 0.6) {
                    finish();
                }
            });

            video.addEventListener('error', finish);

            // 播放啟動邏輯
            if (mustSound) {
                // 使用者點擊手勢觸發：100% 滿音量直接播放
                unmuteSound();
                video.play().catch(() => {
                    video.muted = true;
                    video.play().catch(finish);
                });
            } else {
                // 自動播放情境：嘗試有聲，若被瀏覽器攔截則降級靜音
                video.muted = false;
                const playPromise = video.play();
                if (playPromise !== undefined) {
                    playPromise.then(() => {
                        unmuteSound();
                    }).catch(() => {
                        muteSound();
                        if (soundBtn) soundBtn.classList.add('pulse');
                        video.play().catch(finish);
                    });
                }
            }
        }

        setTimeout(finish, 10500);
    }

    // 暴露全域 API 給入口頁面點擊呼叫
    window.openSpiritGate = playGateAnimation;

    // 若當前在 ghoststory 頁面，執行常規的首次進入自播判定
    const isGhostStoryPage = location.pathname.includes('/ghoststory');
    if (isGhostStoryPage) {
        if (!sessionStorage.getItem(SESSION_KEY)) {
            if (!window.matchMedia || !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', () => playGateAnimation());
                } else {
                    playGateAnimation();
                }
            }
        }
    }
})();
