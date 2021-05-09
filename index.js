const { readFile } = require("fs").promises;

console.log("Initial");

const getText = async () => {
  const text = await readFile("./text.txt", "utf-8");
  console.log(text);
};

console.log("Final");
