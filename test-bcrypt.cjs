const bcrypt = require('bcryptjs');

const password = 'senha123';
const hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/LewY5GyYIKKrfeKke';

console.log('Testing bcrypt...');
console.log('Password:', password);
console.log('Hash:', hash);

const result = bcrypt.compareSync(password, hash);
console.log('Match:', result);

// Gerar novo hash
const newHash = bcrypt.hashSync(password, 12);
console.log('\nNew hash:', newHash);
const newResult = bcrypt.compareSync(password, newHash);
console.log('New match:', newResult);
