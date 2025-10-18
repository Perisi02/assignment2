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
    // https:wwww.freesound.org/s/620668/
    // const soundCoin = new Sound();
    // soundCoin.src = "./assets/sounds/happy-coin.wav";
    // soundCoin.onload = load;
    var audioCollect = new Audio("./assets/sounds/happy-coin.wav");

    const awaitLoadCount = 4;
    let loadCount = 0;

    let canvas = document.getElementById('gamecanvas');
    let ctx = canvas.getContext('2d');

    // Timing
    let lastTimeStamp = 0;
    let dt;
    
    let character;
    let charMoveSpeed = 95;
    let charScale = 0.8;
    
    let semicircle = [];
    let semiRadius = 12;

    let semiMaxSpeed = 90;
    let semiMinSpeed = 80;

    let showHitbox = false;
    let showCritical = false;
    let collidingIndex = -1;
    
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
    };

    function drawBackground() {
        ctx.drawImage(backgroundOcean, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundCloud, cloud.x, -100, canvas.width, canvas.height);
    };

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

            // Hitbox
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

    function spawnSemicircle(amount) {
        let semiMaxY = canvas.height - 100;
        let semiMinY = boundaryOceanTop + 50;

        for (let i = 0; i < amount; i++) {
            semicircle.push({
                x: canvas.width + 30,
                y: Math.random() * (semiMaxY - semiMinY) + semiMinY,
                baseRadius: semiRadius,
                amplitude: 0.8,
                frequency: 1.5,
                phase: Math.random() * Math.PI * 2,
                t: 0,

                radius: semiRadius,
                color: `hsl(${Math.random() * 360}, 70%, 60%)`,
                speed: Math.random() * (semiMaxSpeed - semiMinSpeed) + semiMinSpeed
            });
        }
    };

    function removeSemicircle(index) {
        semicircle.splice(index, 1);
    };

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

            hitbox: { offsetX: 40, offsetY: 10, width: 15, height: 20 },

            animationTrack: 0,
            animationFrame: 0,
            frameTime: 125,
            timeSinceLastFrame: 0,
            lastAction: "",

            position: [0, 400],
            direction: [0, 0],
            velocity: charMoveSpeed,

            characterHitbox() {
                return {
                    x: this.position[0] + this.hitbox.offsetX,
                    y: this.position[1] + this.hitbox.offsetY,
                    width:  this.hitbox.width,
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

    function init() {
        let count = 0;
        while (count < 8) {
            setTimeout(() => spawnSemicircle(Math.random() * 2), count * 2000);
            count++;
        }

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

        document.addEventListener("keydown", doKeyDown);
        document.addEventListener("keyup", doKeyUp);

        window.requestAnimationFrame(run);
    };

    function run(timeStamp) {
        if (!lastTimeStamp) lastTimeStamp = timeStamp;
        dt = (timeStamp - lastTimeStamp) / 1000;
        lastTimeStamp = timeStamp;

        update(dt);
        draw();
        window.requestAnimationFrame(run);
    };

    function checkCollision(rect1, rect2) {
        const xOverlap = rect1.x < rect2.x + rect2.width && rect1.x + rect1.width > rect2.x;
        const yOverlap = rect1.y < rect2.y + rect2.height && rect1.y + rect1.height > rect2.y;
        return xOverlap && yOverlap;
    };

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
                removeSemicircle(i);
                spawnSemicircle(1);
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
            };
            if (checkCollision(charRect, semiRect)) {
                console.log("Collision detected");
                showCritical = true;
                collidingIndex = i;
                break;
            };
        };
    };

    function draw() {
        drawBackground();
        drawSemicircle();
        character.draw(ctx);

        if (showCritical) {
            const [cx, cy] = character.position;
            const imgWidth = 30;
            const imgHeight = 30;
            const offsetY = -30;
            ctx.drawImage(critical, cx + (character.spriteCanvasSize[0] / 2) - (imgWidth / 2), cy + offsetY, imgWidth, imgHeight);
        }
    };

    function doKeyDown(e) {
        e.preventDefault();
        
        if ((e.code === "Space" || e.key === " ") && !e.repeat) {
            if (collidingIndex !== -1) {

                console.log("Semicircle collected");
                removeSemicircle(collidingIndex);
                audioCollect.play();
                collidingIndex = -1;
                showCritical = false;
                spawnSemicircle(1);
            }
        }

        character.doKeyInput(e.key, true);
    };

    function doKeyUp(e) {
        e.preventDefault();
        character.doKeyInput(e.key, false);
    };
}

StartGame();