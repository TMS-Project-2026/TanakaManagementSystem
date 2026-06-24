// Seed script: Default marketing targets untuk branch Accestret (UPPERCASE account names)
// Harian = Bulanan / 30 | Tahunan = Bulanan x 12

const db = require('./config/db');

const bulananTargets = {
  'ACESTREET.ID':      15000000,
  'BAZAFKAF':           9000000,
  'OTSKAF':             9000000,
  'JOGJA WARUNGLOKAL':  9000000,
  'ACESPOIN':                 0,
  'TASTYNESIA':               0,
};

const targets = [];
Object.entries(bulananTargets).forEach(([account_name, bulanan]) => {
  targets.push({ account_name, target_type: 'bulanan',  target_value: bulanan });
  targets.push({ account_name, target_type: 'harian',   target_value: Math.round(bulanan / 30) });
  targets.push({ account_name, target_type: 'tahunan',  target_value: bulanan * 12 });
});

// Also delete old lowercase entries first
const deleteOldSql = `DELETE FROM marketing_targets WHERE branch = 'Accestret' AND account_name IN (
  'acestreet.id', 'bazafkaf', 'otskaf', 'jogja warunglokal', 'acespoin', 'tastynesia'
)`;

const upsertSql = `
  INSERT INTO marketing_targets (account_name, target_type, target_value, branch)
  VALUES (?, ?, ?, 'Accestret')
  ON DUPLICATE KEY UPDATE target_value = VALUES(target_value), updated_at = CURRENT_TIMESTAMP
`;

db.query(deleteOldSql, [], (delErr) => {
  if (delErr) console.warn('Warning hapus data lama:', delErr.message);
  else console.log('🗑️  Data lama (lowercase) dihapus.\n');

  let done = 0;
  targets.forEach(t => {
    db.query(upsertSql, [t.account_name, t.target_type, t.target_value], (err) => {
      if (err) {
        console.error(`❌ ${t.account_name} [${t.target_type}]:`, err.message);
      } else {
        console.log(`✅ ${t.account_name.padEnd(20)} [${t.target_type.padEnd(8)}] = Rp ${t.target_value.toLocaleString('id-ID')}`);
      }
      done++;
      if (done === targets.length) {
        console.log('\n🎉 Selesai! Semua target Accestret (UPPERCASE) berhasil disimpan.');
        process.exit(0);
      }
    });
  });
});
