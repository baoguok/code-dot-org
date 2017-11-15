import {pegasus} from '@cdo/apps/lib/util/urlHelpers';

const CSFExpress = {
  title: "CSF Express",
  description: "",
  link: pegasus(`/educate/curriculum/express-course`),
  image: "csf-express"
};

const CSFAccelerated = {
  title: "CSF Accelerated",
  description: "Keep going with our intro course! Learn the fundamentals of computer science with drag & drop blocks. Create your own drawings and games.",
  link: "/s/20-hour",
  image: "csf-express",
  buttonText: "Try the course"
};

const CourseCatalog = {
  title: "Course Catalog",
  description: "Code.org offers courses across K-12 at no cost to schools. And, if you’d like help getting started, we also offer online professional learning at no cost.",
  link: "/courses/view?=teacher",
  image: "course-catalog",
  buttonText: "View Course Catalog"
};

const CreateAccount = {
  title: "Create an Account",
  description: "",
  link: pegasus(`/educate/curriculum/express-course`),
  image: "create-account"
};

const AnotherHoC = {
  title: "Another HoC",
  description: "",
  link: "/applab",
  image: "another-hoc"
};

const ApplabTutorial = {
  title: "Applab Tutorial",
  description: "",
  link: "/applab",
  image: "applab-tutorial"
};

const ApplabMarketing = {
  title: "Applab Tutorial",
  description: "",
  link: "/applab",
  image: "applab-marketing"
};

const ApplabProject = {
  title: "Applab Project",
  description: "",
  link: "/applab",
  image: "applab-project"
};

const OldMinecraft = {
  title: "Minecraft Education",
  description: "",
  link: "/minecraft",
  image: "old-minecraft"
};

const NewMinecraft = {
  title: "Minecraft Education",
  description: "",
  link: "/minecraft",
  image: "new-minecraft"
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
