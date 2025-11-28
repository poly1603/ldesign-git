const fs = require('fs');
const path = require('path');

const cliSrcDir = path.join(__dirname, '../packages/cli/src');

function replaceImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 替换所有相对路径导入为 @ldesign/git-core
  const replacements = [
    { from: /from ['"]\.\.\/\.\.\/core['"]/g, to: "from '@ldesign/git-core'" },
    { from: /from ['"]\.\.\/\.\.\/analytics['"]/g, to: "from '@ldesign/git-core/analytics'" },
    { from: /from ['"]\.\.\/\.\.\/automation['"]/g, to: "from '@ldesign/git-core/automation'" },
    { from: /from ['"]\.\.\/\.\.\/hooks['"]/g, to: "from '@ldesign/git-core/hooks'" },
    { from: /from ['"]\.\.\/\.\.\/conflict['"]/g, to: "from '@ldesign/git-core/conflict'" },
    { from: /from ['"]\.\.\/\.\.\/types['"]/g, to: "from '@ldesign/git-core/types'" },
    { from: /from ['"]\.\.\/\.\.\/utils['"]/g, to: "from '@ldesign/git-core/utils'" },
    { from: /from ['"]\.\.\/\.\.\/logger['"]/g, to: "from '@ldesign/git-core/logger'" },
    { from: /from ['"]\.\.\/\.\.\/errors['"]/g, to: "from '@ldesign/git-core/errors'" },
    { from: /from ['"]\.\.\/\.\.\/cache['"]/g, to: "from '@ldesign/git-core/cache'" },
  ];

  replacements.forEach(({ from, to }) => {
    if (from.test(content)) {
      content = content.replace(from, to);
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✓ Fixed: ${path.relative(process.cwd(), filePath)}`);
    return true;
  }
  return false;
}

function walkDir(dir) {
  const files = fs.readdirSync(dir);
  let fixedCount = 0;
  
  files.forEach(file => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      fixedCount += walkDir(filePath);
    } else if (file.endsWith('.ts')) {
      if (replaceImports(filePath)) {
        fixedCount++;
      }
    }
  });
  
  return fixedCount;
}

console.log('Fixing CLI imports...\n');
const fixed = walkDir(cliSrcDir);
console.log(`\n✓ Fixed ${fixed} files!`);