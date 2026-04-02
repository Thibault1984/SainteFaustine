const fs = require('fs');
const path = require('path');

const targetIds = [
    'dynamic-ecole-content',
    'dynamic-projet-content',
    'dynamic-racines-content',
    'dynamic-institutrices-content',
    'dynamic-direction-content',
    'dynamic-locaux-content',
    'dynamic-tarifs-content',
    'dynamic-horaires-content'
];

let sql = `INSERT INTO public.site_content (id, content, type) VALUES\n`;
const values = [];

// Hero titles from index.html manually
values.push(`('site-hero-title', 'En avant pour une nouvelle année de notre mieux, <em>sous le regard de Dieu !</em>', 'text')`);
values.push(`('site-hero-desc', 'Une école à taille humaine au cœur de Poitiers, pour l''épanouissement intégral de chaque enfant.', 'text')`);

const files = [
    'ecole.html', 'projet-educatif.html', 'racines.html', 
    'institutrices.html', 'direction.html', 'locaux.html', 'tarifs-horaires.html'
];

// Removed jsdom requirement

files.forEach(file => {
    const rawHTML = fs.readFileSync(path.join(__dirname, file), 'utf8');
    targetIds.forEach(id => {
        const regex = new RegExp(`<div id="${id}"[^>]*>([\\s\\S]*?)</div>\\s*(?:</div>|</section>|$)`, 'i');
        const match = rawHTML.match(regex);
        let content = '';
        if (match) {
            // Need to handle nested divs roughly. 
            // In institutrices.html and direction.html, we have nested divs.
            // A simple regex string split:
            const parts = rawHTML.split(`id="${id}"`);
            if(parts.length > 1) {
                let textAfterId = parts[1].substring(parts[1].indexOf('>') + 1);
                
                // Find matching closing div
                let divCount = 1;
                let i = 0;
                while (divCount > 0 && i < textAfterId.length) {
                    if (textAfterId.slice(i, i+4) === '<div') divCount++;
                    if (textAfterId.slice(i, i+5) === '</div') divCount--;
                    i++;
                }
                
                content = textAfterId.slice(0, i - 6).trim(); // remove  </div
                // escape single quotes
                const escapedContent = content.replace(/'/g, "''");
                values.push(`('${id}', '${escapedContent}', 'text')`);
            }
        }
    });
});

sql += values.join(',\n') + `\nON CONFLICT (id) DO UPDATE SET content = EXCLUDED.content;`;

fs.writeFileSync(path.join(__dirname, 'supabase_initial_data.sql'), sql);
console.log('SQL file created.');
