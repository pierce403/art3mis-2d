import Phaser from 'phaser';

const SAVE_KEY = 'art3mis-rover-position';

class MainScene extends Phaser.Scene {
  private rover!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Procedurally generate a simple circular rover texture
    const g = this.add.graphics();
    g.fillStyle(0x0066ff, 1);
    g.fillCircle(10, 10, 10);
    g.generateTexture('rover', 20, 20);
    g.destroy();
  }

  create() {
    // Retrieve saved position or default to center
    const data = localStorage.getItem(SAVE_KEY);
    const x = data ? JSON.parse(data).x : this.scale.width / 2;
    const y = data ? JSON.parse(data).y : this.scale.height / 2;

    this.rover = this.add.sprite(x, y, 'rover');
    this.cursors = this.input.keyboard.createCursorKeys();
  }

  update() {
    const speed = 200;
    let moved = false;

    if (this.cursors.left?.isDown) {
      this.rover.x -= speed * this.game.loop.delta / 1000;
      moved = true;
    }
    if (this.cursors.right?.isDown) {
      this.rover.x += speed * this.game.loop.delta / 1000;
      moved = true;
    }
    if (this.cursors.up?.isDown) {
      this.rover.y -= speed * this.game.loop.delta / 1000;
      moved = true;
    }
    if (this.cursors.down?.isDown) {
      this.rover.y += speed * this.game.loop.delta / 1000;
      moved = true;
    }

    if (moved) {
      // Save position
      localStorage.setItem(SAVE_KEY, JSON.stringify({ x: this.rover.x, y: this.rover.y }));
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  scene: MainScene,
  backgroundColor: '#1a1a1a'
});
