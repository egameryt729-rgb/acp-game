const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Screen size setup
canvas.width = 320;
canvas.height = 480;

let gameState = 'START'; 
let acp = { x: 50, y: 150, w: 34, h: 34, gravity: 0.4, lift: -7, velocity: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let pipeWidth = 150; 
let bgX = 0;

// Assets
const acpImg = new Image();
acpImg.src = 'acp.png'; 

const pipeImg = new Image();
pipeImg.src = 'pipe.png';

const bgImg = new Image();
bgImg.src = 'bg.png'; 

const jumpSound = new Audio('jump.mp3');

// Sound function
function playSound() {
    let s = jumpSound.cloneNode();
    s.play().catch(() => {}); 
}

// Logic for input (Mobile + PC)
function handleInput(e) {
    if (e) {
        if (e.cancelable) e.preventDefault();
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

// Mobile and Desktop specific listeners
window.addEventListener('touchstart', (e) => handleInput(e), { passive: false });
window.addEventListener('mousedown', (e) => {
    if (!('ontouchstart' in window)) handleInput(e);
}, false);
window.onkeydown = (e) => { if(e.code === 'Space') handleInput(e); };

function draw() {
    // 1. Background drawing (Moving)
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        bgX -= 0.5; 
        if (bgX <= -canvas.width) bgX = 0;
    }

    // 2. Start Screen
    if (gameState === 'START') {
        ctx.fillStyle = "rgba(0,0,0,0.4)";
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.textAlign = "center";
        ctx.font = "bold 24px Arial";
        ctx.fillText("ACP PRADYUMAN", canvas.width/2, 200);
        ctx.font = "16px Arial";
        ctx.fillText("Tap to Start Investigation", canvas.width/2, 240);
    }

    // 3. Playing State
    if (gameState === 'PLAYING') {
        acp.velocity += acp.gravity;
        acp.y += acp.velocity;

        // Ceiling fix
        if (acp.y < 0) {
            acp.y = 0;
            acp.velocity = 0;
        }

        ctx.drawImage(acpImg, acp.x, acp.y, acp.w, acp.h);

        // Pipe spawning
        if (frame % 130 === 0) { 
            let gap = 200; 
            let pipeTop = Math.random() * (canvas.height - gap - 100) + 50;
            pipes.push({ x: canvas.width, top: pipeTop, bottom: pipeTop + gap, passed: false });
        }

        for (let i = pipes.length - 1; i >= 0; i--) {
            pipes[i].x -= 2.2;

            // Draw Top Pipe
            ctx.save();
            ctx.translate(pipes[i].x + pipeWidth/2, pipes[i].top / 2);
            ctx.scale(1, -1);
            ctx.drawImage(pipeImg, -pipeWidth/2, -pipes[i].top / 2, pipeWidth, pipes[i].top);
            ctx.restore();

            // Draw Bottom Pipe
            ctx.drawImage(pipeImg, pipes[i].x, pipes[i].bottom, pipeWidth, canvas.height - pipes[i].bottom);

            // TIGHT HITBOX LOGIC (Restart problem fix)
            let hitW = 22; // Kitne pixels image ke andar se takkar count ho
            let hitH = 20;
            if (acp.x + acp.w - hitW > pipes[i].x && acp.x + hitW < pipes[i].x + pipeWidth) {
                if (acp.y + hitH < pipes[i].top || acp.y + acp.h - hitH > pipes[i].bottom) {
                    gameState = 'GAMEOVER';
                }
            }
            
            // Score Logic
            if (!pipes[i].passed && (pipes[i].x + (pipeWidth/2)) < acp.x) {
                score++;
                pipes[i].passed = true;
            }
            
            if (pipes[i].x < -pipeWidth) pipes.splice(i, 1);
        }

        // Ground check
        if (acp.y + acp.h > canvas.height) gameState = 'GAMEOVER';
        
        frame++;

        // Live Score
        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 5; ctx.shadowColor = "black";
        ctx.fillText("Total Choot: " + score, 10, 30);
        ctx.shadowBlur = 0;
    }

    // 4. Game Over Screen
    if (gameState === 'GAMEOVER') {
        ctx.fillStyle = "rgba(0,0,0,0.8)";
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = "red";
        ctx.textAlign = "center";
        ctx.font = "bold 32px Arial";
        ctx.fillText("GAME OVER", canvas.width/2, 180);
        ctx.fillStyle = "white";
        ctx.font = "bold 24px Arial";
        ctx.fillText("Total Choot: " + score, canvas.width/2, 240); 
        ctx.font = "18px Arial";
        ctx.fillText("Tap to Restart", canvas.width/2, 300);
    }

    requestAnimationFrame(draw);
}

function resetGame() {
    acp.y = 150;
    acp.velocity = 0;
    pipes = [];
    score = 0;
    frame = 0;
}

draw();
