require('dotenv').config();
const db = require('./config/db');

async function seedTanakaOnlineTargets() {
    const promiseDb = db.promise();
    try {
        // Akun-akun Marketing Online Tanaka dengan target bulanan
        const accounts = [
            { account_name: 'Tanaka production',      platform: 'Shopee',            target_bulanan: 13300000 },
            { account_name: 'tanaka_production.id',   platform: 'Shopee',            target_bulanan: 8500000  },
            { account_name: 'tanakaspace',             platform: 'Shopee',            target_bulanan: 50000    },
            { account_name: 'megatamaproduction',      platform: 'Shopee',            target_bulanan: 800000   },
            { account_name: 'tanaka produksi',         platform: 'Tiktok&Tokopedia', target_bulanan: 11600000 },
            { account_name: 'tanakakonveksi',          platform: 'Shopee',            target_bulanan: 60000    },
        ];

        // Target harian = bulanan / 30 hari, target tahunan = bulanan * 12
        for (const acc of accounts) {
            const targetHarian  = Math.round(acc.target_bulanan / 30);
            const targetTahunan = acc.target_bulanan * 12;

            // Insert/update target harian
            await promiseDb.query(
                `INSERT INTO marketing_targets (account_name, target_type, target_value, branch)
                 VALUES (?, 'harian', ?, 'Tanaka')
                 ON DUPLICATE KEY UPDATE target_value = VALUES(target_value)`,
                [acc.account_name, targetHarian]
            );

            // Insert/update target bulanan
            await promiseDb.query(
                `INSERT INTO marketing_targets (account_name, target_type, target_value, branch)
                 VALUES (?, 'bulanan', ?, 'Tanaka')
                 ON DUPLICATE KEY UPDATE target_value = VALUES(target_value)`,
                [acc.account_name, acc.target_bulanan]
            );

            // Insert/update target tahunan
            await promiseDb.query(
                `INSERT INTO marketing_targets (account_name, target_type, target_value, branch)
                 VALUES (?, 'tahunan', ?, 'Tanaka')
                 ON DUPLICATE KEY UPDATE target_value = VALUES(target_value)`,
                [acc.account_name, targetTahunan]
            );

            console.log(`✅ Seeded targets for: ${acc.account_name} (${acc.platform})`);
        }

        console.log('\n🎉 Semua target Marketing Online Tanaka berhasil dimasukkan!');
    } catch (err) {
        console.error('❌ Error:', err.message);
    } finally {
        process.exit(0);
    }
}

seedTanakaOnlineTargets();
