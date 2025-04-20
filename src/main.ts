import Phaser from 'phaser';
import { GameOverScene } from './GameOverScene';

const SAVE_KEY = 'art3mis-rover-position';

class MainScene extends Phaser.Scene {
  private rover!: Phaser.GameObjects.Sprite;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private energy: number = 100;
  private maxEnergy: number = 100;
  private solarChargeRate: number = 1; // energy per second
  private movementEnergyRate: number = 3; // energy per second when moving
  private regolith: number = 0;
  private maxRegolith: number = 10;
  private collectionRate: number = 1; // kg per second when moving
  private ingots: { aluminum: number; iron: number; silicon: number } = { aluminum: 0, iron: 0, silicon: 0 };
  private maxTotalIngots: number = 20;
  private droppedIngots: Phaser.GameObjects.Sprite[] = [];
  private processKey!: Phaser.Input.Keyboard.Key;
  private dropKeys!: { aluminum: Phaser.Input.Keyboard.Key; iron: Phaser.Input.Keyboard.Key; silicon: Phaser.Input.Keyboard.Key };
  private energyText!: Phaser.GameObjects.Text;
  private inventoryText!: Phaser.GameObjects.Text;
  private dpad = { up: false, down: false, left: false, right: false };

  constructor() {
    super({ key: 'MainScene' });
  }

  preload() {
    // Procedurally generate moon-like ground and a rover texture
    const gameWidth = this.scale.width as number;
    const gameHeight = this.scale.height as number;
    const groundHeight = gameHeight;
    const g = this.add.graphics();

    // Generate moon surface with craters
    g.fillStyle(0xaaaaaa, 1);
    g.fillRect(0, 0, gameWidth, groundHeight);
    for (let i = 0; i < 20; i++) {
      const radius = Phaser.Math.Between(5, 20);
      const x = Phaser.Math.Between(radius, gameWidth - radius);
      const y = Phaser.Math.Between(radius, groundHeight - radius);
      g.fillStyle(0x888888, 1);
      g.fillCircle(x, y, radius);
    }
    g.generateTexture('ground', gameWidth, groundHeight);
    g.clear();

    // Generate a simple rover: body with two wheels
    const roverWidth = 30;
    const roverHeight = 20;
    const wheelRadius = 6;
    g.fillStyle(0x888888, 1);
    g.fillRect(0, 0, roverWidth, roverHeight);
    g.fillStyle(0x333333, 1);
    g.fillCircle(wheelRadius, roverHeight, wheelRadius);
    g.fillCircle(roverWidth - wheelRadius, roverHeight, wheelRadius);
    g.generateTexture('rover', roverWidth, roverHeight + wheelRadius);
    g.destroy();
    // Generate ingot icons: aluminum (light), iron (dark), silicon (orange)
    const iconSize = 16;
    const g2 = this.add.graphics();
    g2.fillStyle(0xdddddd, 1);
    g2.fillRect(0, 0, iconSize, iconSize);
    g2.generateTexture('aluminum', iconSize, iconSize);
    g2.clear();
    g2.fillStyle(0x888888, 1);
    g2.fillRect(0, 0, iconSize, iconSize);
    g2.generateTexture('iron', iconSize, iconSize);
    g2.clear();
    g2.fillStyle(0xffcc33, 1);
    g2.fillRect(0, 0, iconSize, iconSize);
    g2.generateTexture('silicon', iconSize, iconSize);
    g2.destroy();

    // Generate D-Pad arrow textures
    const arrowSize = 40;
    const g3 = this.add.graphics();
    g3.fillStyle(0xffffff, 0.5); // Semi-transparent white

    // Up Arrow
    g3.beginPath();
    g3.moveTo(arrowSize / 2, 0);
    g3.lineTo(arrowSize, arrowSize);
    g3.lineTo(0, arrowSize);
    g3.closePath();
    g3.fillPath();
    g3.generateTexture('arrow_up', arrowSize, arrowSize);
    g3.clear();

    // Down Arrow
    g3.fillStyle(0xffffff, 0.5);
    g3.beginPath();
    g3.moveTo(arrowSize / 2, arrowSize);
    g3.lineTo(arrowSize, 0);
    g3.lineTo(0, 0);
    g3.closePath();
    g3.fillPath();
    g3.generateTexture('arrow_down', arrowSize, arrowSize);
    g3.clear();

    // Left Arrow
    g3.fillStyle(0xffffff, 0.5);
    g3.beginPath();
    g3.moveTo(0, arrowSize / 2);
    g3.lineTo(arrowSize, 0);
    g3.lineTo(arrowSize, arrowSize);
    g3.closePath();
    g3.fillPath();
    g3.generateTexture('arrow_left', arrowSize, arrowSize);
    g3.clear();

    // Right Arrow
    g3.fillStyle(0xffffff, 0.5);
    g3.beginPath();
    g3.moveTo(arrowSize, arrowSize / 2);
    g3.lineTo(0, 0);
    g3.lineTo(0, arrowSize);
    g3.closePath();
    g3.fillPath();
    g3.generateTexture('arrow_right', arrowSize, arrowSize);
    g3.destroy(); // Destroy the graphics object
  }

  create() {
    // Place moon surface at bottom
    const gameWidth = this.scale.width as number;
    const gameHeight = this.scale.height as number;
    const groundHeight = gameHeight;
    this.add.image(gameWidth / 2, gameHeight / 2, 'ground');

    // Retrieve saved position or default to center
    const data = localStorage.getItem(SAVE_KEY);
    const x = data ? JSON.parse(data).x : gameWidth / 2;
    const y = data ? JSON.parse(data).y : gameHeight / 2;

    this.rover = this.add.sprite(x, y, 'rover');
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.processKey = this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.P);
    this.dropKeys = {
      aluminum: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.Z),
      iron: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.X),
      silicon: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.C)
    };
    this.energyText = this.add.text(10, 10, '', { font: '16px monospace', color: '#ffffff' });
    this.inventoryText = this.add.text(10, (this.scale.height as number) - 20, '', { font: '16px monospace', color: '#ffffff' });

    // Add D-Pad buttons
    const padMargin = 20;
    const buttonSize = 40;
    const spacing = 5;
    const bottomY = (this.scale.height as number) - padMargin - buttonSize / 2;
    const leftX = padMargin + buttonSize / 2;

    const arrowUp = this.add.sprite(leftX + buttonSize + spacing, bottomY - buttonSize - spacing, 'arrow_up').setInteractive().setScrollFactor(0);
    const arrowDown = this.add.sprite(leftX + buttonSize + spacing, bottomY, 'arrow_down').setInteractive().setScrollFactor(0);
    const arrowLeft = this.add.sprite(leftX, bottomY, 'arrow_left').setInteractive().setScrollFactor(0);
    const arrowRight = this.add.sprite(leftX + 2 * (buttonSize + spacing), bottomY, 'arrow_right').setInteractive().setScrollFactor(0);

    // D-Pad Pointer Events
    const setupDPadButton = (button: Phaser.GameObjects.Sprite, direction: keyof typeof this.dpad) => {
        button.on('pointerdown', () => { this.dpad[direction] = true; });
        button.on('pointerup', () => { this.dpad[direction] = false; });
        button.on('pointerout', () => { this.dpad[direction] = false; }); // Release if pointer leaves button area
    };

    setupDPadButton(arrowUp, 'up');
    setupDPadButton(arrowDown, 'down');
    setupDPadButton(arrowLeft, 'left');
    setupDPadButton(arrowRight, 'right');
  }

  update() {
    const speed = 200;
    let moved = false;
    const dt = this.game.loop.delta / 1000;

    if (this.cursors.left?.isDown || this.dpad.left) {
      this.rover.x -= speed * dt;
      moved = true;
    }
    if (this.cursors.right?.isDown || this.dpad.right) {
      this.rover.x += speed * dt;
      moved = true;
    }
    if (this.cursors.up?.isDown || this.dpad.up) {
      this.rover.y -= speed * dt;
      moved = true;
    }
    if (this.cursors.down?.isDown || this.dpad.down) {
      this.rover.y += speed * dt;
      moved = true;
    }

    // clamp rover within screen bounds
    this.rover.x = Phaser.Math.Clamp(this.rover.x, 0, this.scale.width as number);
    this.rover.y = Phaser.Math.Clamp(this.rover.y, 0, this.scale.height as number);

    if (moved) {
      // Save position
      localStorage.setItem(SAVE_KEY, JSON.stringify({ x: this.rover.x, y: this.rover.y }));
      // Energy and regolith collection
      this.energy -= this.movementEnergyRate * dt;
      this.regolith = Math.min(this.maxRegolith, this.regolith + this.collectionRate * dt);
    } else {
      this.energy += this.solarChargeRate * dt;
    }
    this.energy = Phaser.Math.Clamp(this.energy, 0, this.maxEnergy);
    const totalIngots = this.ingots.aluminum + this.ingots.iron + this.ingots.silicon;
    if (Phaser.Input.Keyboard.JustDown(this.processKey) && this.regolith >= 10 && totalIngots + 10 <= this.maxTotalIngots) {
      this.regolith -= 10;
      for (let i = 0; i < 10; i++) {
        const types = ['aluminum', 'iron', 'silicon'] as const;
        const type = types[Phaser.Math.Between(0, types.length - 1)];
        this.ingots[type]++;
      }
    }
    if (Phaser.Input.Keyboard.JustDown(this.dropKeys.aluminum) && this.ingots.aluminum > 0) {
      this.ingots.aluminum--;
      const sprite = this.add.sprite(this.rover.x, this.rover.y, 'aluminum');
      this.droppedIngots.push(sprite);
    }
    if (Phaser.Input.Keyboard.JustDown(this.dropKeys.iron) && this.ingots.iron > 0) {
      this.ingots.iron--;
      const sprite = this.add.sprite(this.rover.x, this.rover.y, 'iron');
      this.droppedIngots.push(sprite);
    }
    if (Phaser.Input.Keyboard.JustDown(this.dropKeys.silicon) && this.ingots.silicon > 0) {
      this.ingots.silicon--;
      const sprite = this.add.sprite(this.rover.x, this.rover.y, 'silicon');
      this.droppedIngots.push(sprite);
    }
    // Update UI texts
    this.energyText.setText(`Energy: ${Math.floor(this.energy)}/${this.maxEnergy} Regolith: ${Math.floor(this.regolith)}/${this.maxRegolith}`);
    this.inventoryText.setText(`Al: ${this.ingots.aluminum} Fe: ${this.ingots.iron} Si: ${this.ingots.silicon}`);

    // Game Over Check
    if (this.energy <= 0) {
      this.scene.start('GameOverScene');
    }
  }
}

new Phaser.Game({
  type: Phaser.AUTO,
  backgroundColor: '#1a1a1a',
  scale: {
    width: window.innerWidth,
    height: window.innerHeight,
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  scene: [MainScene, GameOverScene]
});
