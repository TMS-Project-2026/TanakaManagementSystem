const fs = require('fs');
const content = fs.readFileSync('d:\\Semester 6 Magang\\TanakaManagementSystem\\frontend\\src\\pages\\MarketingOnlineBanua.jsx', 'utf8');

function count(char, str) {
  return (str.match(new RegExp(char, 'g')) || []).length;
}

const openDiv = count('<div', content);
const closeDiv = count('</div', content);
const openMain = count('<main', content);
const closeMain = count('</main', content);
const openHeader = count('<header', content);
const closeHeader = count('</header', content);

console.log({ openDiv, closeDiv, openMain, closeMain, openHeader, closeHeader });

const lines = content.split('\n');
let balance = 0;
lines.forEach((line, i) => {
    balance += count('<div', line);
    balance -= count('</div', line);
    if (balance < 0) {
        // console.log(`Warning: Negative balance at line ${i+1}`);
    }
});
console.log('Final Balance:', balance);
