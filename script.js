const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// --- 1. SCREEN FIT LOGIC (Professional Scaling) ---
const originalWidth = 320;
const originalHeight = 480;

function resizeGame() {
    let scale = Math.min(
        window.innerWidth / originalWidth, 
        window.innerHeight / originalHeight
    );
    
    canvas.style.width = (originalWidth * scale) + "px";
    canvas.style.height = (originalHeight * scale) + "px";
    
    // Canvas ka internal resolution wahi rahega (Sharpness ke liye)
    canvas.width = originalWidth;
    canvas.height = originalHeight;
}

// Window resize hone par dobara adjust kare
window.addEventListener('resize', resizeGame);
resizeGame(); // Game start hotay hi size set karo

// --- 2. GAME VARIABLES ---
let gameState = 'START'; 
let acp = { x: 50, y: 150, w: 34, h: 34, gravity: 0.4, lift: -7, velocity: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let pipeWidth = 150; 
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

// --- 4. INPUT HANDLING (No More Double Taps) ---
function action(e) {
    // Agar event browser ka default kaam (zoom/scroll) kar raha hai to roko
    if (e && e.cancelable) {
        e.preventDefault();
        e.stopPropagation();
    }

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

// Sirf ye listeners kafi hain mobile aur PC ke liye
window.addEventListener('touchstart', action, { passive: false });
window.addEventListener('mousedown', (e) => {
    // Agar touch device hai to mouse click ignore karo (Double tap fix)
    if (!('ontouchstart' in window)) action(e);
});
window.addEventListener('keydown', (e) => {
    if (e.code === 'Space') action(e);
});

// --- 5. DRAW LOOP ---
function draw() {
    // Background Scrolling
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        bgX -= 0.5;
        if (bgX <= -canvas.width) bgX = 0;
        
        // ACP Physics
        acp.velocity += acp.gravity;
        acp.y += acp.velocity;

        // Ceiling Limit (Upar nahi phansega)
        if (acp.y < 0) { acp.y = 0; acp.velocity = 0; }

        ctx.drawImage(acpImg, acp.x, acp.y, acp.w, acp.h);

        // Pipe Spawning (Wider Gap for Wide Pipes)
        if (frame % 130 === 0) { 
            let gap = 200; 
            let pipeTop = Math.random() * (canvas.height - gap - 100) + 50;
            pipes.push({ x: canvas.width, top: pipeTop, bottom: pipeTop + gap, passed: false });
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 2.2;
            
            // Draw Pipes
            ctx.save();
            ctx.translate(pipes[i].x + pipeWidth/2, pipes[i].top / 2);
            ctx.scale(1, -1);
            ctx.drawImage(pipeImg, -pipeWidth/2, -pipes[i].top / 2, pipeWidth, pipes[i].top);
            ctx.restore();
            ctx.drawImage(pipeImg, pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);

            // PERFECT HITBOX (No Fake Deaths)
            let padding = 18; 
            let acpLeft = acp.x + padding;
            let acpRight = acp.x + acp.w - padding;
            let acpTop = acp.y + padding;
            let acpBottom = acp.y + acp.h - padding;

            if (acpRight > pipes[i].x && acpLeft < pipes[i].x + pipeWidth) {
                if (acpTop < pipes[i].top || acpBottom > pipes[i].bottom) {
                    gameState = 'GAMEOVER';
                }
            }
            
            // Score
            if (!pipes[i].passed && (pipes[i].x + (pipeWidth/2)) < acp.x) {
                score++; pipes[i].passed = true;
            }
            
            if (pipes[i].x < -pipeWidth) pipes.splice(i, 1);
        }

        // Ground Collision
        if (acp.y + acp.h > canvas.height) gameState = 'GAMEOVER';
        
        frame++;

        // HUD
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 4; ctx.shadowColor = "black";
        ctx.fillText("Total Choot: " + score, 15, 35);
        ctx.shadowBlur = 0;
    }

    // Screens
    if (gameState === 'START' || gameState === 'GAMEOVER') {
        ctx.fillStyle = "rgba(0,0,0,0.7)";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.shadowBlur = 0;
        
        if (gameState === 'START') {
            ctx.font = "bold 26px Arial";
            ctx.fillText("ACP PRADYUMAN", canvas.width/2, 200);
            ctx.font = "18px Arial";
            ctx.fillText("Tap to Start Investigation", canvas.width/2, 240);
        } else {
            ctx.font = "bold 34px Arial";
            ctx.fillStyle = "#ff4444";
            ctx.fillText("GAME OVER", canvas.width/2, 180);
            ctx.fillStyle = "white";
            ctx.font = "bold 24px Arial";
            ctx.fillText("Total Choot: " + score, canvas.width/2, 240); 
            ctx.font = "18px Arial";
            ctx.fillText("Tap to Restart", canvas.width/2, 300);
        }
    }

    requestAnimationFrame(draw);
}

function resetGame() {
    acp.y = 150; acp.velocity = 0; pipes = []; score = 0; frame = 0;
}

// Images load hone ke baad draw shuru karo
let imagesLoaded = 0;
const totalImages = 3;
function checkLoad() {
    imagesLoaded++;
    if(imagesLoaded === totalImages) draw();
}
acpImg.onload = checkLoad;
pipeImg.onload = checkLoad;
bgImg.onload = checkLoad;
// Fallback: Agar images load na hon tab bhi game chalao
setTimeout(() => { if(imagesLoaded < totalImages) draw(); }, 500);
