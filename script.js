const eatAudio = new Audio('assets/audio.mp3');

const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

const playSound = (type) => {
    if (type === 'eat') {
        eatAudio.currentTime = 0;
        eatAudio.play().catch(() => {});
        return;
    }

    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }

    const now = audioCtx.currentTime;

    if (type === 'move') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(150, now);
        osc.frequency.exponentialRampToValueAtTime(80, now + 0.04);
        gain.gain.setValueAtTime(0.04, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
        osc.start(now);
        osc.stop(now + 0.04);
    } 
    else if (type === 'gameover') {
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(180, now);
        osc.frequency.exponentialRampToValueAtTime(40, now + 0.4);
        gain.gain.setValueAtTime(0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 0.4);
        osc.start(now);
        osc.stop(now + 0.4);
    } 
    else if (type === 'achievement') {
        const notes = [523.25, 659.25, 783.99, 1046.50];
        notes.forEach((freq, index) => {
            const noteOsc = audioCtx.createOscillator();
            const noteGain = audioCtx.createGain();
            noteOsc.connect(noteGain);
            noteGain.connect(audioCtx.destination);

            const startTime = now + index * 0.07;
            noteOsc.type = 'sine';
            noteOsc.frequency.setValueAtTime(freq, startTime);
            noteGain.gain.setValueAtTime(0.2, startTime);
            noteGain.gain.exponentialRampToValueAtTime(0.01, startTime + 0.15);

            noteOsc.start(startTime);
            noteOsc.stop(startTime + 0.15);
        });
    }
};

const bgMusic = new Audio('assets/musica-fundo.mp3');
bgMusic.loop = true;
bgMusic.volume = 0.4;

const playBgMusic = () => {
    bgMusic.currentTime = 0;
    bgMusic.play().catch(() => {});
};

const stopBgMusic = () => {
    bgMusic.pause();
};

const canvas = document.querySelector("canvas");
const ctx = canvas.getContext("2d");

const score = document.querySelector(".score--value");
const highScoreEl = document.querySelector(".high-score--value");
const finalScore = document.querySelector(".final-score + span");

const startScreen = document.querySelector(".start-screen");
const skinsScreen = document.querySelector(".skins-screen");
const achievementsScreen = document.querySelector(".achievements-screen");
const pauseScreen = document.querySelector(".pause-screen");
const menu = document.querySelector(".menu-screen");

const buttonStart = document.querySelector(".btn-start");
const buttonPlay = document.querySelector(".btn-play");
const buttonOpenSkins = document.querySelector(".btn-open-skins");
const buttonOpenAchievements = document.querySelector(".btn-open-achievements");
const buttonResume = document.querySelector(".btn-resume");
const buttonPauseHud = document.getElementById("btnPauseHud");
const buttonFullscreen = document.getElementById("btnFullscreen");
const buttonsQuitToMenu = document.querySelectorAll(".btn-quit-to-menu");
const buttonsCloseOverlay = document.querySelectorAll(".btn-close-overlay");

const skinsContainer = document.getElementById("skinsContainer");
const achievementsContainer = document.getElementById("achievementsContainer");
const toastAchievement = document.getElementById("toastAchievement");
const toastName = document.getElementById("toastName");

const size = 30;

let snake = [
    { x: 270, y: 240 },
    { x: 300, y: 240 },
    { x: 330, y: 240 }
];

let foodsEatenSession = 0;
let isGameRunning = false;
let isPaused = false;
let currentSkinIndex = 0;
let toastTimeout;
let gameSpeed = 100;
let highScore = parseInt(localStorage.getItem("snake_highscore_v1") || "0", 10);
highScoreEl.innerText = highScore;

let direction;
let nextDirection;
let particles = [];

const createParticles = (x, y, color) => {
    for (let i = 0; i < 12; i++) {
        particles.push({
            x: x + size / 2,
            y: y + size / 2,
            vx: (Math.random() - 0.5) * 8,
            vy: (Math.random() - 0.5) * 8,
            life: 1.0,
            color: color
        });
    }
};

const drawParticles = () => {
    for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.life -= 0.04;
        
        if (p.life <= 0) {
            particles.splice(i, 1);
        } else {
            ctx.save();
            ctx.fillStyle = p.color;
            ctx.globalAlpha = p.life;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 6;
            ctx.beginPath();
            ctx.arc(p.x, p.y, 3, 0, Math.PI * 2);
            ctx.fill();
            ctx.restore();
        }
    }
};

const skins = [
    {
        id: "classic", name: "Neon Clássica", glow: "#7dff8c",
        drawHead: (ctx, s) => {
            const headGrad = ctx.createLinearGradient(-s / 2, 0, s / 2, 0);
            headGrad.addColorStop(0, "#1fbf5c"); headGrad.addColorStop(1, "#7dff8c");
            ctx.fillStyle = headGrad; ctx.beginPath();
            ctx.moveTo(s * 0.55, 0); ctx.quadraticCurveTo(s * 0.3, -s * 0.42, -s * 0.4, -s * 0.34);
            ctx.quadraticCurveTo(-s * 0.55, 0, -s * 0.4, s * 0.34); ctx.quadraticCurveTo(s * 0.3, s * 0.42, s * 0.55, 0); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            const r = Math.round(57 + (0 - 57) * t); const g = Math.round(255 + (197 - 255) * t); const b = Math.round(136 + (255 - 136) * t);
            ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
            roundedRectPath(ctx, -s * 0.41, -s * 0.41, s * 0.82, s * 0.82, 6); ctx.fill();
        }
    },
    {
        id: "fire", name: "Chama Vulcânica", glow: "#ff3300",
        drawHead: (ctx, s) => {
            const grad = ctx.createLinearGradient(-s / 2, 0, s / 2, 0);
            grad.addColorStop(0, "#ff0000"); grad.addColorStop(0.5, "#ff6600"); grad.addColorStop(1, "#ffcc00");
            ctx.fillStyle = grad; ctx.beginPath();
            ctx.moveTo(s * 0.6, 0); ctx.lineTo(-s * 0.4, -s * 0.4); ctx.lineTo(-s * 0.3, 0); ctx.lineTo(-s * 0.4, s * 0.4); ctx.closePath(); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = t % 0.2 < 0.1 ? "#ff2200" : "#ff9900";
            roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 4); ctx.fill();
            ctx.fillStyle = "#ffee00"; ctx.beginPath(); ctx.arc(0, 0, s * 0.15, 0, Math.PI * 2); ctx.fill();
        }
    },
    {
        id: "cyber", name: "Cyber Matrix", glow: "#00ff66",
        drawHead: (ctx, s) => {
            ctx.fillStyle = "#002b11"; ctx.strokeStyle = "#00ff66"; ctx.lineWidth = 2;
            ctx.fillRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8); ctx.strokeRect(-s * 0.4, -s * 0.4, s * 0.8, s * 0.8);
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = "#051a0e"; ctx.strokeStyle = "#00ff66"; ctx.lineWidth = 1.5;
            ctx.fillRect(-s * 0.38, -s * 0.38, s * 0.76, s * 0.76); ctx.strokeRect(-s * 0.38, -s * 0.38, s * 0.76, s * 0.76);
            ctx.fillStyle = "#00ff66"; ctx.fillRect(-s * 0.1, -s * 0.1, s * 0.2, s * 0.2);
        }
    },
    {
        id: "gold", name: "Rei do Ouro", glow: "#ffd700",
        drawHead: (ctx, s) => {
            const grad = ctx.createLinearGradient(-s / 2, -s / 2, s / 2, s / 2);
            grad.addColorStop(0, "#ffe600"); grad.addColorStop(0.5, "#b8860b"); grad.addColorStop(1, "#fff8dc");
            ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            const grad = ctx.createLinearGradient(-s / 2, 0, s / 2, 0);
            grad.addColorStop(0, "#d4af37"); grad.addColorStop(0.5, "#fff2a3"); grad.addColorStop(1, "#aa7c11");
            ctx.fillStyle = grad; roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 8); ctx.fill();
        }
    },
    {
        id: "rainbow", name: "Arco-Íris Neon", glow: "#ff00ff",
        drawHead: (ctx, s) => {
            ctx.fillStyle = `hsl(${(Date.now() / 10) % 360}, 100%, 60%)`;
            ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = `hsl(${(t * 360 + Date.now() / 12) % 360}, 100%, 55%)`;
            roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 7); ctx.fill();
        }
    },
    {
        id: "ghost", name: "Fantasma Gelo", glow: "#00e5ff",
        drawHead: (ctx, s) => {
            ctx.fillStyle = "rgba(0, 229, 255, 0.75)"; ctx.beginPath(); ctx.arc(0, 0, s * 0.42, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.beginPath(); ctx.arc(0, 0, s * 0.2, 0, Math.PI * 2); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = "rgba(180, 245, 255, 0.55)"; ctx.strokeStyle = "#00e5ff"; ctx.lineWidth = 1.5;
            roundedRectPath(ctx, -s * 0.38, -s * 0.38, s * 0.76, s * 0.76, 10); ctx.fill(); ctx.stroke();
        }
    },
    {
        id: "poison", name: "Veneno Ácido", glow: "#ff00ff",
        drawHead: (ctx, s) => {
            ctx.fillStyle = "#7b2cbf"; ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#39ff88"; ctx.beginPath(); ctx.arc(s * 0.1, -s * 0.1, s * 0.15, 0, Math.PI * 2); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = "#5a189a"; roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 6); ctx.fill();
            ctx.fillStyle = "#39ff88"; ctx.beginPath(); ctx.arc(-s * 0.1, s * 0.1, s * 0.12, 0, Math.PI * 2); ctx.fill();
        }
    },
    {
        id: "galaxy", name: "Galáxia Cósmica", glow: "#9d4edd",
        drawHead: (ctx, s) => {
            const g = ctx.createRadialGradient(0, 0, 2, 0, 0, s * 0.5);
            g.addColorStop(0, "#e0aaff"); g.addColorStop(0.6, "#3c096c"); g.addColorStop(1, "#10002b");
            ctx.fillStyle = g; ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = "#240046"; roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 6); ctx.fill();
            ctx.fillStyle = "#ffffff"; ctx.fillRect(-s * 0.2, -s * 0.1, 3, 3); ctx.fillRect(s * 0.15, s * 0.15, 2, 2);
        }
    },
    {
        id: "tiger", name: "Tigre Selvagem", glow: "#ff7700",
        drawHead: (ctx, s) => {
            ctx.fillStyle = "#ff7700"; ctx.beginPath(); ctx.arc(0, 0, s * 0.44, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = "#1a0d00"; ctx.fillRect(-s * 0.3, -s * 0.1, s * 0.6, s * 0.2);
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = "#ff8800"; roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 5); ctx.fill();
            ctx.fillStyle = "#221100"; ctx.beginPath(); ctx.moveTo(-s * 0.3, -s * 0.4); ctx.lineTo(0, 0); ctx.lineTo(-s * 0.3, s * 0.4); ctx.fill();
        }
    },
    {
        id: "electric", name: "Raio Elétrico", glow: "#00d2ff",
        drawHead: (ctx, s) => {
            ctx.fillStyle = "#00d2ff"; ctx.beginPath(); ctx.arc(0, 0, s * 0.45, 0, Math.PI * 2); ctx.fill();
            ctx.strokeStyle = "#ffffff"; ctx.lineWidth = 2; ctx.beginPath();
            ctx.moveTo(-s * 0.2, -s * 0.2); ctx.lineTo(0, 0); ctx.lineTo(-s * 0.1, 0); ctx.lineTo(s * 0.2, s * 0.2); ctx.stroke();
        },
        drawBody: (ctx, s, t) => {
            ctx.fillStyle = "#0077b6"; roundedRectPath(ctx, -s * 0.4, -s * 0.4, s * 0.8, s * 0.8, 5); ctx.fill();
            ctx.strokeStyle = "#90e0ef"; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-s * 0.3, 0); ctx.lineTo(s * 0.3, 0); ctx.stroke();
        }
    }
];

const achievementsData = [
    { id: "first_eat", title: "Primeira Mordida", desc: "Coma a primeira comida no jogo.", unlocked: false },
    { id: "score_50", title: "Apetite Neon", desc: "Alcançou 50 pontos numa partida.", unlocked: false },
    { id: "score_150", title: "Gourmet das Galáxias", desc: "Alcançou 150 pontos numa partida.", unlocked: false },
    { id: "score_300", title: "Lenda da Cobra", desc: "Alcançou 300 pontos numa partida.", unlocked: false },
    { id: "skin_change", title: "Estiloso", desc: "Trocou a skin da cobra no menu.", unlocked: false },
    { id: "fast_5", title: "Banquete", desc: "Coma 5 comidas na mesma partida.", unlocked: false },
    { id: "snake_size_10", title: "Cobra Gigante", desc: "Chegue a um tamanho de 10 segmentos.", unlocked: false }
];

const loadAchievements = () => {
    const saved = localStorage.getItem("snake_achievements_v1");
    if (saved) {
        try {
            const parsed = JSON.parse(saved);
            achievementsData.forEach(ach => {
                if (parsed[ach.id]) ach.unlocked = true;
            });
        } catch (e) {}
    }
};

const saveAchievements = () => {
    const obj = {};
    achievementsData.forEach(ach => obj[ach.id] = ach.unlocked);
    localStorage.setItem("snake_achievements_v1", JSON.stringify(obj));
};

const unlockAchievement = (id) => {
    const ach = achievementsData.find(a => a.id === id);
    if (ach && !ach.unlocked) {
        ach.unlocked = true;
        saveAchievements();
        playSound('achievement');
        showToast(ach.title);
        renderAchievementsList();
    }
};

const showToast = (name) => {
    clearTimeout(toastTimeout);
    toastName.innerText = name;
    toastAchievement.classList.add("show");
    toastTimeout = setTimeout(() => {
        toastAchievement.classList.remove("show");
    }, 3500);
};

const roundedRectPath = (ctx, x, y, w, h, r) => {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
};

const renderSkinsMenu = () => {
    skinsContainer.innerHTML = "";
    skins.forEach((skin, index) => {
        const card = document.createElement("div");
        card.className = `skin-card ${index === currentSkinIndex ? 'selected' : ''}`;
        
        const previewCanvas = document.createElement("canvas");
        previewCanvas.width = 60;
        previewCanvas.height = 60;
        const pctx = previewCanvas.getContext("2d");

        pctx.translate(30, 30);
        pctx.shadowColor = skin.glow;
        pctx.shadowBlur = 8;
        skin.drawBody(pctx, 40, 0.2);
        skin.drawHead(pctx, 40);

        const nameSpan = document.createElement("span");
        nameSpan.className = "skin-name";
        nameSpan.innerText = skin.name;

        card.appendChild(previewCanvas);
        card.appendChild(nameSpan);

        card.addEventListener("click", () => {
            currentSkinIndex = index;
            renderSkinsMenu();
            unlockAchievement("skin_change");
        });

        skinsContainer.appendChild(card);
    });
};

const renderAchievementsList = () => {
    achievementsContainer.innerHTML = "";
    achievementsData.forEach(ach => {
        const card = document.createElement("div");
        card.className = `achievement-card ${ach.unlocked ? 'unlocked' : 'locked'}`;
        card.innerHTML = `
            <div class="achievement-icon">
                <span class="material-symbols-outlined">${ach.unlocked ? 'workspace_premium' : 'lock'}</span>
            </div>
            <div class="achievement-info">
                <div class="achievement-title">${ach.title}</div>
                <div class="achievement-desc">${ach.desc}</div>
            </div>
            <div class="achievement-status">${ach.unlocked ? 'Concluída' : 'Bloqueada'}</div>
        `;
        achievementsContainer.appendChild(card);
    });
};

const foodProfiles = [
    {
        name: "apple", glow: "#8bff7a", draw: (s) => {
            const r = s * 0.36;
            ctx.beginPath(); ctx.arc(0, -r*0.2, r, 0, Math.PI * 2); ctx.fillStyle = "#e0272f"; ctx.fill();
            ctx.beginPath(); ctx.ellipse(r*0.35, -r*1.1, r*0.3, r*0.15, -0.5, 0, Math.PI*2); ctx.fillStyle = "#4ad66d"; ctx.fill();
            ctx.strokeStyle = "#5c3a21"; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(0,-r*0.8); ctx.quadraticCurveTo(r*0.1,-r*1.1, r*0.2,-r*1.2); ctx.stroke();
        }
    },
    {
        name: "pizza", glow: "#ffb020", draw: (s) => {
            const r = s * 0.5;
            ctx.save(); ctx.rotate(Math.PI / 4);
            ctx.beginPath(); ctx.moveTo(0, -r * 0.15); ctx.lineTo(-r * 0.85, r * 0.85); ctx.lineTo(r * 0.85, r * 0.85); ctx.closePath();
            ctx.fillStyle = "#f6c453"; ctx.fill();
            ctx.beginPath(); ctx.moveTo(0, -r * 0.05); ctx.lineTo(-r * 0.7, r * 0.75); ctx.lineTo(r * 0.7, r * 0.75); ctx.closePath();
            ctx.fillStyle = "#ffd35c"; ctx.fill();
            ctx.fillStyle = "#e0433c";
            [[-r*0.2, r*0.2], [r*0.2, r*0.3], [0, r*0.5]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, r*0.15, 0, Math.PI*2); ctx.fill(); });
            ctx.restore();
        }
    },
    {
        name: "donut", glow: "#ff6fb0", draw: (s) => {
            const r = s * 0.45;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = "#c17a3f"; ctx.fill();
            ctx.beginPath(); ctx.arc(0, -r * 0.05, r * 0.86, 0, Math.PI * 2); ctx.fillStyle = "#ff6fb0"; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 0, r * 0.3, 0, Math.PI * 2); ctx.fillStyle = "#05050c"; ctx.fill();
            ctx.fillStyle = "#fff"; ctx.fillRect(-r*0.4, -r*0.4, 4, 1.5); ctx.fillStyle = "#ffe066"; ctx.fillRect(r*0.3, -r*0.2, 1.5, 4);
        }
    },
    {
        name: "burger", glow: "#ffcf4d", draw: (s) => {
            const w = s * 0.8;
            ctx.fillStyle = "#d98a3d"; roundedRectPath(ctx, -w/2, s*0.16, w, s*0.14, 4); ctx.fill();
            ctx.fillStyle = "#5a3421"; roundedRectPath(ctx, -w/2, 0, w, s*0.14, 4); ctx.fill();
            ctx.fillStyle = "#5bd15b"; roundedRectPath(ctx, -w/2 - 2, -s*0.05, w + 4, s*0.08, 3); ctx.fill();
            ctx.fillStyle = "#e8a154"; ctx.beginPath(); ctx.moveTo(-w/2, -s*0.03); ctx.quadraticCurveTo(0, -s*0.45, w/2, -s*0.03); ctx.closePath(); ctx.fill();
            ctx.fillStyle = "#fff3d6";
            [[-w*0.2, -s*0.2], [0, -s*0.25], [w*0.2, -s*0.2]].forEach(([px, py]) => { ctx.beginPath(); ctx.ellipse(px, py, 1.5, 1, 0, 0, Math.PI*2); ctx.fill(); });
        }
    },
    {
        name: "watermelon", glow: "#ff4d4d", draw: (s) => {
            const r = s * 0.45;
            ctx.save(); ctx.rotate(Math.PI / 4);
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI); ctx.fillStyle = "#2e8b57"; ctx.fill();
            ctx.beginPath(); ctx.arc(0, 0, r * 0.85, 0, Math.PI); ctx.fillStyle = "#ff4d4d"; ctx.fill();
            ctx.fillStyle = "#111";
            [[-r*0.4, r*0.3], [0, r*0.5], [r*0.4, r*0.3]].forEach(([px, py]) => { ctx.beginPath(); ctx.arc(px, py, 1.5, 0, Math.PI*2); ctx.fill(); });
            ctx.restore();
        }
    },
    {
        name: "cookie", glow: "#c19a6b", draw: (s) => {
            const r = s * 0.45;
            ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fillStyle = "#d1a877"; ctx.fill();
            ctx.fillStyle = "#4a2511";
            [[-r*0.4,-r*0.3], [r*0.3,-r*0.4], [0,0], [-r*0.5,r*0.2], [r*0.4,r*0.4], [-r*0.1,r*0.5]].forEach(([px,py]) => {
                ctx.beginPath(); ctx.arc(px, py, r*0.18, 0, Math.PI*2); ctx.fill();
            });
        }
    },
    {
        name: "sushi", glow: "#ffffff", draw: (s) => {
            const w = s * 0.65; const h = s * 0.55;
            ctx.fillStyle = "#1a1a1a"; roundedRectPath(ctx, -w/2, -h/2, w, h, 6); ctx.fill();
            ctx.fillStyle = "#f5f5f5"; ctx.beginPath(); ctx.arc(0, 0, h*0.38, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "#ff7f50"; ctx.beginPath(); ctx.arc(0, 0, h*0.18, 0, Math.PI*2); ctx.fill();
        }
    },
    {
        name: "cherry", glow: "#ff0033", draw: (s) => {
            const r = s * 0.22;
            ctx.strokeStyle = "#4ad66d"; ctx.lineWidth = 2;
            ctx.beginPath(); ctx.moveTo(0, -s*0.35); ctx.quadraticCurveTo(-s*0.1, -s*0.1, -s*0.2, s*0.1); ctx.stroke();
            ctx.beginPath(); ctx.moveTo(0, -s*0.35); ctx.quadraticCurveTo(s*0.1, -s*0.1, s*0.2, s*0.1); ctx.stroke();
            ctx.fillStyle = "#cc0000";
            ctx.beginPath(); ctx.arc(-s*0.2, s*0.1, r, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(s*0.2, s*0.1, r, 0, Math.PI*2); ctx.fill();
            ctx.fillStyle = "rgba(255,255,255,0.4)";
            ctx.beginPath(); ctx.arc(-s*0.25, s*0.05, r*0.3, 0, Math.PI*2); ctx.fill();
            ctx.beginPath(); ctx.arc(s*0.15, s*0.05, r*0.3, 0, Math.PI*2); ctx.fill();
        }
    }
];

const incrementScore = () => {
    const currentScore = +score.innerText + 10;
    score.innerText = currentScore;

    if (currentScore > highScore) {
        highScore = currentScore;
        highScoreEl.innerText = highScore;
        localStorage.setItem("snake_highscore_v1", highScore);
    }

    if (currentScore >= 50) unlockAchievement("score_50");
    if (currentScore >= 150) unlockAchievement("score_150");
    if (currentScore >= 300) unlockAchievement("score_300");
};

const randomNumber = (min, max) => Math.round(Math.random() * (max - min) + min);
const randomPosition = () => Math.round(randomNumber(0, canvas.width - size) / 30) * 30;

let food = {
    x: randomPosition(),
    y: randomPosition(),
    profile: foodProfiles[0],
};

let loopID;

const drawFood = () => {
    const { x, y, profile } = food;
    const cx = x + size / 2;
    const cy = y + size / 2;
    const pulse = 1 + Math.sin(Date.now() / 220) * 0.06;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.scale(pulse, pulse);
    ctx.shadowColor = profile.glow;
    ctx.shadowBlur = 16;
    profile.draw(size);
    ctx.restore();
    ctx.shadowBlur = 0;
};

const dirAngle = { right: 0, down: Math.PI / 2, left: Math.PI, up: -Math.PI / 2 };

const drawSnakeHead = (position, angle) => {
    const cx = position.x + size / 2;
    const cy = position.y + size / 2;
    const skin = skins[currentSkinIndex];

    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(angle);
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 14;

    skin.drawHead(ctx, size);
    ctx.shadowBlur = 0;

    ctx.fillStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(size * 0.1, -size * 0.16, 3.8, 0, Math.PI * 2);
    ctx.arc(size * 0.1, size * 0.16, 3.8, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = "#0a0a14";
    ctx.beginPath();
    ctx.arc(size * 0.14, -size * 0.16, 1.8, 0, Math.PI * 2);
    ctx.arc(size * 0.14, size * 0.16, 1.8, 0, Math.PI * 2);
    ctx.fill();

    const tongueLen = (Math.sin(Date.now() / 150) + 1) * 4 + 2;
    ctx.strokeStyle = "#ff2ec4";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(size * 0.45, 0);
    ctx.lineTo(size * 0.45 + tongueLen, 0);
    ctx.lineTo(size * 0.45 + tongueLen + 2, -2);
    ctx.moveTo(size * 0.45 + tongueLen, 0);
    ctx.lineTo(size * 0.45 + tongueLen + 2, 2);
    ctx.stroke();

    ctx.restore();
};

const drawSnakeBody = (position, index, total) => {
    const cx = position.x + size / 2;
    const cy = position.y + size / 2;
    const skin = skins[currentSkinIndex];
    const t = total > 1 ? index / (total - 1) : 0;

    ctx.save();
    ctx.translate(cx, cy);
    ctx.shadowColor = skin.glow;
    ctx.shadowBlur = 8;
    skin.drawBody(ctx, size, t);
    ctx.restore();
};

const drawSnake = () => {
    const total = snake.length;
    snake.forEach((position, index) => {
        if (index !== total - 1) drawSnakeBody(position, index, total);
    });
    const head = snake[total - 1];
    drawSnakeHead(head, dirAngle[direction] ?? 0);
};

const moveSnake = () => {
    direction = nextDirection;
    if (!direction) return;

    const head = snake[snake.length - 1];

    if (direction === "right") snake.push({ x: head.x + size, y: head.y });
    if (direction === "left") snake.push({ x: head.x - size, y: head.y });
    if (direction === "down") snake.push({ x: head.x, y: head.y + size });
    if (direction === "up") snake.push({ x: head.x, y: head.y - size });

    snake.shift();
};

const drawGrid = () => {
    ctx.lineWidth = 1;
    ctx.strokeStyle = "#191919";
    for (let i = 30; i < canvas.width; i += 30) {
        ctx.beginPath(); ctx.lineTo(i, 0); ctx.lineTo(i, 600); ctx.stroke();
        ctx.beginPath(); ctx.lineTo(0, i); ctx.lineTo(600, i); ctx.stroke();
    }
};

const checkEat = () => {
    const head = snake[snake.length - 1];

    if (head.x === food.x && head.y === food.y) {
        snake.push({ x: head.x, y: head.y });
        incrementScore();
        createParticles(food.x, food.y, food.profile.glow);
        playSound('eat');

        foodsEatenSession++;
        unlockAchievement("first_eat");
        if (foodsEatenSession >= 5) unlockAchievement("fast_5");
        if (snake.length >= 10) unlockAchievement("snake_size_10");

        gameSpeed = Math.max(50, 100 - Math.floor(foodsEatenSession / 2) * 2);

        let x = randomPosition();
        let y = randomPosition();
        while (snake.find((pos) => pos.x === x && pos.y === y)) {
            x = randomPosition();
            y = randomPosition();
        }

        food.x = x;
        food.y = y;
        food.profile = foodProfiles[randomNumber(0, foodProfiles.length - 1)];
    }
};

const checkCollision = () => {
    const head = snake[snake.length - 1];
    const canvasLimit = canvas.width - size;
    const neckIndex = snake.length - 2;

    const wallCollision = head.x > canvasLimit || head.x < 0 || head.y < 0 || head.y > canvasLimit;
    const selfCollision = snake.find((pos, index) => index < neckIndex && pos.x === head.x && pos.y === head.y);

    if (wallCollision || selfCollision) gameOver();
};

const gameOver = () => {
    playSound('gameover');
    isGameRunning = false;
    buttonPauseHud.style.display = "none";
    direction = undefined;
    nextDirection = undefined;
    menu.style.display = "flex";
    finalScore.innerText = score.innerText;
    stopBgMusic();
};

const resetGame = () => {
    score.innerText = "00";
    foodsEatenSession = 0;
    gameSpeed = 100;
    particles = [];
    menu.style.display = "none";
    startScreen.style.display = "none";
    pauseScreen.style.display = "none";
    buttonPauseHud.style.display = "flex";
    
    snake = [
        { x: 270, y: 240 },
        { x: 300, y: 240 },
        { x: 330, y: 240 }
    ];
    direction = undefined;
    nextDirection = undefined;
    isPaused = false;
    isGameRunning = true;
    playBgMusic();
};

const pauseGame = () => {
    if (!isGameRunning) return;
    isPaused = true;
    pauseScreen.style.display = "flex";
    bgMusic.pause();
};

const resumeGame = () => {
    isPaused = false;
    pauseScreen.style.display = "none";
    bgMusic.play().catch(() => {});
};

const quitToMenu = () => {
    isGameRunning = false;
    isPaused = false;
    pauseScreen.style.display = "none";
    menu.style.display = "none";
    buttonPauseHud.style.display = "none";
    startScreen.style.display = "flex";
    stopBgMusic();
};

const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().catch(() => {});
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen().catch(() => {});
        }
    }
};

const gameLoop = () => {
    clearInterval(loopID);
    ctx.clearRect(0, 0, 600, 600);

    drawGrid();
    drawFood();
    drawParticles();

    if (isGameRunning && !isPaused) {
        moveSnake();
        checkEat();
        checkCollision();
    }

    drawSnake();

    loopID = setTimeout(() => {
        gameLoop();
    }, gameSpeed);
};

buttonStart.addEventListener("click", resetGame);
buttonPlay.addEventListener("click", resetGame);

buttonPauseHud.addEventListener("click", pauseGame);
buttonResume.addEventListener("click", resumeGame);
buttonsQuitToMenu.forEach(btn => btn.addEventListener("click", quitToMenu));

buttonFullscreen.addEventListener("click", toggleFullscreen);

document.addEventListener("fullscreenchange", () => {
    const icon = buttonFullscreen.querySelector(".material-symbols-outlined");
    if (document.fullscreenElement) {
        icon.innerText = "fullscreen_exit";
    } else {
        icon.innerText = "fullscreen";
    }
});

buttonOpenSkins.addEventListener("click", () => {
    renderSkinsMenu();
    startScreen.style.display = "none";
    skinsScreen.style.display = "flex";
});

buttonOpenAchievements.addEventListener("click", () => {
    renderAchievementsList();
    startScreen.style.display = "none";
    achievementsScreen.style.display = "flex";
});

buttonsCloseOverlay.forEach(btn => {
    btn.addEventListener("click", () => {
        skinsScreen.style.display = "none";
        achievementsScreen.style.display = "none";
        startScreen.style.display = "flex";
    });
});

document.addEventListener("keydown", ({ key }) => {
    if (key === "p" || key === "P" || key === "Escape") {
        if (isGameRunning) {
            if (isPaused) resumeGame();
            else pauseGame();
        }
    }

    if (!isGameRunning || isPaused) return;

    let targetDir = null;
    if ((key === "ArrowRight" || key === "d" || key === "D") && direction !== "left") targetDir = "right";
    if ((key === "ArrowLeft" || key === "a" || key === "A") && direction !== "right") targetDir = "left";
    if ((key === "ArrowUp" || key === "w" || key === "W") && direction !== "down") targetDir = "up";
    if ((key === "ArrowDown" || key === "s" || key === "S") && direction !== "up") targetDir = "down";

    if (targetDir && targetDir !== nextDirection) {
        nextDirection = targetDir;
        playSound('move');
    }
});

let touchStartX = 0;
let touchStartY = 0;

document.addEventListener("touchstart", (e) => {
    touchStartX = e.touches[0].clientX;
    touchStartY = e.touches[0].clientY;
}, { passive: true });

document.addEventListener("touchmove", (e) => {
    if (isGameRunning && !isPaused) e.preventDefault();
}, { passive: false });

document.addEventListener("touchend", (e) => {
    if (!isGameRunning || isPaused || !touchStartX || !touchStartY) return;

    let diffX = e.changedTouches[0].clientX - touchStartX;
    let diffY = e.changedTouches[0].clientY - touchStartY;
    let targetDir = null;

    if (Math.abs(diffX) > 30 || Math.abs(diffY) > 30) {
        if (Math.abs(diffX) > Math.abs(diffY)) {
            if (diffX > 0 && direction !== "left") targetDir = "right";
            else if (diffX < 0 && direction !== "right") targetDir = "left";
        } else {
            if (diffY > 0 && direction !== "up") targetDir = "down";
            else if (diffY < 0 && direction !== "down") targetDir = "up";
        }
    }

    if (targetDir && targetDir !== nextDirection) {
        nextDirection = targetDir;
        playSound('move');
    }

    touchStartX = 0;
    touchStartY = 0;
}, { passive: true });

const dpadButtons = document.querySelectorAll(".dpad-btn");
const setDirection = (dir) => {
    if (!isGameRunning || isPaused) return;
    let targetDir = null;

    if (dir === "right" && direction !== "left") targetDir = "right";
    if (dir === "left" && direction !== "right") targetDir = "left";
    if (dir === "up" && direction !== "down") targetDir = "down";
    if (dir === "down" && direction !== "up") targetDir = "down";

    if (targetDir && targetDir !== nextDirection) {
        nextDirection = targetDir;
        playSound('move');
    }
};

dpadButtons.forEach((btn) => {
    btn.addEventListener("touchstart", (e) => {
        e.preventDefault();
        setDirection(btn.dataset.dir);
    }, { passive: false });
    btn.addEventListener("click", () => setDirection(btn.dataset.dir));
});

loadAchievements();
gameLoop();