class Entity {
  img = null;
  width = 0;
  height = 0;

  static all = {};
  static images = {};
  static nextId = 1;

  constructor(params) {
    this.props = Object.assign(
      {
        x: 0,
        y: 0,
      },
      params
    );

    this.id = Entity.nextId++;

    this.x = this.props.x;
    this.y = this.props.y;

    this.setupImage(this.props.img);

    Entity.all[this.id] = this;
  }

  // Public

  /**
   * @param {Entity} entity
   * @returns {boolean}
   */
  collision(entity) {
    return (
      this.x + this.width > entity.x && this.x < entity.x + entity.width &&
      this.y + this.height > entity.y && this.y < entity.y + entity.height
    );
  }

  /**
   * Destroys the entity.
   */
  destroy() {
    delete Entity.all[this.id];
  }

  /**
   * Renders the entity on a 2D canvas.
   * @param {CanvasRenderingContext2D} ctx
   */
  render(ctx) {
    if (this.img) {
      ctx.drawImage(this.img, this.x, canvas.height - this.height - this.y);
    }
  }

  /**
   * Updates the entity position or behaviour.
   * @abstract
   */
  update() {}

  // Private

  async setupImage(imgId) {
    this.img = await Images.get(imgId);
    const { width, height } = this.img.getBoundingClientRect();

    this.width = width;
    this.height = height;
  }

  // Static

  /**
   * Renders all registered entities.
   * @param {CanvasRenderingContext2D} ctx
   */
  static render(ctx, color) {
    const { width, height } = ctx.canvas;
    ctx.fillStyle = color;
    ctx.fillRect(0, 0, width, height);

    const entities = Object.values(this.all);
    for (let i = 0; i < entities.length; i++) {
      entities[i].render(ctx);
    }
  }

  /**
   * Updates all registered entities.
   * @param {CanvasRenderingContext2D} ctx
   */
  static update() {
    const entities = Object.values(this.all);
    for (let i = 0; i < entities.length; i++) {
      entities[i].update();
    }
  }

  /**
   * Finds an entity matching a given predicate.
   * @param {(entity: Entity, index: number) => boolean} predicate
   * @returns {Entity | null}
   */
  static find(predicate) {
    const values = Object.values(this.all);
    for (let i = 0; i < values.length; i++) {
      if (predicate(values[i], i)) {
        return values[i];
      }
    }
    return null;
  }
}
