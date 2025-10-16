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

    const awaitLoadCount = 2;
    let loadCount = 0;

    let canvas, ctx;

    window.onload = function () {
        load();
    };

    // Cloud animation
    const cloud = {
        x: 0,
        y: 120,
        w: 0,
        h: 0,
        speed: 40
    };

    let lastTime = 0;

    function load() {
        loadCount++;
        if (loadCount >= awaitLoadCount) {
            init();
        }
    }

    function init() {
        canvas = document.getElementById('gamecanvas');
        ctx = canvas.getContext('2d');

        const maxCloudW = canvas.width * 0.5;
        const scale = Math.min(1, maxCloudW / backgroundCloud.width);
        cloud.w = backgroundCloud.width * scale;
        cloud.h = backgroundCloud.height * scale;

        cloud.x = canvas.width;

        window.requestAnimationFrame(run);
    }

    function run(timestamp) {
        if (!lastTime) lastTime = timestamp;
        const dt = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        update(dt);
        draw();
        window.requestAnimationFrame(run);
    }

    function update(dt) {
        cloud.x -= cloud.speed * dt;

        if (cloud.x + cloud.w < 0) {
            cloud.x = canvas.width;
        }
    }

    function draw() {
        // Ocean background
        ctx.drawImage(backgroundOcean, 0, 0, canvas.width, canvas.height);
        ctx.drawImage(backgroundOcean, 0, -100, canvas.width, canvas.height); // Too much sky, so added this to show more ocean

        // Cloud
        ctx.drawImage(backgroundCloud, cloud.x, cloud.y, cloud.w, cloud.h);
    }
}

StartGame();
