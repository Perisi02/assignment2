function StartGame() {
    // Background img  ocean from:
    // https://opengameart.org/content/pixel-ocean-and-sky-background
    const backgroundOcean = new Image();
    backgroundOcean.src = "./game_assets/Ocean.png";
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

    let canvas;
    let ctx;
    
    let lastTimeStamp = 0;
    let tick = 0;

    let character;

    window.onload = function () {
        load();
    };

    // Cloud animation
    const cloud = {
        x: 0,
        y: -100,
        w: 0,
        h: 0,
        speed: 40
    };

    function load() {
        loadCount++;
        if (loadCount >= awaitLoadCount) {
            init();
        }
    }

    function init() {
        console.log("init");
        canvas = document.getElementById('gamecanvas');
        ctx = canvas.getContext('2d');


        // Background - Cloud
        const maxCloudW = canvas.width * 0.5;
        const scale = Math.min(1, maxCloudW / backgroundCloud.width);
        cloud.w = backgroundCloud.width * scale;
        cloud.h = backgroundCloud.height * scale;
        cloud.x = canvas.width;

        // Kayak character
        character = Character(
            characterSpriteSheet,
            [128, 48],
            [
                // Go right
                [
                    [0, 0], [128, 0], [256, 0], [384, 0], [512, 0], [640, 0], [768, 0], [896, 0], [1024, 0]
                ],
                // Go left
                [
                    [0, 48], [128, 48], [256, 48], [384, 48], [512, 48], [640, 48], [768, 48], [896, 48], [1024, 48]
                ],
            ],
            1
        );
        character.init();

        document.addEventListener("keydown", doKeyDown);
        document.addEventListener("keyup", doKeyUp);

        window.requestAnimationFrame(run);
    }

    // Game loop
    function run(timeStamp) {
        if (!lastTimeStamp) lastTimeStamp = timeStamp;
        const dt = (timeStamp - lastTimeStamp) / 1000;
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

        if (character) character.update(dt);

    }

    function draw() {
        // Ocean background
        ctx.drawImage(backgroundOcean, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundOcean, 0, -100, canvas.width, canvas.height); // Too much sky, did this to show more ocean

        // Cloud
        ctx.drawImage(backgroundCloud, cloud.x, cloud.y, canvas.width, canvas.height);

        // Character
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

            position: [0, 0],
            direction: [0, 0],
            velocity: 200,

            init() {
                console.log("init");

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

            update(tick) {
                this.timeSinceLastFrame += tick;

                if (this.timeSinceLastFrame >= this.frameTime) {
                    this.timeSinceLastFrame = 0;

                    if (this.direction[0] !== 0 || this.direction[1] !== 0) {
                        this.animationFrame = (this.animationFrame + 1) % this.spriteFrames[this.animationTrack].length;
                    }
                }

                this.position[0] += this.direction[0] * tick;
                this.position[1] -= this.direction[1] * tick;
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
