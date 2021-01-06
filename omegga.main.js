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
      .on('cmd:fillreplace', this.fillGet)
      .on('cmd:fillset', this.fillSet);
    
    return {
      registeredCommands: ['fill', 'fillall', 'fillreplace', 'fillset']
    };
  }

  fill = async (senderName, ignoreMaterials) => {
    try {
      if(this.playerData[senderName] && this.playerData[senderName].old) {
        const oldColor = this.playerData[senderName].old;
        const newColor = await this.omegga.getPaint(senderName);
        let saveData = await this.omegga.getTemplateBoundsData(senderName);
        const colorIndex = saveData.colors.findIndex((color) => color.every((value, index) => value === oldColor.color[index]));
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
        saveData = this.omegga.setOwnership(senderName, saveData);
        await this.omegga.loadDataAtGhostBrick(senderName, saveData);
      } else {
        // this.omegga.whisper
      }
    } catch(error) {
      console.log(error);
    }
  }

  fillAll = async (senderName, ignoreMaterials) => {
    try {
      const newColor = await this.omegga.getPaint(senderName);
      let saveData = await this.omegga.getTemplateBoundsData(senderName);
      const newMaterialIndex = saveData.materials.indexOf(newColor.material);
      saveData.bricks = saveData.bricks.map((brick) => {
        brick = { 
          ...brick,
          color: newColor.color,
          material_index: ignoreMaterials ? brick.material_index : newMaterialIndex
        };
        return brick;
      });
      saveData = this.omegga.setOwnership(senderName, saveData);
      await this.omegga.loadDataAtGhostBrick(senderName, saveData);
    } catch(error) {
      console.log(error);
    }
  }

  setPlayerData = async (senderName, key) => {
    try {
      const paint = await this.omegga.getPaint(senderName);
      if (paint) {
        if (this.playerData[senderName]) {
          this.playerData[senderName][key] = paint;
        } else {
          this.playerData[senderName] = {
            [key]: paint
          };
        }
      }
    } catch(error) {
      console.log(error);
    }
  }

  fillGet = async (senderName, ...args) => {
    try {
      await this.setPlayerData(senderName, 'old', ...args);
    } catch(error) {
      console.log(error);
    }
  }

  fillSet = async (senderName, ...args) => {
    try {
      await this.setPlayerData(senderName, 'new', ...args);
    } catch(error) {
      console.log(error);
    }
  }

  stop() {
    this.omegga
      .removeListener('cmd:fill', this.fill)
      .removeListener('cmd:fillall', this.fillAll)
      .removeListener('cmd:fillreplace', this.fillGet)
      .removeListener('cmd:fillset', this.fillSet);
  }
}

module.exports = BuildingFill;