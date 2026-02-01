const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. SMART SCREEN SIZE ---
const isMobile = window.innerWidth < 800; 

function resizeGame() {
    if (isMobile) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 320;
        canvas.height = 480;
    }
}
window.addEventListener('resize', resizeGame);
resizeGame(); // Start mein hi size set karo

// --- 2. GAME VARIABLES ---
let gameState = 'START'; 
let acp = { 
    x: 50, 
    y: 150, 
    w: 34, 
    h: 34, 
    gravity: 0.25, // Gravity thori kam ki taake control aasaan ho
    lift: -5,      // Jump bhi smooth kiya
    velocity: 0 
};
let pipes = [];
let score = 0;
// PC par Pipe Mota (150), Mobile par Normal (80) taake rasta mile
let pipeWidth = isMobile ? 80 : 150; 
let bgX = 0;

// --- 3. FPS CONTROL (Speed Breaker) ---
// Ye code game ko 120Hz screens par pagal hone se rokega
let lastTime = 0;
const fps = 60; 
const interval = 1000 / fps; // Har frame 16ms baad chalega

// --- 4. ASSETS ---
const acpImg = new Image(); acpImg.src = 'acp.png'; 
const pipeImg = new Image(); pipeImg.src = 'pipe.png';
const bgImg = new Image(); bgImg.src = 'bg.png'; 
const jumpSound = new Audio('jump.mp3');

function playSound() {
    let s = jumpSound.cloneNode();
    s.play().catch(() => {}); 
}

// --- 5. INPUTS ---
function action(e) {
    if (e.cancelable) { e.preventDefault(); e.stopPropagation(); }

    if (gameState === 'START') {
        gameState = 'PLAYING';
        resetGame(); // Start hotay hi position reset karo taake ground mein na phansay
    } else if (gameState === 'PLAYING') {
        acp.velocity = acp.lift;
        playSound();
    } else if (gameState === 'GAMEOVER') {
        resetGame();
        gameState = 'PLAYING';
    }
}

window.addEventListener('touchstart', action, { passive: false });
window.addEventListener('mousedown', (e) => { if (!isMobile) action(e); });
window.addEventListener('keydown', (e) => { if (e.code === 'Space') action(e); });

// --- 6. GAME LOOP ---
function draw(currentTime) {
    requestAnimationFrame(draw);

    // Speed Control Logic
    const delta = currentTime - lastTime;
    if (delta < interval) return; // Agar game tez bhag rahi hai to roko
    lastTime = currentTime - (delta % interval);

    // Drawing Background
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        bgX -= 1; 
        if (bgX <= -canvas.width) bgX = 0;
        
        acp.velocity += acp.gravity;
        acp.y += acp.velocity;

        // Ceiling Limit
        if (acp.y < 0) { acp.y = 0; acp.velocity = 0; }

        ctx.drawImage(acpImg, acp.x, acp.y, acp.w, acp.h);

        // Pipe Spawning
        // Mobile par thora late pipe aye taake sambhalne ka moqa mile
        let spawnRate = isMobile ? 180 : 150; 
        
        // Frame counter ki bajaye hum score ya x position use kar sakte hain, 
        // lekin abhi simple counter use karte hain jo FPS locked hai.
        if (score * 100 + bgX % spawnRate === 0 || Math.random() < 0.01 && pipes.length === 0) {
             // Logic simplified below for strictly frames
        }
        
        // Simple Pipe Spawn Logic based on FPS
        // frame variable hata diya, ab hum direct push karenge agar doori kafi hai
        let lastPipe = pipes[pipes.length - 1];
        let minGapBetweenPipes = isMobile ? 250 : 300; // Do pipes ke darmiyan faasla

        if (!lastPipe || (canvas.width - lastPipe.x > minGapBetweenPipes)) {
            let gap = isMobile ? 200 : 220; // Upar neeche ka rasta
            let minPipe = 50;
            let maxPipe = canvas.height - gap - minPipe;
            let pipeTop = Math.random() * (maxPipe - minPipe) + minPipe;
            
            pipes.push({ x: canvas.width, top: pipeTop, bottom: pipeTop + gap, passed: false });
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 3; // Speed constant
            
            ctx.save();
            ctx.translate(pipes[i].x + pipeWidth/2, pipes[i].top / 2);
            ctx.scale(1, -1);
            ctx.drawImage(pipeImg, -pipeWidth/2, -pipes[i].top / 2, pipeWidth, pipes[i].top);
            ctx.restore();
            ctx.drawImage(pipeImg, pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);

            // Hitbox Logic
            let padding = 8; 
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

        // GROUND COLLISION FIX
        // Thora sa margin diya (acp.h - 5) taake touch hotay hi na mare
        if (acp.y + acp.h - 5 > canvas.height) gameState = 'GAMEOVER';

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
            ctx.fillText("Tap to Start", canvas.width/2, canvas.height/2 + 20);
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
}

function resetGame() {
    // Mobile par center mein spawn ho, ground ke qareeb nahi
    acp.y = canvas.height / 3; 
    acp.velocity = 0; 
    pipes = []; 
    score = 0; 
}

// Start
requestAnimationFrame(draw);
