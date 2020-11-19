class Bullet extends Entity {
  damage = 25;

  update() {
    super.update();

    this.x += this.props.speed;

    if (this.x < 0 || this.x + this.width > canvas.width) {
      this.destroy();
    }

    const ennemy = Entity.all[this.props.targetId];

    if (ennemy && this.collision(ennemy)) {
      this.destroy();
      ennemy.hit(this.damage);
    }
  }
}

class Player extends Entity {
  // Movement
  crouching = false;
  crouchHits = 0;
  jumpCount = 0;
  jumping = false;
  lockTimeout = false;
  reloadTimeout = false;

  // Stats
  health = 100;
  maxHealth = 100;
  maxSpeed = 10;
  jumpStrength = 1.5;
  speed = 0;
  reloadSpeed = 0.3;

  currentSprite = "idle";

  constructor() {
    super(...arguments);

    this.type = this.props.img.split("/")[0];

    this.onKeydown = this.onKeydown.bind(this);
    this.onKeyup = this.onKeyup.bind(this);
    document.addEventListener("keydown", this.onKeydown);
    document.addEventListener("keyup", this.onKeyup);
  }

  get alive() {
    return this.health > 0;
  }

  // Public

  /**
   * @override
   */
  destroy() {
    super.destroy();

    document.removeEventListener("keydown", this.onKeydown);
    document.removeEventListener("keyup", this.onKeyup);
  }

  /**
   * @override
   */
  update() {
    super.update();

    const { keypressed } = Events;
    const { LEFT, RIGHT, JUMP, CROUCH } = this.props.mapping;

    if (!this.ennemy) {
      this.ennemy = Entity.find((e) => e instanceof Player && e.id !== this.id);
    }

    if (!this.ground) {
      this.ground = Entity.find((e) => e.props.isGround);
    }
    const gndLevel = this.ground ? this.ground.height / 2 : 0;

    if (keypressed.has(LEFT) && !keypressed.has(RIGHT)) {
      this.#move(-2);
    } else if (!keypressed.has(LEFT) && keypressed.has(RIGHT)) {
      this.#move(+2);
    } else {
      this.#move(0);
    }

    if (keypressed.has(JUMP)) {
      this.#jump();
    }

    // Jump
    if (this.jumping) {
      if (this.jumpCount < 10) {
        this.#switchSprite("jump");
        this.y += (10 - this.jumpCount) ** this.jumpStrength;
      } else if (this.jumpCount <= 20) {
        this.#switchSprite("fall");
        this.y -= (this.jumpCount - 10) ** this.jumpStrength;
      } else {
        this.jumping = false;
      }
      this.jumpCount++;
    }

    this.#crouch(keypressed.has(CROUCH));

    // Attacking
    if (
      this.ennemy &&
      !this.ennemy.crouching &&
      this.crouchHits > 0 &&
      this.collision(this.ennemy)
    ) {
      this.ennemy.hit(10);
      this.crouchHits = 0;
    }

    if (this.x <= 0) {
      this.x = 0;
      this.speed = 0;
    }
    if (this.x + this.width >= canvas.width) {
      this.x = canvas.width - this.width;
      this.speed = 0;
    }
    if (this.y <= gndLevel) {
      this.y = gndLevel;
    }
  }

  hit(amount) {
    if (this.invulnerableTimeout) {
      return;
    }
    this.invulnerableTimeout = setTimeout(
      () => (this.invulnerableTimeout = false),
      200
    );
    this.health = Math.max(this.health - amount, 0);
    this.props.lifebar.style.width = `${(this.health / this.maxHealth) * 100}%`;
    if (!this.alive) {
      this.destroy();
    }
  }

  // Private

  #lock(delay) {
    if (this.locked) {
      clearTimeout(this.lockTimeout);
    }
    this.lockTimeout = setTimeout(() => (this.lockTimeout = false), delay);
  }

  async #switchSprite(newSprite) {
    if (newSprite === this.currentSprite) {
      return;
    }

    const oldSprite = this.currentSprite;
    this.currentSprite = newSprite;

    if (this.__updatingSprite) {
      return;
    }
    this.__updatingSprite = true;

    await new Promise((resolve) => {
      setTimeout(() => requestAnimationFrame(resolve));
    });

    await this.setupImage(`${this.type}/${this.currentSprite}`);

    if (!this.props.faceRight) {
      if (oldSprite === "crouch" && this.currentSprite !== "crouch") {
        this.x += this.width;
      } else if (oldSprite !== "crouch" && this.currentSprite === "crouch") {
        this.x -= this.width / 2;
      }
    }

    this.__updatingSprite = false;
  }

  #move(force) {
    let inc = 0;
    if (!this.lockTimeout && !this.jumping && !this.crouching) {
      if (force === 0) {
        this.#switchSprite("idle");
      } else if (force > 0) {
        this.#switchSprite(this.props.faceRight ? "forward" : "backward");
      } else {
        this.#switchSprite(this.props.faceRight ? "backward" : "forward");
      }
      inc += force;
    }

    let newSpeed = this.speed + inc;

    if (this.crouching) {
      newSpeed *= 0.98;
    } else if (!inc && !this.jumping) {
      newSpeed *= 0.85;
    }

    this.speed = Math.max(Math.min(newSpeed, +this.maxSpeed), -this.maxSpeed);
    this.x += this.speed;
  }

  #jump() {
    if (this.lockTimeout || this.jumping || this.crouching) {
      return;
    }
    this.jumping = true;
    this.jumpCount = 0;
    this.y += 1;
    this.#switchSprite("jump");
  }

  #crouch(toggleCrouch) {
    if (this.lockTimeout) {
      return;
    }
    if (toggleCrouch && !this.crouching) {
      this.crouchHits = 1;
    }
    if (this.crouching && !toggleCrouch) {
      this.crouchHits = 0;
    }
    this.crouching = toggleCrouch;
    if (this.crouching) {
      this.#switchSprite("crouch");
    }
  }

  #shoot() {
    if (this.lockTimeout || this.reloadTimeout || this.triggerPressed) {
      return;
    }
    this.#switchSprite("shoot");
    this.#lock(100);
    this.triggerPressed = true;

    const bullet = new Bullet({
      img: `${this.type}/bullet`,
      x: this.props.faceRight ? this.x + this.width : this.x,
      y: this.y + this.height / 2.5,
      speed: this.props.faceRight ? 20 : -20,
      targetId: this.ennemy && this.ennemy.id,
    });

    this.reloadTimeout = setTimeout(() => {
      this.reloadTimeout = false;
    }, this.reloadSpeed * 1000);
  }

  // Handlers

  onKeydown({ key }) {
    if (key === this.props.mapping.SHOOT) {
      this.#shoot();
    }
  }

  onKeyup({ key }) {
    if (key === this.props.mapping.SHOOT) {
      this.triggerPressed = false;
    }
  }
}
