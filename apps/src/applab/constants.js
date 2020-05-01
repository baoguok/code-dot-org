import * as utils from '../utils';
import {
  ICON_PREFIX,
  ICON_PREFIX_REGEX,
  DATA_URL_PREFIX_REGEX
} from '../assetManagement/assetPrefix';

export {ICON_PREFIX, ICON_PREFIX_REGEX, DATA_URL_PREFIX_REGEX};
export const FOOTER_HEIGHT = 30;
export const APP_WIDTH = 320;
export const WIDGET_WIDTH = 600;
export const APP_HEIGHT = 480;
export const DESIGN_ELEMENT_ID_PREFIX = 'design_';
export const NEW_SCREEN = 'New screen...';
export const ApplabInterfaceMode = utils.makeEnum('CODE', 'DESIGN', 'DATA');
export const ANIMATION_LENGTH_MS = 200;
export const IMPORT_SCREEN = 'Import screen...';

// Number of ticks after which to capture a thumbnail image of the play space.
// 300 ticks equates to approximately 1-1.5 seconds in apps that become idle
// after the first few ticks, or 10-15 seconds in apps that draw constantly.
export const CAPTURE_TICK_COUNT = 300;

export const defaultFontSizeStyle = '14px';

export const DEFAULT_THEME_INDEX = 0;
export const CLASSIC_THEME_INDEX = 1;

export const themeOptions = [
  'default',
  'classic',
  'orange',
  'citrus',
  'ketchupAndMustard',
  'lemonade',
  'forest',
  'watermelon',
  'area51',
  'polar',
  'glowInTheDark',
  'bubblegum',
  'millennial',
  'robot'
];

const THEME_ICON_BASE_URL = '/blockly/media/applab/theme_dropdown/';

export const themeOptionsForSelect = [
  {
    option: 'default',
    displayName: 'Default',
    icon: THEME_ICON_BASE_URL + 'default.png'
  },
  {
    option: 'classic',
    displayName: 'Classic',
    icon: THEME_ICON_BASE_URL + 'classic.png'
  },
  {
    option: 'orange',
    displayName: 'Orange',
    icon: THEME_ICON_BASE_URL + 'orange.png'
  },
  {
    option: 'citrus',
    displayName: 'Citrus',
    icon: THEME_ICON_BASE_URL + 'citrus.png'
  },
  {
    option: 'ketchupAndMustard',
    displayName: 'Ketchup and Mustard',
    icon: THEME_ICON_BASE_URL + 'ketchup_and_mustard.png'
  },
  {
    option: 'lemonade',
    displayName: 'Lemonade',
    icon: THEME_ICON_BASE_URL + 'lemonade.png'
  },
  {
    option: 'forest',
    displayName: 'Forest',
    icon: THEME_ICON_BASE_URL + 'forest.png'
  },
  {
    option: 'watermelon',
    displayName: 'Watermelon',
    icon: THEME_ICON_BASE_URL + 'watermelon.png'
  },
  {
    option: 'area51',
    displayName: 'Area 51',
    icon: THEME_ICON_BASE_URL + 'area_51.png'
  },
  {
    option: 'polar',
    displayName: 'Polar',
    icon: THEME_ICON_BASE_URL + 'polar.png'
  },
  {
    option: 'glowInTheDark',
    displayName: 'Glow in the Dark',
    icon: THEME_ICON_BASE_URL + 'glow_in_the_dark.png'
  },
  {
    option: 'bubblegum',
    displayName: 'Bubblegum',
    icon: THEME_ICON_BASE_URL + 'bubblegum.png'
  },
  {
    option: 'millennial',
    displayName: 'Millennial',
    icon: THEME_ICON_BASE_URL + 'millennial.png'
  },
  {
    option: 'robot',
    displayName: 'Robot',
    icon: THEME_ICON_BASE_URL + 'robot.png'
  }
];

export const fontFamilyOptions = [
  'Arial',
  'Georgia',
  'Palatino',
  'Times',
  'Courier',
  'Lucida Console',
  'Arial Black',
  'Comic',
  'Impact',
  'Lucida Sans',
  'Tahoma',
  'Trebuchet',
  'Verdana'
];

export const fontFamilyStyles = [
  'Arial, Helvetica, sans-serif',
  'Georgia, serif',
  '"Palatino Linotype", "Book Antiqua", Palatino, serif',
  '"Times New Roman", Times, serif',
  '"Courier New", Courier, monospace',
  '"Lucida Console", Monaco, monospace',
  '"Arial Black", Gadget, sans-serif',
  '"Comic Sans MS", cursive, sans-serif',
  'Impact, Charcoal, sans-serif',
  '"Lucida Sans Unicode", "Lucida Grande", sans-serif',
  'Tahoma, Geneva, sans-serif',
  '"Trebuchet MS", Helvetica, sans-serif',
  'Verdana, Geneva, sans-serif'
];

if (fontFamilyOptions.length !== fontFamilyStyles.length) {
  throw new Error(
    'fontFamilyOptions length must equal fontFamilyStyles length'
  );
}
