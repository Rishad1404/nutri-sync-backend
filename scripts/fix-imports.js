/* eslint-disable @typescript-eslint/no-unused-vars */
import fs from "fs";
import path from "path";

function fixDir(dir) {
  const files = fs.readdirSync(dir);

  for (const file of files) {
    const full = path.join(dir, file);

    if (fs.statSync(full).isDirectory()) {
      fixDir(full);
      continue;
    }

    if (!file.endsWith(".js")) continue;

    let content = fs.readFileSync(full, "utf8");

    content = content.replace(
      /(import|export)\s+(?:.+?\s+from\s+)?["'](\.\.?\/[^"']+)["']/g,
      (match, type, p1) => {
        // If it already ends in .js, return the match unchanged
        if (p1.endsWith(".js")) return match;

        // Resolve the absolute path of the import
        const targetPath = path.join(path.dirname(full), p1);

        // PRIORITY 1: Does a .js file exist with this exact name?
        if (fs.existsSync(targetPath + ".js")) {
          return match.replace(p1, `${p1}.js`);
        }

        // PRIORITY 2: If no .js file exists, is it a directory?
        let isDirectory = false;
        try {
          isDirectory = fs.statSync(targetPath).isDirectory();
        } catch (e) {
          isDirectory = false;
        }

        if (isDirectory) {
          return match.replace(p1, `${p1}/index.js`);
        }

        // Fallback
        return match.replace(p1, `${p1}.js`);
      },
    );

    fs.writeFileSync(full, content);
  }
}

fixDir("./dist");