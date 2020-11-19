/**
 * Tick management
 */
class Tick {
  static SPEED = 1000 / 60;
  static currentTick = performance.now();

  static checkNext() {
    return performance.now() - this.currentTick >= this.SPEED;
  }

  static reset() {
    this.currentTick = performance.now();
  }
}

/**
 * Event management
 */
class Events {
  static keypressed = new Set();
  static keydown = document.addEventListener("keydown", Events.onKeydown);
  static keyup = document.addEventListener("keyup", Events.onKeyup);

  static onKeydown(ev) {
    for (const type in mappings) {
      if (Object.values(mappings[type]).includes(ev.key)) {
        ev.preventDefault();
        Events.keypressed.add(ev.key);
        return;
      }
    }
  }

  static onKeyup(ev) {
    for (const type in mappings) {
      if (Object.values(mappings[type]).includes(ev.key)) {
        ev.preventDefault();
        Events.keypressed.delete(ev.key);
        return;
      }
    }
  }
}

/**
 * Image management
 */
class Images {
  static cache = {};

  /**
   * @param {string} id
   * @returns {Promise<Image>}
   */
  static async get(id) {
    if (!(id in this.cache)) {
      const img = new Image();
      img.src = `./src/img/${id}.png`;
      this.cache[id] = img;
      await new Promise((resolve) => (img.onload = resolve));
      document.getElementById("assets").appendChild(img);
    }
    return this.cache[id];
  }
}

/**
 * Canvas management
 */
const canvas = document.getElementById("main-canvas");
const ctx = canvas.getContext("2d");

window.onresize = () => {
  canvas.width = Math.min(window.innerWidth, 784);
  canvas.height = Math.min(window.innerHeight, 400);
};

window.onresize();

/**
 * Game objects
 */
const mappings = {
  soldier: {
    RIGHT: "ArrowRight",
    LEFT: "ArrowLeft",
    JUMP: "ArrowUp",
    CROUCH: "ArrowDown",
    SHOOT: "Control",
  },
  dragonoid: {
    RIGHT: "d",
    LEFT: "q",
    JUMP: "z",
    CROUCH: "s",
    SHOOT: " ",
  },
};
const background = new Entity({ img: "background" });
const vs = new Entity({
  img: "vs",
  x: canvas.width / 2 - 60,
  y: canvas.height * 0.7,
});
const ground = new Entity({ img: "ground", isGround: true });
const [soldierBar, dragonoidBar] = document.getElementsByClassName("lifebar");
const soldier = new Player({
  img: "soldier/idle",
  mapping: mappings.soldier,
  faceRight: true,
  x: canvas.width * 0.1,
  lifebar: soldierBar,
});
const dragonoid = new Player({
  img: "dragonoid/idle",
  mapping: mappings.dragonoid,
  faceRight: false,
  x: canvas.width * 0.8,
  lifebar: dragonoidBar,
});

/**
 * Main loop: executed once every animation frame (display dependant).
 */
(function mainLoop() {
  if (Tick.checkNext()) {
    Tick.reset();
    // Update: executed once every 60 milliseconds.
    Entity.update();
  }

  Entity.render(ctx, "lightblue");

  requestAnimationFrame(mainLoop);
})();
