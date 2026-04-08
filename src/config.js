module.exports = {
  user: "Ɛpsilon",
  host: "3p5ilon",

  info: [
    [
      { key: "User",    value: "Ɛpsilon",            color: "red"   },
      { key: "OS",      value: "macOS · Arch Linux", color: "red"   },
      { key: "Editor",  value: "Neovim · Zed",       color: "peach" },
   
      { key: "Langs",
      value: "Python · TypeScript · JavaScript · C++ · C · Astro · Bash · Lua",
      color: "green",
    },
      { key: "ML",      value: "PyTorch · Transformers · XGBoost", color: "green" },
   
      { key: "API",     value: "FastAPI · gRPC",      color: "teal" },
      { key: "Data",    value: "PostgreSQL · Redis",  color: "teal" },
      { key: "Cloud",   value: "Docker · Linux · AWS",color: "teal" },
   
      { key: "Focus",   value: "Applied AI Systems",  color: "mauve" },
      { key: "Site",    value: "3p5ilon.github.io",   color: "blue"  },
    ],
  ],

  options: {
    blankBetweenGroups: false, // auto-skip line when neighboring items have different colors
    userHostSep: "@",
    showSwatches: true,
  },

  // Logo Graphic config (Text/Image)
  logo: {
    type: "image", // "text" | "image"

    // Config for text logo mode (ascii)
    text: {
      file: "logo.txt",
      color: "sky",
      fontSize: 8, // 0 = use theme default, or set a custom size (e.g. 10)
    },

    // Config for image logo mode (png/jpg)
    image: {
      path: "logo.png",
      width: 250,
      height: 250,
    },
  },
};
