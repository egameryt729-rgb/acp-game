const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. SMART SIZE LOGIC ---
const isMobile = window.innerWidth < 800; 

if (isMobile) {
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
} else {
    canvas.width = 320;
    canvas.height = 480;
}

// --- 2. GAME VARIABLES ---
let gameState = 'START'; 
let acp = { 
    x: 50, 
    y: 150, 
    w: 34, 
    h: 34, 
    gravity: 0.4, 
    lift: -7, 
    velocity: 0 
};
let pipes = [];
let frame = 0;
let score = 0;

// --- YAHAN HAI FIX ---
// Agar Mobile hai to 100, lekin PC hai to wapis 150 (Mota Pipe)
let pipeWidth = isMobile ? 100 : 150; 
let bgX = 0;

// --- 3. ASSETS ---
const acpImg = new Image(); acpImg.src = 'acp.png'; 
const pipeImg = new Image(); pipeImg.src = 'pipe.png';
const bgImg = new Image(); bgImg.src = 'bg.png'; 
const jumpSound = new Audio('jump.mp3');

function playSound() {
    let s = jumpSound.cloneNode();
    s.play().catch(() => {}); 
}

// --- 4. CONTROLS ---
function action(e) {
    if (e.cancelable) { e.preventDefault(); e.stopPropagation(); }

    if (gameState === 'START') {
        gameState = 'PLAYING';
    } else if (gameState === 'PLAYING') {
        acp.velocity = acp.lift;
        playSound();
    } else if (gameState === 'GAMEOVER') {
        resetGame();
        gameState = 'PLAYING';
    }
}

window.addEventListener('touchstart', action, { passive: false });
window.addEventListener('mousedown', (e) => {
    if (!isMobile) action(e);
});
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') action(e);
});

// --- 5. DRAW LOOP ---
function draw() {
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        bgX -= 1; 
        if (bgX <= -canvas.width) bgX = 0;
        
        acp.velocity += acp.gravity;
        acp.y += acp.velocity;

        if (acp.y < 0) { acp.y = 0; acp.velocity = 0; }

        ctx.drawImage(acpImg, acp.x, acp.y, acp.w, acp.h);

        // Pipe Spawning
        let spawnRate = isMobile ? 120 : 130; 
        if (frame % spawnRate === 0) { 
            // Gap bhi adjust kiya: PC par mote pipe ke liye bara gap (200)
            let gap = isMobile ? 220 : 200; 
            
            let minPipe = 50;
            let maxPipe = canvas.height - gap - minPipe;
            let pipeTop = Math.random() * (maxPipe - minPipe) + minPipe;
            
            pipes.push({ x: canvas.width, top: pipeTop, bottom: pipeTop + gap, passed: false });
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 2; 
            
            ctx.save();
            ctx.translate(pipes[i].x + pipeWidth/2, pipes[i].top / 2);
            ctx.scale(1, -1);
            ctx.drawImage(pipeImg, -pipeWidth/2, -pipes[i].top / 2, pipeWidth, pipes[i].top);
            ctx.restore();
            ctx.drawImage(pipeImg, pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);

            // Hitbox Logic
            let padding = 12; 
            let acpLeft = acp.x + padding;
            let acpRight = acp.x + acp.w - padding;
            let acpTop = acp.y + padding;
            let acpBottom = acp.y + acp.h - padding;

            if (acpRight > pipes[i].x && acpLeft < pipes[i].x + pipeWidth) {
                if (acpTop < pipes[i].top || acpBottom > pipes[i].bottom) {
                    gameState = 'GAMEOVER';
                }
            }
            
            if (!pipes[i].passed && (pipes[i].x + pipeWidth/2) < acp.x) {
                score++; pipes[i].passed = true;
            }
            if (pipes[i].x < -pipeWidth) pipes.splice(i, 1);
        }

        if (acp.y + acp.h > canvas.height) gameState = 'GAMEOVER';
        frame++;

        ctx.fillStyle = "white";
        ctx.font = isMobile ? "bold 30px Arial" : "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 4; ctx.shadowColor = "black";
        ctx.fillText("Total Choot: " + score, 20, 40);
        ctx.shadowBlur = 0;
    }

    if (gameState === 'START' || gameState === 'GAMEOVER') {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        
        if (gameState === 'START') {
            ctx.font = "bold 24px Arial";
            ctx.fillText("ACP GAME", canvas.width/2, canvas.height/2 - 20);
            ctx.font = "16px Arial";
            ctx.fillText("Tap or Space to Start", canvas.width/2, canvas.height/2 + 20);
        } else {
            ctx.font = "bold 40px Arial";
            ctx.fillStyle = "#ff4444";
            ctx.fillText("GAME OVER", canvas.width/2, canvas.height/2 - 40);
            ctx.fillStyle = "white";
            ctx.font = "bold 30px Arial";
            ctx.fillText("Score: " + score, canvas.width/2, canvas.height/2 + 10); 
            ctx.font = "20px Arial";
            ctx.fillText("Tap to Restart", canvas.width/2, canvas.height/2 + 60);
        }
    }

    requestAnimationFrame(draw);
}

function resetGame() {
    acp.y = canvas.height / 2; 
    acp.velocity = 0; 
    pipes = []; 
    score = 0; 
    frame = 0;
}

draw();
