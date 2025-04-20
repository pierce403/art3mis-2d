import Phaser from 'phaser';

export class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameOverScene' });
  }

  create() {
    const { width, height } = this.scale;

    // Semi-transparent background
    this.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0);

    // Game Over Text
    this.add.text(width / 2, height / 2 - 50, 'GAME OVER', {
      font: '48px monospace',
      color: '#ff0000',
      align: 'center'
    }).setOrigin(0.5);

    // Restart Text (Button)
    const restartText = this.add.text(width / 2, height / 2 + 50, 'Restart', {
      font: '32px monospace',
      color: '#ffffff',
      backgroundColor: '#555555',
      padding: { left: 15, right: 15, top: 10, bottom: 10 }
    }).setOrigin(0.5).setInteractive(); // Make it interactive

    // Restart on click/tap
    restartText.on('pointerdown', () => {
      this.scene.start('MainScene');
    });

    // Restart on Enter key press
    this.input.keyboard?.on('keydown-ENTER', () => {
      this.scene.start('MainScene');
    });

    // Focus hint (visual only, actual focus is handled by key listener)
    restartText.on('pointerover', () => restartText.setBackgroundColor('#777777'));
    restartText.on('pointerout', () => restartText.setBackgroundColor('#555555'));

    // Note: True programmatic focus for Enter key isn't standard in Phaser like HTML.
    // We achieve the same effect by listening for the Enter key globally in this scene.
  }
} 