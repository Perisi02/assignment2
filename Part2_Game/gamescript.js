function StartGame() {
    // Background img from:
    // https://opengameart.org/content/pixel-ocean-and-sky-background
    // Edited the original to show more ocean.
    const backgroundOcean = new Image();
    backgroundOcean.src = "./game_assets/Ocean_Edited.png";
    backgroundOcean.onload = load;

    // Background img from:
    // https://opengameart.org/content/pixel-ocean-and-sky-background
    const backgroundCloud = new Image();
    backgroundCloud.src = "./game_assets/cloud.png";
    backgroundCloud.onload = load;

    // Kayak img from:
    // https://opengameart.org/content/kajak
    // Edited in Drawio to add a second row facing opposite direction
    const characterSpriteSheet = new Image();
    characterSpriteSheet.src = "./game_assets/Kayak.png"
    characterSpriteSheet.onload = load

    const awaitLoadCount = 3;
    let loadCount = 0;

    let canvas = document.getElementById('gamecanvas');
    let ctx = canvas.getContext('2d');

    let lastTimeStamp = 0;
    let dt;

    let character;
    let charMoveSpeed = 100;

    let semicircle = [];
    let semiRadius = 15;
    let semiMaxSpeed = 70;
    let semiMinSpeed = 50;

    const boundaryOceanTop = 280;

    const cloud = {
        x: 0,
        speed: 35
    };
    
    function load() {
        loadCount++;
        if (loadCount >= awaitLoadCount) {
            init();
        }
    }

    function drawBackground() {
        ctx.drawImage(backgroundOcean, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundCloud, cloud.x, -100, canvas.width, canvas.height);
    }

    function drawSemicircle() {
        for (let sc of semicircle) {
            ctx.beginPath();
            ctx.arc(sc.x, sc.y, sc.radius, 0, Math.PI, true);
            ctx.fillStyle = sc.color;
            ctx.fill();
            ctx.closePath();
        }
    }

    function spawnSemicircle(amount) {
        let semiMaxY = canvas.height - 100;
        let semiMinY = boundaryOceanTop + 50;

        for (let i = 0; i < amount; i++) {
            semicircle.push({
                x: canvas.width + 30,
                y: Math.random() * (semiMaxY - semiMinY) + semiMinY,
                radius: semiRadius,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                speed: Math.random() * semiMaxSpeed + semiMinSpeed
            });
        }
    }

    function resetSemicircle() {
        for (let i = semicircle.length - 1; i >= 0; i--) {
            let sc = semicircle[i];
            sc.x -= sc.speed * dt;

            if (sc.x + sc.radius < 0) {
                semicircle.splice(i, 1);

                spawnSemicircle(1);
            }
        }
    }

    function semicircleHitbox() {

    }

    function init() {
        console.log("init");

        // cloud.x = canvas.width;

        spawnSemicircle(8);

        // Kayak character
        character = Character(
            characterSpriteSheet,
            [128, 48],
            [
                // Right
                [
                    [0, 0], [128, 0], [256, 0], [384, 0], [512, 0], [640, 0], [768, 0], [896, 0], [1024, 0]
                ],
                // Left
                [
                    [1024, 48], [896, 48], [768, 48], [640, 48], [512, 48], [384, 48], [256, 48], [128, 48], [0, 48]
                ],
            ],
            1
        );

        character.init();

        document.addEventListener("keydown", doKeyDown);
        document.addEventListener("keyup", doKeyUp);

        window.requestAnimationFrame(run);
    }

    function run(timeStamp) {
        if (!lastTimeStamp) lastTimeStamp = timeStamp;
        dt = (timeStamp - lastTimeStamp) / 1000;
        lastTimeStamp = timeStamp;

        update(dt);
        draw();
        window.requestAnimationFrame(run);
    }

    function update(dt) {
        cloud.x -= cloud.speed * dt;

        if (cloud.x + canvas.width < 0) {
            cloud.x = canvas.width;
        }

        resetSemicircle();

        if (character) character.update(dt);

    }

    function draw() {
        drawBackground();
        drawSemicircle();
        character.draw(ctx);
    }

    function doKeyDown(e) {
        e.preventDefault();
        if (character != undefined) { character.doKeyInput(e.key, true); }
    }

    function doKeyUp(e) {
        e.preventDefault();
        if (character != undefined) { character.doKeyInput(e.key, false); }
    }

    // Create and return a new Character object.
    // Param: spritesheet = Image object
    // Param: spriteSize = Array of 2 numbers [width, height]
    // Param: spriteFrames = 3D array[Tracks[Frames[Frame X, Y]]]
    // Param: spriteScale = Number to scale sprite size -> canvas size
    function Character(spritesheet, spriteSize, spriteFrames, spriteScale) {
        return {
            spriteSheet: spritesheet,
            spriteFrameSize: spriteSize,
            spriteFrames: spriteFrames,
            spriteScale: spriteScale,
            spriteCanvasSize: spriteSize,

            animationTrack: 0,
            animationFrame: 0,
            frameTime: 125,
            timeSinceLastFrame: 0,
            lastAction: "",

            position: [0, 400],
            direction: [0, 0],
            velocity: charMoveSpeed,

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

                // Boundary for character movement
                const canvasWidth = canvas.width;
                const canvasHeight = canvas.height;
                const spriteW = this.spriteCanvasSize[0];
                const spriteH = this.spriteCanvasSize[1];

                // Left
                if (this.position[0] < 0) this.position[0] = 0;
                // Right
                if (this.position[0] + spriteW > canvasWidth) this.position[0] = canvasWidth - spriteW;
                // Top
                if (this.position[1] < boundaryOceanTop) this.position[1] = boundaryOceanTop;
                // Bottom
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
                        if (!isKeydown) this.action("stop");
                        break;
                }
            }
        };
    }
}

StartGame();