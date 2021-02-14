class BuildingFill {
  constructor(omegga, config, store) {
    this.omegga = omegga;
    this.config = config;
    this.store = store;

    this.playerData = {};
  }

  async init() {
    this.omegga
      .on('cmd:fill', this.fill)
      .on('cmd:fillall', this.fillAll)
      .on('cmd:fillcolor', this.fillGet);

    return {
      registeredCommands: ['fill', 'fillall', 'fillcolor']
    };
  }

  unauthorized(senderName) {
    const player = this.omegga.getPlayer(senderName);
    if (
      this.config['only-authorized'] && !player.isHost() &&
      !this.config['authorized-users'].some(p => player.id === p.id)
    ) {
      this.omegga.whisper(senderName, '<color="ff0000">Unauthorized to use command.</>');
      return true;
    }
    return false;
  }

  fill = async (senderName, ignoreMaterials) => {
    if (this.unauthorized(senderName)) return;
    if (this.playerData[senderName] && this.playerData[senderName].old) {
      const player = this.omegga.getPlayer(senderName);
      const oldColor = this.playerData[senderName].old;
      const newColor = await player.getPaint();
      const op = getMessageParams(oldColor);
      const np = getMessageParams(newColor);
      const nameColor = player.getNameColor();
      this.omegga.broadcast(`<b><color="${nameColor}">${senderName}</></> filling... <color="${op.hexSRGB}">${op.material} #${op.hexLinear}</> → <color="${np.hexSRGB}">${np.material} #${np.hexLinear}</>`);
      let saveData = await player.getTemplateBoundsData();
      const colorIndex = saveData.colors.findIndex((color) => color.slice(0,3).every((value, index) => value === oldColor.color[index]));
      const oldMaterialIndex = saveData.materials.indexOf(oldColor.material);
      const newMaterialIndex = saveData.materials.indexOf(newColor.material);
      saveData.bricks = saveData.bricks.map((brick) => {
        if (brick.material_index === oldMaterialIndex || ignoreMaterials) {
          if (brick.color === colorIndex || (Array.isArray(brick.color) && brick.color.every((value, index) => value === oldColor.color[index]))) {
            brick = {
              ...brick,
              color: newColor.color,
              material_index: ignoreMaterials ? brick.material_index : newMaterialIndex
            };
          }
        }
        return brick;
      });
      saveData = global.OMEGGA_UTIL.brick.setOwnership(player, saveData);
      await player.loadDataAtGhostBrick(saveData);
    } else {
      // this.omegga.whisper
    }
  }

  fillAll = async (senderName, ignoreMaterials) => {
    if (this.unauthorized(senderName)) return;
    const player = this.omegga.getPlayer(senderName);
    const newColor = await player.getPaint();
    const np = getMessageParams(newColor);
    const nameColor = player.getNameColor();
    this.omegga.broadcast(`<b><color="${nameColor}">${senderName}</></> filling all...  <color="${np.hexSRGB}">${ignoreMaterials ? '' : np.material + ' '}#${np.hexLinear}</>`);
    let saveData = await player.getTemplateBoundsData();
    const newMaterialIndex = saveData.materials.indexOf(newColor.material);
    saveData.bricks = saveData.bricks.map((brick) => {
      brick = {
        ...brick,
        color: newColor.color,
        material_index: ignoreMaterials ? brick.material_index : newMaterialIndex
      };
      return brick;
    });
    saveData = global.OMEGGA_UTIL.brick.setOwnership(player, saveData);
    await player.loadDataAtGhostBrick(saveData);
  }

  setPlayerData = async (senderName, key) => {
    const player = this.omegga.getPlayer(senderName);

    const paint = await player.getPaint();
    if (paint) {
      if (this.playerData[senderName]) {
        this.playerData[senderName][key] = paint;
      } else {
        this.playerData[senderName] = {
          [key]: paint
        };
      }
    }
  }

  fillGet = async (senderName, ...args) => {
    if (this.unauthorized(senderName)) return;
    await this.setPlayerData(senderName, 'old', ...args);
    const paint = this.playerData[senderName].old;
    if (paint) {
      const p = getMessageParams(paint);
      this.omegga.whisper(senderName, `Fill Set: <color="${p.hexSRGB}">${p.material} #${p.hexLinear}</>`);
    }
  }

  stop() {
    this.omegga
      .removeListener('cmd:fill', this.fill)
      .removeListener('cmd:fillall', this.fillAll)
      .removeListener('cmd:fillcolor', this.fillGet);
  }
}

function getMessageParams(paint) {
  const hexLinear = global.OMEGGA_UTIL.color.rgbToHex(paint.color);
  const hexSRGB = global.OMEGGA_UTIL.color.rgbToHex(global.OMEGGA_UTIL.color.sRGB(paint.color));
  const material = paint.material.slice(paint.material.indexOf('_') + 1);

  return {
    hexLinear,
    hexSRGB,
    material,
  };
}

module.exports = BuildingFill;