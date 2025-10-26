const canvas = document.getElementById('gamecanvas');
const ctx = canvas.getContext('2d');

function StartGame() {
    // Credit: CraftPix.net 2D Game Assets on opengameart.org
    // https://opengameart.org/content/pixel-ocean-and-sky-background
    // Edited the original to show more ocean.
    const backgroundOcean = new Image();
    backgroundOcean.src = "./assets/images/Ocean_Edited.png";
    backgroundOcean.onload = load;

    // Credit: CraftPix.net 2D Game Assets on opengameart.org
    // https://opengameart.org/content/pixel-ocean-and-sky-background
    const backgroundCloud = new Image();
    backgroundCloud.src = "./assets/images/cloud.png";
    backgroundCloud.onload = load;

    // Credit: Spring Spring on opengameart.org 
    // https://opengameart.org/content/kajak
    // Edited in Drawio to add a second row facing opposite direction
    const characterSpriteSheet = new Image();
    characterSpriteSheet.src = "./assets/images/Kayak.png";
    characterSpriteSheet.onload = load;

    // Credit: Febrian Hidayat on flaticon.com
    // // https://www.flaticon.com/free-icon/critical_7037197
    const critical = new Image();
    critical.src = "./assets/images/critical.png";
    critical.onload = load;

    // Credit: s11it0 on freesound.org
    // https://freesound.org/s/620668/
    const audioCollect = new Audio("./assets/sounds/620668__s11it0__happy-coin.wav");

    // Credit: Kayrabey07 on freessound.org
    // https://freesound.org/s/543934/
    const audioMissed = new Audio("./assets/sounds/543934__kayrabey07__uuhhh.mp3");

    // Credit: Doctor_Dreamchip on freesound.org
    // https://freesound.org/people/Doctor_Dreamchip/sounds/429347/
    const audioBackground = new Audio("./assets/sounds/429347__doctor_dreamchip__2018-05-19.wav");
    audioBackground.loop = true;
    
    // Credit: plasterbrain on freesound.org
    // https://freesound.org/people/plasterbrain/sounds/243020/
    const audioStartGame = new Audio("./assets/sounds/243020__plasterbrain__game-start.ogg");
    
    // Credit: cabled_mess on freesound.org
    // https://freesound.org/people/cabled_mess/sounds/350980/
    const audioEndGame = new Audio("./assets/sounds/350980__cabled_mess__lose_c_08.wav");
    
    const awaitLoadCount = 4;
    let loadCount = 0;
    
    let lastTimeStamp = 0;
    let dt;

    // Background variables
    let boundaryOceanTop = 280;
    let cloud = {
        x: 0,
        speed: 35
    };

    // Character varibales
    let character;
    let charMoveSpeed = 95;
    let charScale = 0.8;

    // Semicircle/Rubbish variables
    let semicircle = [];
    let semiRadius = 12;
    let semiMaxSpeed = 90;
    let semiMinSpeed = 80;
    // Top and bottom boundary for the semicircle
    let semiMaxY = canvas.height - 100;
    let semiMinY = boundaryOceanTop + 50;

    // Variable for the hitbox
    let showHitbox = false;
    let showCritical = false;
    let collidingIndex = -1;

    // Scoring variables
    let currentScore = 0;
    let highscore = Number(localStorage.getItem("highscore") || 0);
    let newHighscore = false;

    // Gamestate
    let paused = true;

    // Timer variables
    let defaultTime = 60;
    let adjustedTime = defaultTime;
    let maxTimer = 120;
    let minTimer = 30;
    let timerUp = true;
    let timerIsActive = false;
    let timerIsAdjustable = true;

    // Volume control variables
    let masterVolume = 0.5;
    let maxVolume = 1.0;
    let minVolume = 0.0;
    let volumeStep = 0.1;
    let volumeIsAdjustable = true;

    // In case the player is spamming space,
    // this variable is for stopping an accidental new game
    let spaceDisabled = false;

    function load() {
        loadCount++;
        if (loadCount >= awaitLoadCount) {
            init();
        }
    };

    // Draws the ocean and cloud images
    function drawBackground() {
        ctx.drawImage(backgroundOcean, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundCloud, cloud.x, -100, canvas.width, canvas.height);
    };

    // Draws a semicircle with a hitbox.
    // Hitbox visibility depends on showHitbox
    function drawSemicircle() {
        for (let sc of semicircle) {
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI, true);
            ctx.fillStyle = sc.color;
            ctx.fill();
            ctx.strokeStyle = "black";
            ctx.lineWidth = 1;
            ctx.stroke();
            ctx.closePath();

            // Semicircle hitbox
            const semiHitbox = {
                x: sc.x - sc.radius,
                y: sc.y - sc.radius,
                width: sc.radius * 2,
                height: sc.radius
            };

            if (showHitbox) {
                ctx.strokeStyle = "red";
                ctx.lineWidth = 2;
                ctx.strokeRect(semiHitbox.x, semiHitbox.y, semiHitbox.width, semiHitbox.height);
            }
        }
    };

    // Adds the semicircle to the semicircle array
    // Param: amount - Number of semicircles to be added to the semicircle array
    function addSemicircle(amount) {
        for (let i = 0; i < amount; i++) {
            semicircle.push({
                x: canvas.width + 30,
                y: Math.random() * (semiMaxY - semiMinY) + semiMinY,
                baseRadius: semiRadius,
                // Variables for the semicircle bobbing effect
                amplitude: 0.8,
                frequency: 1.5,
                phase: Math.random() * Math.PI * 2,
                t: 0,
                radius: semiRadius,
                // Gives a different colour for each new semicircle
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                speed: Math.random() * (semiMaxSpeed - semiMinSpeed) + semiMinSpeed
            });
        }
    };

    // Spawns a number of semicircles every 2 seconds, stops after the desired amount is reached.
    // Only used at the beginning of a round
    // Param: amount - Number of semicircles to be spawned in a wave
    function spawnSemicircleWave(amount) {
        let count = 0;
        while (count < amount) {
            setTimeout(() => addSemicircle(Math.random() * 2), count * 2000);
            count++;
        }
    }

    // Removes a semicircle object from the semicircle array at the specific index
    // Param: index - index number
    function removeThisSemicircle(index) {
        semicircle.splice(index, 1);
    };

    // Plays collect sound, adds to current score, removes the currently colliding
    // semicircle & critical image, and finally spawns in a new semicircle replacing the collected semicircle
    function collectSemicircle() {
        // Sound - Spammable if collecting multiple semicircles
        audioCollect.currentTime = 0;
        audioCollect.play();

        // Score
        currentScore += 1;

        // Saves the current score if it beats the current highscore triggering a 'new' highscore
        if (currentScore > highscore) {
            highscore = currentScore;
            localStorage.setItem("highscore", String(highscore));
            newHighscore = true;
        }
        else {
            newHighscore = false;
        }

        console.log("Semicircle collected");
        console.log("+1 Score");

        removeThisSemicircle(collidingIndex);
        collidingIndex = -1;
        showCritical = false;
        addSemicircle(1);
    };

    // Create and return a new Character object.
    // Param: spritesheet = Image object
    // Param: spriteSize = Array of 2 numbers [width, height]
    // Param: spriteFrames = 3D array[Tracks[Frames[Frame X, Y]]]
    // Param: spriteScale = Number to scale sprite size -> canvas size
    // Credit: Week 9 exercise - Advanced canvas on Moodle
    // https://moodle.unitec.ac.nz/pluginfile.php/1342931/mod_resource/content/2/Exercise%20-%20Advanced%20Canvas.pdf
    function Character(spritesheet, spriteSize, spriteFrames, spriteScale) {
        return {
            spriteSheet: spritesheet,
            spriteFrameSize: spriteSize,
            spriteFrames: spriteFrames,
            spriteScale: spriteScale,
            spriteCanvasSize: spriteSize,

            hitbox: { offsetX: 40, offsetY: 10, width: 15, height: 20 },

            animationTrack: 0,
            animationFrame: 0,
            frameTime: 125,
            timeSinceLastFrame: 0,
            lastAction: "",

            position: [0, 400],
            direction: [0, 0],
            velocity: charMoveSpeed,

            // Added hitbox for character
            characterHitbox() {
                return {
                    x: this.position[0] + this.hitbox.offsetX,
                    y: this.position[1] + this.hitbox.offsetY,
                    width: this.hitbox.width,
                    height: this.hitbox.height
                };
            },

            init() {
                console.log("init character");

                this.spriteCanvasSize = [
                    this.spriteFrameSize[0] * this.spriteScale,
                    this.spriteFrameSize[1] * this.spriteScale
                ];
            },

            action(action) {
                console.log(`action: ${action}. Animation Frame ${this.animationFrame}`);

                if (action === this.lastAction) return;

                switch (action) {
                    case "moveLeft":
                        this.animationTrack = 1;
                        this.animationFrame = 0;
                        this.direction[0] = -this.velocity;
                        break;
                    case "moveRight":
                        this.animationTrack = 0;
                        this.animationFrame = 0;
                        this.direction[0] = this.velocity;
                        break;
                    case "moveUp":
                        this.animationFrame = 0;
                        this.direction[1] = this.velocity;
                        break;
                    case "moveDown":
                        this.animationFrame = 0;
                        this.direction[1] = -this.velocity;
                        break;
                    case "noMoveHorizontal":
                        this.direction[0] = 0;
                        this.animationFrame = 0;
                        break;
                    case "noMoveVertical":
                        this.direction[1] = 0;
                        this.animationFrame = 0;
                        break;
                    default:
                        this.direction = [0, 0];
                        break;
                }

                this.lastAction = action;
            },

            update(dt) {
                this.timeSinceLastFrame += dt * 1000;

                if (this.timeSinceLastFrame >= this.frameTime) {
                    this.timeSinceLastFrame -= this.frameTime;

                    if (this.direction[0] !== 0 || this.direction[1] !== 0) {
                        this.animationFrame = (this.animationFrame + 1) % this.spriteFrames[this.animationTrack].length;
                    }
                }

                this.position[0] += this.direction[0] * dt;
                this.position[1] -= this.direction[1] * dt;

                // Canvas boundary for character movement
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const spriteW = this.spriteCanvasSize[0];
                const spriteH = this.spriteCanvasSize[1];

                if (this.position[0] < 0) this.position[0] = 0;
                if (this.position[0] + spriteW > canvasWidth) this.position[0] = canvasWidth - spriteW;
                if (this.position[1] < boundaryOceanTop) this.position[1] = boundaryOceanTop;
                if (this.position[1] + spriteH > canvasHeight) this.position[1] = canvasHeight - spriteH;
            },

            draw(context) {
                context.drawImage(
                    this.spriteSheet,
                    this.spriteFrames[this.animationTrack][this.animationFrame][0],
                    this.spriteFrames[this.animationTrack][this.animationFrame][1],
                    this.spriteFrameSize[0],
                    this.spriteFrameSize[1],
                    this.position[0],
                    this.position[1],
                    this.spriteCanvasSize[0],
                    this.spriteCanvasSize[1]
                );

                if (showHitbox) {
                    const sh = this.characterHitbox();
                    context.strokeStyle = "red";
                    context.lineWidth = 2;
                    context.strokeRect(sh.x, sh.y, sh.width, sh.height);
                };
            },

            doKeyInput(e, isKeydown = true) {
                switch (e) {
                    case "w":
                        if (isKeydown) this.action("moveUp");
                        else this.action("noMoveVertical");
                        break;
                    case "a":
                        if (isKeydown) this.action("moveLeft");
                        else this.action("noMoveHorizontal");
                        break;
                    case "s":
                        if (isKeydown) this.action("moveDown");
                        else this.action("noMoveVertical");
                        break;
                    case "d":
                        if (isKeydown) this.action("moveRight");
                        else this.action("noMoveHorizontal");
                        break;
                    default:
                        break;
                }
            }
        };
    };

    // Draws the critical image above the character
    function drawCritical() {
        if (showCritical) {
            const [cx, cy] = character.position;
            const imgWidth = 30;
            const imgHeight = 30;
            const offsetY = -30;
            ctx.drawImage(critical, cx + (character.spriteCanvasSize[0] / 2) - (imgWidth / 2), cy + offsetY, imgWidth, imgHeight);
        };
    }

    // Draws menu text. Text drawn depends on the state of the game.
    // Before new game & game over - "Press space to play"
    // During paused - "Game paused" "Press space to resume"
    function drawPressSpace() {
        ctx.save();
        ctx.font = "70px 'Bangers'";
        ctx.fillStyle = "rgb(255,250,250)";
        // Shadow on text to make it stand out more
        ctx.shadowColor = "black";
        ctx.shadowBlur = 10;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center";

        if (timerIsActive) {
            ctx.fillText("Game paused", canvas.width / 2, canvas.height / 2 - 50);
            ctx.save();
            ctx.font = "60px 'Bangers'";
            ctx.fillStyle = "rgb(255,250,250)";
            ctx.shadowColor = "black";
            ctx.shadowBlur = 10;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;
            ctx.textAlign = "center";
            ctx.fillText("Press space to resume", canvas.width / 2, canvas.height / 2);
            ctx.restore();
        }
        else {
            ctx.fillText("Press space to play", canvas.width / 2, canvas.height / 2 - 50);
        }
        ctx.restore();
    }

    // Draws score, highscore, and new highscore texts in canvas
    function drawScore() {
        ctx.save();
        ctx.font = "24px 'Bangers'";
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;

        // Shifts the location of the score when game is paused or gameover.
        // Shows "new highscore" only when the highscore's been beat
        if (paused) {
            ctx.textAlign = "center";

            if (newHighscore) {
                ctx.fillText(`NEW Highscore: ${highscore}`, canvas.width / 2, canvas.height / 2 + 50);
            }
            else {
                ctx.fillText(`Highscore: ${highscore}`, canvas.width / 2, canvas.height / 2 + 50);
            }
        }
        else {
            ctx.textAlign = "left";
            ctx.fillText(`Score: ${currentScore}`, 64, 520);
            ctx.fillText(`Highscore: ${highscore}`, 16, 550);
        }

        ctx.restore();
    };

    // Draws the game timer at the bottom of the canvas
    function drawTimer() {
        ctx.save();
        ctx.font = "24px 'Bangers'";
        ctx.fillStyle = "white";
        // To make the white text stand out
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center"
        ctx.fillText("Time", canvas.width / 2, 520);

        // Change colour during last 10 seconds
        if (defaultTime <= 10) {
            ctx.fillStyle = "red";
        }
        else {
            ctx.fillStyle = "white";
        }
        ctx.textAlign = "center";
        ctx.fillText(`${Math.ceil(defaultTime)}`, canvas.width / 2, 550);
        ctx.restore();
    }

    // Draws the '+' text next to the timer
    function drawAddTime() {
        ctx.save();
        ctx.font = "50px 'Bangers'";
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center"
        ctx.fillText("+", canvas.width / 2 + 30, 555);
        ctx.restore();
    }

    // Draws the '-' text next to the timer
    function drawMinusTime() {
        ctx.save();
        ctx.font = "50px 'Bangers'";
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center"
        ctx.fillText("-", canvas.width / 2 - 35, 558);
        ctx.restore();
    }

    // Draws the "- volume +" on the menu screen
    function drawVolumeControls() {
        ctx.save();
        ctx.font = "24px 'Bangers'";
        ctx.fillStyle = "white";
        ctx.shadowColor = "black";
        ctx.shadowBlur = 2;
        ctx.shadowOffsetX = 2;
        ctx.shadowOffsetY = 2;
        ctx.textAlign = "center";
        ctx.fillText("Volume", canvas.width / 2, canvas.height / 2 + 120);
        ctx.fillText(`${Math.round(masterVolume * 100)}%`, canvas.width / 2, canvas.height / 2 + 150);

        ctx.font = "50px 'Bangers'";
        ctx.fillText("+", canvas.width / 2 + 35, canvas.height / 2 + 155);
        ctx.fillText("-", canvas.width / 2 - 45, canvas.height / 2 + 155);
        ctx.restore();
    }

    // Sets the volume for all imported audios
    // Param: volume - Number for volume e.g. 1.0 for 100% 0.5 for 50%
    function setAllVolume(volume) {
        audioBackground.volume = volume * 0.4;
        audioCollect.volume = volume;
        audioEndGame.volume = volume;
        audioMissed.volume = volume;
        audioStartGame.volume = volume;
    }

    // Plays new game audio, resets character position, empties the semicircle array, and
    // sets the score to 0 before spawning in new semicircles for the round
    function startNewGame() {
        audioStartGame.currentTime = 0;
        audioStartGame.play();

        currentScore = 0;
        character.position = [0, 400];
        character.lastAction = "";
        character.direction = [0, 0];
        semicircle.length = 0;
        newHighscore = false;

        paused = !paused;
        console.log("New game");
        spawnSemicircleWave(6);
    };

    // Creates the character with Character().
    // Initialises the character sprite and movement.
    // Adds event listeners for key and mouse input.
    // Starts the animation loop.
    function init() {
        // Character
        character = Character(
            characterSpriteSheet,
            [128, 48],
            [
                [[0, 0], [128, 0], [256, 0], [384, 0], [512, 0], [640, 0], [768, 0], [896, 0], [1024, 0]],
                [[1024, 48], [896, 48], [768, 48], [640, 48], [512, 48], [384, 48], [256, 48], [128, 48], [0, 48]]
            ],
            charScale
        );
        character.init();

        // Event listeners
        document.addEventListener("keydown", doKeyDown);
        document.addEventListener("keyup", doKeyUp);
        document.addEventListener("click", doClick);

        // Animation loop
        window.requestAnimationFrame(run);
    };

    // Calculates delta time (dt) between frames for animation. Updates and redraws
    // the game elements when the game is active. When the game is paused, this
    // displays the menu screen. Recursive function to maintain animation loop.
    // Param: timeStamp - The current timeStamp provided by requestAnimationFrame.
    function run(timeStamp) {
        if (!lastTimeStamp) lastTimeStamp = timeStamp;
        dt = (timeStamp - lastTimeStamp) / 1000;
        lastTimeStamp = timeStamp;

        if (!paused) {
            update(dt);
            draw();
        }
        else {
            draw();
            drawPressSpace();
            drawVolumeControls();
            if (timerUp) {
                drawAddTime();
                drawMinusTime();
            }
        }

        window.requestAnimationFrame(run);
    };

    // Checks whether two rectangular objects overlap and then returns boolean value.
    // When the objects bounding boxes overlap, returns true else it returns false.
    // Param: rect1 - The first object with a bounding box
    // Param: rect2 - The second object with a bounding box
    function checkCollision(rect1, rect2) {
        const xOverlap = rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;
        const yOverlap = rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
        return xOverlap && yOverlap;
    };

    // Updates all active game elements each frame.
    // Moves background clouds, updates the character, and moves semicircles across the screen.
    // Checks for collisions, updates the timer, plays sounds, and handles end-of-round logic.
    // Param: dt - Time difference (in seconds) since the last frame.
    function update(dt) {
        cloud.x -= cloud.speed * dt;
        if (cloud.x + canvas.width < 0) cloud.x = canvas.width;

        if (character) character.update(dt);

        for (let i = semicircle.length - 1; i >= 0; i--) {
            let sc = semicircle[i];
            sc.x -= sc.speed * dt;
            sc.t += dt;

            sc.radius = sc.baseRadius + sc.amplitude * Math.sin(2 * Math.PI * sc.frequency * sc.t + sc.phase);

            if (sc.x + sc.radius < 0) {
                console.log("Semicircle missed");
                audioMissed.currentTime = 0;
                audioMissed.play();
                removeThisSemicircle(i);
                addSemicircle(1);
            };
        };

        if (timerIsActive) {
            defaultTime -= dt;

            if (defaultTime <= 0) {
                defaultTime = adjustedTime;
                timerIsActive = false;
                paused = true;
                timerUp = true;
                timerIsAdjustable = true;

                audioEndGame.currentTime = 0;
                audioEndGame.play();

                console.log("Time up");
                console.log("Space key disabled for 1s");

                setTimeout(() => {
                    spaceDisabled = false;
                    console.log("Space key re-enabled")
                }, 1000);
                spaceDisabled = true;
            }
        }

        const charRect = character.characterHitbox();
        showCritical = false;
        collidingIndex = -1;

        for (let i = 0; i < semicircle.length; i++) {
            const sc = semicircle[i];
            const semiRect = {
                x: sc.x - sc.radius,
                y: sc.y - sc.radius,
                width: sc.radius * 2,
                height: sc.radius
            }
            if (checkCollision(charRect, semiRect)) {
                console.log("Collision detected");
                showCritical = true;
                collidingIndex = i;
                break;
            }
        };
    };

    // Draws all visible game elements on the canvas.
    // Renders the background, semicircles, character, critical icon, score, and timer.
    // Called every frame after update() to display the current game state.
    function draw() {
        drawBackground();
        drawSemicircle();
        character.draw(ctx);
        drawCritical();
        drawScore();
        drawTimer();
    };

    // Handles keyboard input for game control.
    // Toggles pause, starts or resumes the game, and plays background audio when needed.
    // Also handles character movement using W, A, S, and D keys while the game is active.
    // Param: e - The keydown event.
    function doKeyDown(e) {
        e.preventDefault();

    // ESC
        if (e.code === "Escape") {
            if (!paused) {
                paused = !paused;
                timerIsAdjustable = timerUp;
                console.log(`Game paused\n` +
                    ` Time remaining: ${Math.ceil(defaultTime)}s\n` +
                    `Time adjustable: ${timerIsAdjustable}\n` +
                    `          Score: ${currentScore}\n` +
                    `         paused: ${paused}\n` +
                    `        !paused: ${!paused}`);
            } else if (paused && !timerUp) {
                paused = !paused;
                timerIsActive = true;
                timerIsAdjustable = false;
                console.log(`Game resumed\n` +
                    ` Time remaining: ${Math.ceil(defaultTime)}s\n` +
                    `Time adjustable: ${timerIsAdjustable}\n` +
                    `          Score: ${currentScore}\n` +
                    `         paused: ${paused}\n` +
                    `        !paused: ${!paused}`);
            }
            return;
        };

        // SPACE
        if ((e.code === "Space" || e.key === " ") && !e.repeat) {
            if (spaceDisabled) {
                console.log("Space key temporarily disabled");
                return;
            }

            if (audioBackground.paused) {
                audioBackground.play();
            };

            if (collidingIndex !== -1 && !paused) {
                collectSemicircle();
            } else if (paused && !timerUp) {
                paused = !paused;
                timerIsActive = true;
                timerIsAdjustable = false;
                console.log(`Game resumed\n` +
                    ` Time remaining: ${Math.ceil(defaultTime)}s\n` +
                    `Time adjustable: ${timerIsAdjustable}\n` +
                    `          Score: ${currentScore}\n` +
                    `         paused: ${paused}\n` +
                    `        !paused: ${!paused}`);
            } else if (paused && timerUp) {
                timerUp = false;
                timerIsAdjustable = true;
                timerIsActive = true;
                adjustedTime = defaultTime;
                startNewGame();
            };
        };

        if (!paused) character.doKeyInput(e.key, true);
    };

    function doKeyUp(e) {
        e.preventDefault();
        character.doKeyInput(e.key, false);
    };

    // Handles mouse click interactions on the canvas.
    // Detects clicks on timer and volume buttons when available.
    // Adjusts timer length or master volume based on button clicked.
    // Param: e - The mouse click event.
    function doClick(e) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Timer buttons
        if (timerIsAdjustable) {
            const timerButtonSize = 50;
            const addTimerX = canvas.width / 2 + 30;
            const addTimerY = 555;
            const minusTimerX = canvas.width / 2 - 35;
            const minusTimerY = 558;

            if (
                defaultTime < maxTimer &&
                mouseX > addTimerX &&
                mouseX < addTimerX + timerButtonSize &&
                mouseY > addTimerY - timerButtonSize &&
                mouseY < addTimerY
            ) {
                defaultTime += 5;
                console.log("Timer increased +5seconds");
            };

            if (
                defaultTime > minTimer &&
                mouseX > minusTimerX &&
                mouseX < minusTimerX + timerButtonSize &&
                mouseY > minusTimerY - timerButtonSize &&
                mouseY < minusTimerY
            ) {
                defaultTime -= 5;
                console.log("Timer decreased -5seconds");
            };
        }

        // Volume buttons
        if (volumeIsAdjustable) {
            const volButtonSize = 50;
            const addVolX = canvas.width / 2 + 35;
            const addVolY = canvas.height / 2 + 155;
            const minusVolX = canvas.width / 2 - 45;
            const minusVolY = canvas.height / 2 + 155;

            if (
                masterVolume < maxVolume &&
                mouseX > addVolX &&
                mouseX < addVolX + volButtonSize &&
                mouseY > addVolY - volButtonSize &&
                mouseY < addVolY
            ) {
                masterVolume = Math.min(maxVolume, masterVolume + volumeStep);
                setAllVolume(masterVolume);
            }

            if (
                masterVolume > minVolume &&
                mouseX > minusVolX &&
                mouseX < minusVolX + volButtonSize &&
                mouseY > minusVolY - volButtonSize &&
                mouseY < minusVolY
            ) {
                masterVolume = Math.max(minVolume, masterVolume - volumeStep);
                setAllVolume(masterVolume);
            }
        }
    }
};

StartGame();