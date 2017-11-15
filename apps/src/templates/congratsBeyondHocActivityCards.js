import {pegasus} from '@cdo/apps/lib/util/urlHelpers';
import i18n from '@cdo/locale';

const CSFExpress = {
  title: i18n.csfExpressTitle(),
  description: i18n.csfExpressDesc(),
  link: pegasus(`/educate/curriculum/express-course`),
  image: "csf-express",
  buttonText: i18n.csfButton()
};

const CSFAccelerated = {
  title: i18n.csfAcceleratedTitle(),
  description: i18n.csfAcceleratedDesc(),
  link: "/s/20-hour",
  image: "csf-express",
  buttonText: i18n.csfButton()
};

const CourseCatalog = {
  title: i18n.courseCatalogTitle(),
  description: i18n.courseCatalogDescription(),
  link: "/courses/view?=teacher",
  image: "course-catalog",
  buttonText: i18n.courseCatalogButton()
};

const CreateAccount = {
  title: i18n.createAccount(),
  description: i18n.createAccountDesc(),
  link: "/users/sign_up",
  image: "create-account",
  buttonText: i18n.createAccount()
};

const AnotherHoC = {
  title: i18n.anotherHoCTitle(),
  description: i18n.anotherHoCDesc(),
  link: pegasus(`/hourofcode/overview`),
  image: "another-hoc",
  buttonText: i18n.anotherHoCButton()
};

const ApplabTutorial = {
  title: i18n.applabTutorialTitle(),
  description: i18n.applabTutorialDesc(),
  link: "/s/applab-intro",
  image: "applab-tutorial",
  buttonText: i18n.applabTutorialButton()
};

const ApplabMarketing = {
  title: i18n.applabMarketingTitle(),
  description: i18n.applabMarketingDesc(),
  link: "/applab",
  image: "applab-marketing",
  buttonText: i18n.applabMarketingButton()
};

const ApplabProject = {
  title: i18n.applabProjectTitle(),
  description: i18n.applabProjectDesc(),
  link: "/p/applab",
  image: "applab-project",
  buttonText: i18n.applabProjectButton()
};

const OldMinecraft = {
  title: i18n.pre2017MinecraftTitle(),
  description: i18n.pre2017MinecraftDesc(),
  link: "https://education.minecraft.net/hour-of-code",
  image: "old-minecraft",
  buttonText: i18n.pre2017MinecraftButton()
};

const NewMinecraft = {
  title: i18n.minecraft2017Title(),
  description: i18n.minecraft2017Desc(),
  link: "https://education.minecraft.net/support/knowledge-base/connecting-code-connection-minecraft/",
  image: "new-minecraft",
  buttonText: i18n.minecraft2017Button(),
  MCShareLink: ""
};

export const cardSets = {
  'pre2017MinecraftCards' : [
    CSFExpress,
    ApplabTutorial,
    OldMinecraft
  ],
  'nonEnglishPre2017MinecraftCards' : [
    CSFAccelerated,
    CourseCatalog,
    OldMinecraft
  ],
  'newMinecraftCards' : [
    CSFExpress,
    ApplabTutorial,
    NewMinecraft
  ],
  'nonEnglishNewMinecraftCards' : [
    CSFAccelerated,
    CourseCatalog,
    NewMinecraft
  ],
  'signedInApplabCards' : [
    ApplabProject,
    ApplabMarketing,
    AnotherHoC
  ],
  'signedOutApplabCards' : [
    ApplabProject,
    ApplabMarketing,
    CreateAccount
  ],
  'signedInDefaultCards' : [
    CSFExpress,
    ApplabTutorial,
    AnotherHoC
  ],
  'signedInNonEnglishDefaultCards' : [
    CSFAccelerated,
    CourseCatalog,
    AnotherHoC
  ],
  'signedOutDefaultCards' : [
    CSFExpress,
    ApplabTutorial,
    CreateAccount
  ],
  'signedOutNonEnglishDefaultCards' : [
    CSFAccelerated,
    CourseCatalog,
    CreateAccount
  ],
};
