const fs = require('fs');
const files = fs.readdirSync('.').filter(f => f.endsWith('.html'));
files.forEach(f => {
  let content = fs.readFileSync(f, 'utf8');
  content = content.replace(/<script src="((?!http)[^"]+\.js)"><\/script>/g, '<script type="module" src="/$1"></script>');
  fs.writeFileSync(f, content);
});
console.log('Script updated successfully');
