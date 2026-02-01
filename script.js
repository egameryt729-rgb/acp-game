const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

canvas.width = 320;
canvas.height = 480;

let gameState = 'START'; 
let acp = { x: 50, y: 150, w: 34, h: 34, gravity: 0.4, lift: -7, velocity: 0 };
let pipes = [];
let frame = 0;
let score = 0;
let pipeWidth = 150; 
let bgX = 0; // Background move karne ke liye

// Assets Loading
const acpImg = new Image();
acpImg.src = 'acp.png'; 

const pipeImg = new Image();
pipeImg.src = 'pipe.png';

const bgImg = new Image();
bgImg.src = 'bg.png'; // Aapki background image

const jumpSound = new Audio('jump.mp3');

function playSound() {
    let s = jumpSound.cloneNode();
    s.play().catch(() => {}); 
}

function handleInput() {
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

window.onmousedown = (e) => { e.preventDefault(); handleInput(); };
window.ontouchstart = (e) => { e.preventDefault(); handleInput(); };
window.onkeydown = (e) => { if(e.code === 'Space') handleInput(); };

function draw() {
    // --- MOVING BACKGROUND LOGIC ---
    // Background ko do baar draw karte hain taake loop chalta rahe
    ctx.drawImage(bgImg, bgX, 0, canvas.width, canvas.height);
    ctx.drawImage(bgImg, bgX + canvas.width, 0, canvas.width, canvas.height);
    
    if (gameState === 'PLAYING') {
        bgX -= 0.5; // Background ki speed (slow rakhi hai)
        if (bgX <= -canvas.width) bgX = 0;
    }

    if (gameState === 'START') {
        ctx.fillStyle = "rgba(0,0,0,0.3)"; // Halka sa parda
        ctx.fillRect(0,0, canvas.width, canvas.height);
        ctx.fillStyle = "white";
        ctx.font = "bold 22px Arial";
        ctx.textAlign = "center";
        ctx.fillText("ACP Pradyuman Game", canvas.width/2, 200);
        ctx.fillText("Tap to Start", canvas.width/2, 240);
    }

    if (gameState === 'PLAYING') {
        acp.velocity += acp.gravity;
        acp.y += acp.velocity;

        if (acp.y < 0) {
            acp.y = 0;
            acp.velocity = 0;
        }

        ctx.drawImage(acpImg, acp.x, acp.y, acp.w, acp.h);

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

            // Collision logic (Vahi tight hitbox)
            let hitPaddingW = 20; 
            let hitPaddingH = 18;
            if (acp.x + acp.w - hitPaddingW > pipes[i].x && acp.x + hitPaddingW < pipes[i].x + pipeWidth) {
                if (acp.y + hitPaddingH < pipes[i].top || acp.y + acp.h - hitPaddingH > pipes[i].bottom) {
                    gameState = 'GAMEOVER';
                }
            }
            
            if (!pipes[i].passed && (pipes[i].x + (pipeWidth/2)) < acp.x) {
                score++;
                pipes[i].passed = true;
            }
            
            if (pipes[i].x < -pipeWidth) pipes.splice(i, 1);
        }

        if (acp.y + acp.h > canvas.height) gameState = 'GAMEOVER';
        frame++;

        ctx.fillStyle = "white";
        ctx.font = "bold 20px Arial";
        ctx.textAlign = "left";
        ctx.shadowBlur = 5; ctx.shadowColor = "black"; // Text ko wazay dikhane ke liye shadow
        ctx.fillText("Total Choot: " + score, 10, 30);
        ctx.shadowBlur = 0;
    }

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