module.exports = {
  user: "Ɛpsilon",
  host: "3p5ilon",

  info: [
    [
      // Identity
      { key: "User", value: "Ɛpsilon", color: "red" },
      { key: "Host", value: "Mithril AI", color: "red" }, // company/org name
      { key: "Kernel", value: "Applied AI systems", color: "red" }, // what you build/work on
      
      // {
      //   key: "Interests",
      //   value: "Philosophy · Sci-Fi · Cinema · Skateboarding",
      //   color: "pink",
      // },

      // Environment
      { key: "OS", value: "macOS · Arch Linux", color: "blue" },
      { key: "Editor", value: "Neovim · Zed", color: "blue" },

      // Languages
      {
        key: "Langs",
        value: "Python · TypeScript · JavaScript · C++ · Bash · Lua",
        color: "yellow",
      },

      // Web
      {
        key: "Frontend",
        value: "Next.js · Astro · Tailwind · Shadcn",
        color: "teal",
      },
      {
        key: "Backend",
        value: "Node.js · Express · Bun",
        color: "teal",
      },

      // ML/AI
      {
        key: "ML",
        value: "PyTorch · scikit-learn · LLMs · Agents · RAG · NLP",
        color: "green",
      },
      {
        key: "Tools",
        value: "HuggingFace · Ollama · FastAPI · Streamlit ",
        color: "green",
      },

      // Infrastructure
      { key: "Database", value: "PostgreSQL · MySQL · Redis", color: "mauve" },
      { key: "DevOps", value: "Docker · Linux · AWS · Bash", color: "mauve" },

      // Contact
      { key: "Site", value: "3p5ilon.github.io", color: "peach" },
      { key: "Email", value: "log3p5ilon@gmail.com", color: "peach" },
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
