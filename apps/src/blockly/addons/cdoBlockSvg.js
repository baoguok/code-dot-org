import GoogleBlockly from 'blockly/core';
import BlockSvgUnused from './blockSvgUnused';

export default class BlockSvg extends GoogleBlockly.BlockSvg {
  constructor(workspace, prototypeName, opt_id) {
    super(workspace, prototypeName, ++Blockly.uidCounter_); // Use counter instead of randomly generated IDs

    this.canDisconnectFromParent_ = true;
  }

  addUnusedBlockFrame(helpClickFunc) {
    if (!this.unusedSvg_) {
      this.unusedSvg_ = new BlockSvgUnused(this, helpClickFunc);
    }
    this.unusedSvg_.render(this.svgGroup_);
  }

  /**
   * @override
   * Disable overwrite checks
   */
  mixin(mixinObj, opt_disableCheck) {
    super.mixin(mixinObj, true);
  }

  isUnused() {
    const isTopBlock = this.previousConnection === null;
    const hasParentBlock = !!this.parentBlock_;
    return !(isTopBlock || hasParentBlock);
  }

  isVisible() {
    // TODO (eventually), but all Flappy blocks are visible, so this won't be a problem
    // until we convert other labs
    return true;
  }

  setCanDisconnectFromParent(canDisconnect) {
    this.canDisconnectFromParent_ = canDisconnect;
  }

  customContextMenu(menuOptions) {
    // Only show context menu for levelbuilders
    if (Blockly.isStartMode) {
      const deletable = {
        text: this.deletable_
          ? 'Make Undeletable to Users'
          : 'Make Deletable to Users',
        enabled: true,
        callback: function() {
          this.setDeletable(!this.isDeletable());
          Blockly.ContextMenu.hide();
        }.bind(this)
      };
      const movable = {
        text: this.movable_
          ? 'Make Immovable to Users'
          : 'Make Movable to Users',
        enabled: true,
        callback: function() {
          this.setMovable(!this.isMovable());
          Blockly.ContextMenu.hide();
        }.bind(this)
      };
      const editable = {
        text: this.editable_ ? 'Make Uneditable' : 'Make editable',
        enabled: true,
        callback: function() {
          this.setEditable(!this.isEditable());
          Blockly.ContextMenu.hide();
        }.bind(this)
      };
      menuOptions.push(deletable);
      menuOptions.push(movable);
      menuOptions.push(editable);
      // menuOptions for Shadow Blocks require awareness of parents and children.
      const children = this.getChildren();
      const shadowChildCount = children.filter(child => child.isShadow())
        .length;
      const nonShadowChildrenCount = children.filter(child => !child.isShadow())
        .length;
      // A block can be made into a shadow if:
      //* It has a surrounding parent block.
      //* It does not contain a variable field.
      //* It does not have any non-shadow children.
      if (
        this.getSurroundParent() &&
        !this.getVarModels().length &&
        !nonShadowChildrenCount
      ) {
        const shadow = {
          text: 'Make Shadow',
          enabled: true,
          callback: function() {
            this.setShadow(true);
            Blockly.ContextMenu.hide();
          }.bind(this)
        };
        menuOptions.push(shadow);
      }
      // If a block has shadow child(ren), it can be used to convert them to blocks.
      if (children.length) {
        if (shadowChildCount) {
          const unshadow = {
            text: `Make ${
              shadowChildCount > 1 ? `${shadowChildCount} ` : ''
            }Child Block${shadowChildCount > 1 ? 's' : ''} Non-Shadow`,
            enabled: true,
            callback: function() {
              for (let i = 0; i < children.length; i++) {
                children[i].setShadow(false);
              }
              Blockly.ContextMenu.hide();
            }.bind(this)
          };
          menuOptions.push(unshadow);
        }
      }
    }
  }

  dispose() {
    super.dispose();
    this.removeUnusedBlockFrame();
  }

  getTitles() {
    let fields = [];
    this.inputList.forEach(input => {
      input.fieldRow.forEach(field => {
        fields.push(field);
      });
    });
    return fields;
  }

  getTitleValue(name) {
    return super.getFieldValue(name);
  }

  isUserVisible() {
    return false; // TODO - used for EXTRA_TOP_BLOCKS_FAIL feedback
  }

  onMouseDown_(e) {
    if (!Blockly.utils.isRightButton(e) && !this.canDisconnectFromParent_) {
      return;
    }
    super.onMouseDown_(e);
  }

  render(opt_bubble) {
    super.render(opt_bubble);
    this.removeUnusedBlockFrame();
  }

  removeUnusedBlockFrame() {
    if (this.unusedSvg_) {
      this.unusedSvg_.dispose();
      this.unusedSvg_ = null;
    }
  }

  setHSV(h, s, v) {
    return super.setColour(Blockly.utils.colour.hsvToHex(h, s, v * 255));
  }

  getHexColour() {
    return super.getColour();
  }
}
